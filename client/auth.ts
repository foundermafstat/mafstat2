import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import type { DefaultSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { saveOAuthUser } from "./lib/services/oauth-service"
import { api } from "./lib/api"

// Расширение типов NextAuth для дополнительных полей
declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    role: string
    accessToken?: string
  }
  
  interface Session extends DefaultSession {
    user: {
      id: string
      name: string
      email: string
      role: string
      accessToken?: string
    } & DefaultSession["user"]
  }
}

// Расширение типа JWT
declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    accessToken?: string
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
          return null
        }

        try {
          // Call the backend API to login
          const response = await api.post('/auth/login', {
            email: credentials.email,
            password: credentials.password
          });

          if (response && response.user && response.accessToken) {
            return {
              id: response.user.id.toString(),
              name: response.user.name || response.user.username || 'User',
              email: response.user.email,
              role: response.user.role || 'user',
              accessToken: response.accessToken
            }
          }
          
          return null
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
          // Сохраняем пользователя через API
          const oauthUser = await saveOAuthUser(
            {
              name: user.name || '',
              email: user.email,
              image: user.image || '',
            },
            account.provider,
            account.providerAccountId
          );
          
          // Обновляем данные пользователя
          if (oauthUser) {
            user.id = oauthUser.id;
            user.role = oauthUser.role;
          }
        } catch (error) {
          console.error('Ошибка при обработке OAuth входа:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Добавляем поля из User в JWT токен
      if (user) {
        token.id = user.id
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      // Добавляем поля из JWT токена в объект session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.accessToken = token.accessToken as string
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
