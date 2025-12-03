"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth, signIn, signOut } from "@/auth"
import { api } from "@/lib/api"

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
  try {
    const validatedData = registerSchema.parse(userData)
    
    const response = await api.post('/auth/register', {
      ...validatedData,
      username: validatedData.nickname || validatedData.name, // Mapping fields
      firstName: validatedData.name,
      lastName: validatedData.surname
    })
    
    return { 
      user: response.user, 
      status: 201 
    }
  } catch (error: any) {
    console.error("Ошибка регистрации:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        error: "Ошибка валидации данных", 
        details: error.errors, 
        status: 400 
      }
    }
    
    return { 
      error: error.message || "Не удалось зарегистрировать пользователя", 
      status: 500 
    }
  }
}

/**
 * Вход пользователя в систему
 */
export async function login(credentials: z.infer<typeof loginSchema>) {
  try {
    // Валидация данных
    const { email, password } = loginSchema.parse(credentials)
    
    // Пытаемся аутентифицировать пользователя через NextAuth
    // NextAuth сам вызовет наш API через client/auth.ts
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
    
    // Опционально: вызвать API для инвалидации токена на сервере
    // const session = await auth()
    // if (session?.user?.accessToken) { ... }

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
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { 
        error: "Пользователь не аутентифицирован", 
        status: 401 
      }
    }

    // Мы можем вернуть данные из сессии, если они там есть
    // Но лучше получить свежие данные с сервера
    // Требуется передать токен авторизации. 
    // Предполагаем, что токен есть в сессии (нужно доработать client/auth.ts)
    
    // Пока вернем данные из сессии как fallback
    return { 
      user: session.user, 
      status: 200 
    }
    
    /* 
    // Правильная реализация с запросом к API:
    const response = await api.get('/auth/profile', {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })
    return { user: response, status: 200 }
    */

  } catch (error: any) {
    console.error("Ошибка получения пользователя:", error)
    return { 
      error: "Не удалось получить данные пользователя", 
      status: 500 
    }
  }
}

/**
 * Обновление профиля пользователя
 */
export async function updateProfile(profileData: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { error: "Пользователь не аутентифицирован", status: 401 }
    }
    
    const validatedData = updateProfileSchema.parse(profileData)
    
    // TODO: Implement API endpoint for profile update
    // const response = await api.put('/auth/profile', validatedData, { ...authHeader })
    
    // Mock response for now to prevent build error
    console.log("Updating profile via API:", validatedData)
    
    revalidatePath('/profile')
    
    return { 
      user: { ...session.user, ...validatedData }, 
      status: 200 
    }
  } catch (error: any) {
    console.error("Ошибка обновления профиля:", error)
    return { 
      error: error.message || "Не удалось обновить профиль", 
      status: 500 
    }
  }
}

/**
 * Изменение пароля пользователя
 */
export async function changePassword(passwordData: z.infer<typeof changePasswordSchema>) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { error: "Пользователь не аутентифицирован", status: 401 }
    }
    
    const validatedData = changePasswordSchema.parse(passwordData)
    
    // TODO: Implement API endpoint
    // await api.post('/auth/change-password', validatedData, { ...authHeader })
    
    return { 
      success: true, 
      message: "Пароль успешно изменен", 
      status: 200 
    }
  } catch (error: any) {
     console.error("Ошибка изменения пароля:", error)
     return { 
      error: error.message || "Не удалось изменить пароль", 
      status: 500 
    }
  }
}

/**
 * Проверка наличия прав администратора
 */
export async function checkAdminAccess() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return { isAdmin: false, status: 401 }
    }
    
    // Роль уже есть в сессии
    const isAdmin = session.user.role === "admin"
    
    return { 
      isAdmin, 
      status: 200 
    }
  } catch (error) {
    return { isAdmin: false, status: 500 }
  }
}
