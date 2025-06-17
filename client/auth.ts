import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { compare } from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import type { DefaultSession } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { NextAuthOptions } from "next-auth"
import { saveOAuthUser } from "./lib/services/oauth-service"

// Расширение типов NextAuth для дополнительных полей
declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    role: string
  }
  
  interface Session extends DefaultSession {
    user: {
      id: string
      name: string
      email: string
      role: string
    } & DefaultSession["user"]
  }
}

// Расширение типа JWT
declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
  }
}

// Конфигурация NextAuth с корректной типизацией
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Не предоставлены учетные данные")
          return null
        }

        try {
          // Используем direct SQL query с помощью tagged template literals
          const sql = neon(process.env.DATABASE_URL || "")

          // Найти пользователя по email
          const users = await sql`
            SELECT id, name, email, password, role
            FROM users
            WHERE email = ${credentials.email.toLowerCase()}
          `

          if (!users || users.length === 0) {
            console.log("Пользователь не найден")
            return null
          }

          const user = users[0]
          if (!user || !user.password) {
            console.log("Пользователь не найден или нет пароля")
            return null
          }

          // Проверка пароля
          const passwordMatch = await compare(credentials.password, user.password)
          if (!passwordMatch) {
            console.log("Пароль не совпадает")
            return null
          }

          console.log("Успешная авторизация для:", user.email)
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Ошибка аутентификации:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Обрабатываем только OAuth провайдеры
      if (account?.provider && account.provider !== 'credentials' && user.email) {
        try {
          // Сохраняем пользователя в базу данных и отправляем уведомление
          const oauthUser = await saveOAuthUser(
            {
              name: user.name || '',
              email: user.email,
              image: user.image || '',
            },
            account.provider
          );
          
          // Обновляем данные пользователя
          if (oauthUser) {
            user.id = oauthUser.id;
            user.role = oauthUser.role;
          }
        } catch (error) {
          console.error('Ошибка при обработке OAuth входа:', error);
          // Разрешаем вход даже при ошибке, чтобы не блокировать пользователя
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Добавляем поля из User в JWT токен
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Добавляем поля из JWT токена в объект session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "DEVELOPMENT_SECRET",
  session: {
    strategy: "jwt",
  },
}

// Экспортируем функции NextAuth для более удобного использования
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
