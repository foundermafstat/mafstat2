"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma, prismaOperation } from "@/lib/prisma"
import { auth } from "@/auth"

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

/**
 * Получение всех пользователей для админ-панели
 */
export async function getAllUsers() {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403, users: [] }
      }

      const users = await prisma.user.findMany({
        include: {
          club: true
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return { users, status: 200 }
    },
    {
      errorMsg: "Ошибка при получении списка пользователей",
      fallbackValue: { error: "Не удалось получить список пользователей", status: 500, users: [] }
    }
  )
}

/**
 * Получение пользователя по ID
 */
export async function getUserById(id: number) {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403 }
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          club: true,
          subscriptions: {
            orderBy: {
              createdAt: "desc"
            }
          },
          payments: {
            orderBy: {
              createdAt: "desc"
            },
            include: {
              product: true
            }
          }
        }
      })

      if (!user) {
        return { error: "Пользователь не найден", status: 404 }
      }

      return { user, status: 200 }
    },
    {
      errorMsg: `Ошибка при получении пользователя с ID ${id}`,
      fallbackValue: { error: "Не удалось получить данные пользователя", status: 500 }
    }
  )
}

/**
 * Обновление пользователя (доступно только админу)
 */
export async function updateUser(id: number, userData: z.infer<typeof userUpdateSchema>) {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403 }
      }

      // Валидация данных
      const validatedData = userUpdateSchema.parse(userData)

      // Проверяем существование пользователя
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return { error: "Пользователь не найден", status: 404 }
      }

      // Если обновляется email, проверяем его уникальность
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: validatedData.email }
        })

        if (emailExists) {
          return { error: "Пользователь с таким email уже существует", status: 400 }
        }
      }

      // Обновляем пользователя
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...validatedData,
          // Если меняется роль на premium, обновляем дату изменения плана
          ...(validatedData.role === "premium" && { planUpdatedAt: new Date() })
        }
      })

      // Обновляем кэш
      revalidatePath(`/admin/users/${id}`)
      revalidatePath('/admin/users')

      return { user: updatedUser, status: 200 }
    },
    {
      errorMsg: `Ошибка при обновлении пользователя с ID ${id}`,
      fallbackValue: { error: "Не удалось обновить данные пользователя", status: 500 },
      onZodError: (error) => ({
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      })
    }
  )
}

/**
 * Удаление пользователя (доступно только админу)
 */
export async function deleteUser(id: number) {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403 }
      }

      // Проверяем, не пытаемся ли мы удалить текущего пользователя
      if (session.user.id === id) {
        return { error: "Нельзя удалить текущего пользователя", status: 400 }
      }

      // Проверяем существование пользователя
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return { error: "Пользователь не найден", status: 404 }
      }

      // Удаляем пользователя
      await prisma.user.delete({
        where: { id }
      })

      // Обновляем кэш
      revalidatePath('/admin/users')

      return { success: true, status: 200 }
    },
    {
      errorMsg: `Ошибка при удалении пользователя с ID ${id}`,
      fallbackValue: { error: "Не удалось удалить пользователя", status: 500 }
    }
  )
}

/**
 * Получение статистики админ-панели
 */
export async function getAdminStats() {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403 }
      }

      // Получаем общее количество пользователей
      const totalUsers = await prisma.user.count()

      // Получаем количество премиум-пользователей
      const premiumUsers = await prisma.user.count({
        where: { role: "premium" }
      })

      // Получаем количество игр
      const totalGames = await prisma.game.count()

      // Получаем количество клубов
      const totalClubs = await prisma.club.count()

      // Получаем количество федераций
      const totalFederations = await prisma.federation.count()

      // Получаем общую сумму платежей
      const payments = await prisma.payment.findMany({
        where: { status: "completed" }
      })
      
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

      // Получаем количество платежей за последний месяц
      const lastMonthDate = new Date()
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
      
      const lastMonthPayments = await prisma.payment.count({
        where: {
          status: "completed",
          createdAt: {
            gte: lastMonthDate
          }
        }
      })

      return {
        stats: {
          totalUsers,
          premiumUsers,
          totalGames,
          totalClubs,
          totalFederations,
          totalRevenue,
          lastMonthPayments
        },
        status: 200
      }
    },
    {
      errorMsg: "Ошибка при получении статистики для админ-панели",
      fallbackValue: { error: "Не удалось получить статистику", status: 500 }
    }
  )
}

/**
 * Получение всех продуктов для админ-панели
 */
export async function getAllProducts() {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403, products: [] }
      }

      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: "desc"
        }
      })

      return { products, status: 200 }
    },
    {
      errorMsg: "Ошибка при получении списка продуктов",
      fallbackValue: { error: "Не удалось получить список продуктов", status: 500, products: [] }
    }
  )
}

/**
 * Получение всех платежей для админ-панели
 */
export async function getAllPayments() {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403, payments: [] }
      }

      const payments = await prisma.payment.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true
            }
          },
          product: true
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return { payments, status: 200 }
    },
    {
      errorMsg: "Ошибка при получении списка платежей",
      fallbackValue: { error: "Не удалось получить список платежей", status: 500, payments: [] }
    }
  )
}

/**
 * Получение всех подписок для админ-панели
 */
export async function getAllSubscriptions() {
  return prismaOperation(
    async () => {
      // Проверяем, авторизован ли пользователь и является ли он админом
      const session = await auth()
      if (!session?.user || session.user.role !== "admin") {
        return { error: "Нет доступа", status: 403, subscriptions: [] }
      }

      const subscriptions = await prisma.subscription.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return { subscriptions, status: 200 }
    },
    {
      errorMsg: "Ошибка при получении списка подписок",
      fallbackValue: { error: "Не удалось получить список подписок", status: 500, subscriptions: [] }
    }
  )
}
