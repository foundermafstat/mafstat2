"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma, prismaOperation } from "@/lib/prisma"

// Схема для валидации данных платежа при создании
const createPaymentSchema = z.object({
  userId: z.string().uuid("ID пользователя должен быть в формате UUID"),
  amount: z.number().positive("Сумма должна быть положительной"),
  currency: z.string().default("RUB"),
  status: z.enum(["pending", "completed", "failed", "refunded"]).default("pending"),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.any().optional()
})

// Схема для валидации при обновлении (все поля опциональны)
const updatePaymentSchema = createPaymentSchema.partial()

// Типы для входных данных
type CreatePaymentInput = z.infer<typeof createPaymentSchema>
type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

/**
 * Получение списка всех платежей
 */
export async function getAllPayments() {
  return prismaOperation(
    async () => {
      const payments = await prisma.payment.findMany({
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          description: true,
          externalId: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      // Форматирование данных для соответствия предыдущему ответу
      const formattedPayments = payments.map(payment => ({
        ...payment,
        user_name: payment.user ? 
          (payment.user.name || payment.user.nickname) : 
          null
      }))

      return { data: formattedPayments, status: 200 }
    },
    {
      errorMsg: "Ошибка при получении списка платежей",
      fallbackValue: {
        error: "Не удалось получить список платежей",
        status: 500,
        data: []
      }
    }
  )
}

/**
 * Получение платежей пользователя
 */
export async function getUserPayments(userId: string) {
  if (!userId) {
    return { error: "ID пользователя не указан", status: 400 }
  }

  return prismaOperation(
    async () => {
      const payments = await prisma.payment.findMany({
        where: {
          userId
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return { data: payments, status: 200 }
    },
    {
      errorMsg: `Ошибка при получении платежей пользователя (ID: ${userId})`,
      fallbackValue: {
        error: "Не удалось получить платежи пользователя",
        status: 500,
        data: []
      }
    }
  )
}

/**
 * Получение платежа по ID
 */
export async function getPaymentById(id: string) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  return prismaOperation(
    async () => {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true
            }
          }
        }
      })

      if (!payment) {
        return { error: "Платеж не найден", status: 404 }
      }

      // Форматирование данных для соответствия предыдущему ответу
      const formattedPayment = {
        ...payment,
        user_name: payment.user ? 
          (payment.user.name || payment.user.nickname) : 
          null,
        user_email: payment.user?.email
      }

      return { data: formattedPayment, status: 200 }
    },
    {
      errorMsg: `Ошибка при получении платежа (ID: ${id})`,
      fallbackValue: {
        error: "Не удалось получить данные платежа",
        status: 500
      }
    }
  )
}

/**
 * Создание нового платежа
 */
export async function createPayment(paymentData: CreatePaymentInput) {
  return prismaOperation(
    async () => {
      // Валидация данных
      const validatedData = createPaymentSchema.parse(paymentData)

      // Проверка существования пользователя
      const user = await prisma.user.findUnique({
        where: { id: validatedData.userId }
      })

      if (!user) {
        return { error: "Пользователь не найден", status: 404 }
      }

      // Подготовка метаданных
      const metadata = typeof validatedData.metadata === 'string'
        ? validatedData.metadata
        : validatedData.metadata ? JSON.stringify(validatedData.metadata) : null

      // Создание платежа
      const newPayment = await prisma.payment.create({
        data: {
          userId: validatedData.userId,
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: validatedData.status,
          paymentMethod: validatedData.paymentMethod,
          description: validatedData.description,
          externalId: validatedData.externalId,
          metadata
        }
      })

      // Обновление кэша страниц
      revalidatePath('/payments')
      revalidatePath('/admin/payments')
      revalidatePath(`/users/${validatedData.userId}`)

      return { data: newPayment, status: 201 }
    },
    {
      errorMsg: "Ошибка при создании платежа",
      fallbackValue: {
        error: "Не удалось создать платеж",
        status: 500
      },
      onZodError: (error) => ({
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      })
    }
  )
}

/**
 * Обновление платежа
 */
export async function updatePayment(id: string, paymentData: UpdatePaymentInput) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  return prismaOperation(
    async () => {
      // Валидация данных
      const validatedData = updatePaymentSchema.parse(paymentData)

      // Проверка существования платежа
      const existingPayment = await prisma.payment.findUnique({
        where: { id }
      })

      if (!existingPayment) {
        return { error: "Платеж не найден", status: 404 }
      }

      // Если указан userId, проверяем его существование
      if (validatedData.userId) {
        const user = await prisma.user.findUnique({
          where: { id: validatedData.userId }
        })

        if (!user) {
          return { error: "Пользователь не найден", status: 404 }
        }
      }

      // Подготовка метаданных
      let processedMetadata = validatedData.metadata
      if (validatedData.metadata !== undefined) {
        processedMetadata = typeof validatedData.metadata === 'string'
          ? validatedData.metadata
          : JSON.stringify(validatedData.metadata)
      }

      // Обновление платежа
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          ...(validatedData.userId && { userId: validatedData.userId }),
          ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
          ...(validatedData.currency !== undefined && { currency: validatedData.currency }),
          ...(validatedData.status !== undefined && { status: validatedData.status }),
          ...(validatedData.paymentMethod !== undefined && { paymentMethod: validatedData.paymentMethod }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.externalId !== undefined && { externalId: validatedData.externalId }),
          ...(validatedData.metadata !== undefined && { metadata: processedMetadata })
        }
      })

      // Обновление кэша страниц
      revalidatePath('/payments')
      revalidatePath(`/payments/${id}`)
      revalidatePath('/admin/payments')
      revalidatePath(`/users/${updatedPayment.userId}`)

      return { data: updatedPayment, status: 200 }
    },
    {
      errorMsg: `Ошибка при обновлении платежа (ID: ${id})`,
      fallbackValue: {
        error: "Не удалось обновить платеж",
        status: 500
      },
      onZodError: (error) => ({
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      })
    }
  )
}

/**
 * Удаление платежа
 */
export async function deletePayment(id: string) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  return prismaOperation(
    async () => {
      // Проверка существования платежа
      const existingPayment = await prisma.payment.findUnique({
        where: { id }
      })

      if (!existingPayment) {
        return { error: "Платеж не найден", status: 404 }
      }

      // Сохраняем ID пользователя для обновления кэша
      const userId = existingPayment.userId

      // Удаление платежа
      await prisma.payment.delete({
        where: { id }
      })

      // Обновление кэша страниц
      revalidatePath('/payments')
      revalidatePath('/admin/payments')
      revalidatePath(`/users/${userId}`)

      return { data: { id, deleted: true }, status: 200 }
    },
    {
      errorMsg: `Ошибка при удалении платежа (ID: ${id})`,
      fallbackValue: {
        error: "Не удалось удалить платеж",
        status: 500
      }
    }
  )
}
