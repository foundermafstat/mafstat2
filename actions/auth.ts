"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

import { prisma, prismaOperation } from "@/lib/prisma"
import { auth, signIn, signOut } from "@/auth"

// Схемы валидации
const registerSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  surname: z.string().optional(),
  nickname: z.string().optional(),
  country: z.string().optional(),
  clubId: z.number().optional()
})

const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Пароль обязателен")
})

const updateProfileSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  surname: z.string().optional(),
  nickname: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
  clubId: z.number().optional().nullable(),
  birthday: z.string().optional().nullable(),
  gender: z.string().optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Текущий пароль обязателен"),
  newPassword: z.string().min(6, "Новый пароль должен содержать минимум 6 символов")
})

/**
 * Регистрация нового пользователя
 */
export async function register(userData: z.infer<typeof registerSchema>) {
  return prismaOperation(
    async () => {
      // Валидация данных
      const validatedData = registerSchema.parse(userData)
      
      // Проверяем, существует ли пользователь с таким email
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingUser) {
        return { 
          error: "Пользователь с таким email уже существует", 
          status: 400 
        }
      }
      
      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(validatedData.password, 10)
      
      // Создаем пользователя
      const newUser = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          surname: validatedData.surname,
          nickname: validatedData.nickname,
          country: validatedData.country,
          clubId: validatedData.clubId,
          role: "user" // По умолчанию обычный пользователь
        }
      })
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = newUser
      
      return { 
        user: userWithoutPassword, 
        status: 201 
      }
    },
    {
      errorMsg: "Ошибка при регистрации пользователя",
      fallbackValue: { error: "Не удалось зарегистрировать пользователя", status: 500 },
      onZodError: (error) => ({ 
        error: "Ошибка валидации данных", 
        details: error.errors, 
        status: 400 
      })
    }
  )
}

/**
 * Вход пользователя в систему
 */
export async function login(credentials: z.infer<typeof loginSchema>) {
  try {
    // Валидация данных
    const { email, password } = loginSchema.parse(credentials)
    
    // Пытаемся аутентифицировать пользователя через NextAuth
    await signIn("credentials", { email, password, redirect: false })
    
    return { success: true, status: 200 }
  } catch (error) {
    console.error("Ошибка входа:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        error: "Ошибка валидации данных", 
        details: error.errors, 
        status: 400 
      }
    }
    
    return { 
      error: "Неверный email или пароль", 
      status: 401 
    }
  }
}

/**
 * Выход пользователя из системы
 */
export async function logout() {
  try {
    // Выполняем выход через NextAuth
    await signOut({ redirect: false })
    
    return { success: true, status: 200 }
  } catch (error) {
    console.error("Ошибка выхода:", error)
    return { 
      error: "Не удалось выйти из системы", 
      status: 500 
    }
  }
}

/**
 * Получение данных текущего пользователя
 */
export async function getCurrentUser() {
  return prismaOperation(
    async () => {
      // Получаем сессию
      const session = await auth()
      
      if (!session?.user?.email) {
        return { 
          error: "Пользователь не аутентифицирован", 
          status: 401 
        }
      }
      
      // Получаем данные пользователя из базы
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          club: true
        }
      })
      
      if (!user) {
        return { 
          error: "Пользователь не найден", 
          status: 404 
        }
      }
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = user
      
      return { 
        user: userWithoutPassword, 
        status: 200 
      }
    },
    {
      errorMsg: "Ошибка при получении данных пользователя",
      fallbackValue: { error: "Не удалось получить данные пользователя", status: 500 }
    }
  )
}

/**
 * Обновление профиля пользователя
 */
export async function updateProfile(profileData: z.infer<typeof updateProfileSchema>) {
  return prismaOperation(
    async () => {
      // Получаем сессию
      const session = await auth()
      
      if (!session?.user?.email) {
        return { 
          error: "Пользователь не аутентифицирован", 
          status: 401 
        }
      }
      
      // Валидация данных
      const validatedData = updateProfileSchema.parse(profileData)
      
      // Преобразуем дату рождения, если она указана
      let birthday = null
      if (validatedData.birthday) {
        birthday = new Date(validatedData.birthday)
      }
      
      // Обновляем профиль
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          name: validatedData.name,
          surname: validatedData.surname,
          nickname: validatedData.nickname,
          country: validatedData.country,
          bio: validatedData.bio,
          image: validatedData.image,
          clubId: validatedData.clubId,
          birthday,
          gender: validatedData.gender
        },
        include: {
          club: true
        }
      })
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = updatedUser
      
      // Обновляем кэш
      revalidatePath('/profile')
      
      return { 
        user: userWithoutPassword, 
        status: 200 
      }
    },
    {
      errorMsg: "Ошибка при обновлении профиля",
      fallbackValue: { error: "Не удалось обновить профиль", status: 500 },
      onZodError: (error) => ({ 
        error: "Ошибка валидации данных", 
        details: error.errors, 
        status: 400 
      })
    }
  )
}

/**
 * Изменение пароля пользователя
 */
export async function changePassword(passwordData: z.infer<typeof changePasswordSchema>) {
  return prismaOperation(
    async () => {
      // Получаем сессию
      const session = await auth()
      
      if (!session?.user?.email) {
        return { 
          error: "Пользователь не аутентифицирован", 
          status: 401 
        }
      }
      
      // Валидация данных
      const validatedData = changePasswordSchema.parse(passwordData)
      
      // Получаем пользователя с паролем
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      
      if (!user || !user.password) {
        return { 
          error: "Пользователь не найден или внешняя аутентификация", 
          status: 404 
        }
      }
      
      // Проверяем текущий пароль
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      )
      
      if (!isCurrentPasswordValid) {
        return { 
          error: "Текущий пароль неверен", 
          status: 400 
        }
      }
      
      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)
      
      // Обновляем пароль
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          password: hashedPassword
        }
      })
      
      return { 
        success: true, 
        message: "Пароль успешно изменен", 
        status: 200 
      }
    },
    {
      errorMsg: "Ошибка при изменении пароля",
      fallbackValue: { error: "Не удалось изменить пароль", status: 500 },
      onZodError: (error) => ({ 
        error: "Ошибка валидации данных", 
        details: error.errors, 
        status: 400 
      })
    }
  )
}

/**
 * Проверка наличия прав администратора
 */
export async function checkAdminAccess() {
  return prismaOperation(
    async () => {
      // Получаем сессию
      const session = await auth()
      
      if (!session?.user?.email) {
        return { 
          isAdmin: false, 
          status: 401 
        }
      }
      
      // Получаем пользователя
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
      })
      
      const isAdmin = user?.role === "admin"
      
      return { 
        isAdmin, 
        status: 200 
      }
    },
    {
      errorMsg: "Ошибка при проверке прав администратора",
      fallbackValue: { isAdmin: false, status: 500 }
    }
  )
}
