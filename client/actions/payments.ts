"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"

// Схема для валидации данных платежа при создании
const createPaymentSchema = z.object({
  userId: z.string(), // Assuming ID is kept as string for API compatibility even if it's Int in DB
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
  try {
    const payments = await api.get('/payments')
    return { data: payments, status: 200 }
  } catch (error: any) {
    console.error("Не удалось получить список платежей:", error)
    return {
      error: error.message || "Не удалось получить список платежей",
      status: 500,
      data: []
    }
  }
}

/**
 * Получение платежей пользователя
 */
export async function getUserPayments(userId: string) {
  if (!userId) {
    return { error: "ID пользователя не указан", status: 400 }
  }

  try {
    const payments = await api.get(`/users/${userId}/payments`)
    return { data: payments, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при получении платежей пользователя (ID: ${userId}):`, error)
    return {
      error: error.message || "Не удалось получить платежи пользователя",
      status: 500,
      data: []
    }
  }
}

/**
 * Получение платежа по ID
 */
export async function getPaymentById(id: string) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  try {
    const payment = await api.get(`/payments/${id}`)
    
    if (!payment) {
      return { error: "Платеж не найден", status: 404 }
    }

    return { data: payment, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при получении платежа (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось получить данные платежа",
      status: 500
    }
  }
}

/**
 * Создание нового платежа
 */
export async function createPayment(paymentData: CreatePaymentInput) {
  try {
    // Валидация данных
    const validatedData = createPaymentSchema.parse(paymentData)

    const newPayment = await api.post('/payments', validatedData)

    // Обновление кэша страниц
    revalidatePath('/payments')
    revalidatePath('/admin/payments')
    revalidatePath(`/users/${validatedData.userId}`)

    return { data: newPayment, status: 201 }
  } catch (error: any) {
    console.error("Ошибка при создании платежа:", error)
    
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось создать платеж",
      status: 500
    }
  }
}

/**
 * Обновление платежа
 */
export async function updatePayment(id: string, paymentData: UpdatePaymentInput) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  try {
    // Валидация данных
    const validatedData = updatePaymentSchema.parse(paymentData)

    const updatedPayment = await api.put(`/payments/${id}`, validatedData)

    // Обновление кэша страниц
    revalidatePath('/payments')
    revalidatePath(`/payments/${id}`)
    revalidatePath('/admin/payments')
    if (updatedPayment.userId) {
        revalidatePath(`/users/${updatedPayment.userId}`)
    }

    return { data: updatedPayment, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при обновлении платежа (ID: ${id}):`, error)
    
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось обновить платеж",
      status: 500
    }
  }
}

/**
 * Удаление платежа
 */
export async function deletePayment(id: string) {
  if (!id) {
    return { error: "ID платежа не указан", status: 400 }
  }

  try {
    await api.delete(`/payments/${id}`)

    // Обновление кэша страниц
    revalidatePath('/payments')
    revalidatePath('/admin/payments')
    // Note: We can't revalidate user page easily without knowing user ID before delete
    // unless API returns it

    return { data: { id, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении платежа (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось удалить платеж",
      status: 500
    }
  }
}
