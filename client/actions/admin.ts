"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/auth"
import { api } from "@/lib/api"

// Схемы валидации 
const userUpdateSchema = z.object({
  role: z.enum(["user", "admin", "premium"]).optional(),
  premiumNights: z.number().min(0).optional(),
  isTournamentJudge: z.boolean().optional(),
  isSideJudge: z.boolean().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  nickname: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  clubId: z.number().optional().nullable(),
})

// Check admin access
async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "admin") {
    return false
  }
  return true
}

/**
 * Получение всех пользователей для админ-панели
 */
export async function getAllUsers() {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403, users: [] }
    }

    const users = await api.get('/admin/users')
    return { users, status: 200 }
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return { error: "Не удалось получить список пользователей", status: 500, users: [] }
  }
}

/**
 * Получение пользователя по ID
 */
export async function getUserById(id: number) {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403 }
    }

    const user = await api.get(`/admin/users/${id}`)
    
    if (!user) {
      return { error: "Пользователь не найден", status: 404 }
    }

    return { user, status: 200 }
  } catch (error: any) {
    console.error(`Error fetching user ${id}:`, error)
    return { error: "Не удалось получить данные пользователя", status: 500 }
  }
}

/**
 * Обновление пользователя (доступно только админу)
 */
export async function updateUser(id: number, userData: z.infer<typeof userUpdateSchema>) {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403 }
    }

    const validatedData = userUpdateSchema.parse(userData)
    
    const updatedUser = await api.put(`/admin/users/${id}`, validatedData)

    revalidatePath(`/admin/users/${id}`)
    revalidatePath('/admin/users')

    return { user: updatedUser, status: 200 }
  } catch (error: any) {
    console.error(`Error updating user ${id}:`, error)
    
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return { error: error.message || "Не удалось обновить данные пользователя", status: 500 }
  }
}

/**
 * Удаление пользователя (доступно только админу)
 */
export async function deleteUser(id: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { error: "Нет доступа", status: 403 }
    }

    // Проверяем, не пытаемся ли мы удалить текущего пользователя
    if (parseInt(session.user.id) === id) {
      return { error: "Нельзя удалить текущего пользователя", status: 400 }
    }

    await api.delete(`/admin/users/${id}`)

    revalidatePath('/admin/users')

    return { success: true, status: 200 }
  } catch (error: any) {
    console.error(`Error deleting user ${id}:`, error)
    return { error: error.message || "Не удалось удалить пользователя", status: 500 }
  }
}

/**
 * Получение статистики админ-панели
 */
export async function getAdminStats() {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403 }
    }

    const stats = await api.get('/admin/stats')
    return { stats, status: 200 }
  } catch (error: any) {
    console.error("Error fetching admin stats:", error)
    return { error: "Не удалось получить статистику", status: 500 }
  }
}

/**
 * Получение всех продуктов для админ-панели
 */
export async function getAllProducts() {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403, products: [] }
    }

    const products = await api.get('/admin/products')
    return { products, status: 200 }
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return { error: "Не удалось получить список продуктов", status: 500, products: [] }
  }
}

/**
 * Получение всех платежей для админ-панели
 */
export async function getAllPayments() {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403, payments: [] }
    }

    const payments = await api.get('/admin/payments')
    return { payments, status: 200 }
  } catch (error: any) {
    console.error("Error fetching payments:", error)
    return { error: "Не удалось получить список платежей", status: 500, payments: [] }
  }
}

/**
 * Получение всех подписок для админ-панели
 */
export async function getAllSubscriptions() {
  try {
    if (!(await checkAdmin())) {
      return { error: "Нет доступа", status: 403, subscriptions: [] }
    }

    const subscriptions = await api.get('/admin/subscriptions')
    return { subscriptions, status: 200 }
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error)
    return { error: "Не удалось получить список подписок", status: 500, subscriptions: [] }
  }
}
