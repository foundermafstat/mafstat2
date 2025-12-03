"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"

// Схема для валидации данных федерации при создании
const createFederationSchema = z.object({
  name: z.string().min(1, "Название федерации обязательно"),
  description: z.string().optional(),
  url: z.string().url("Некорректный URL").optional().nullable(),
  country: z.string().optional(),
  city: z.string().optional(),
  additional_points_conditions: z.any().optional()
})

// Схема для валидации при обновлении (все поля опциональны)
const updateFederationSchema = createFederationSchema.partial()

// Получение списка всех федераций
export async function getAllFederations() {
  try {
    const federations = await api.get('/federations')
    return { data: federations, status: 200 }
  } catch (error: any) {
    console.error("Не удалось получить список федераций:", error)
    return { data: [], status: 500, error: error.message }
  }
}

// Получение федерации по ID
export async function getFederationById(id: string) {
  if (!id) {
    return { error: "ID федерации не указан", status: 400 }
  }

  const federationId = Number.parseInt(id, 10)
  if (Number.isNaN(federationId)) {
    return { error: "Некорректный ID федерации", status: 400 }
  }

  try {
    const federation = await api.get(`/federations/${federationId}`)
    
    if (!federation) {
      return { error: "Федерация не найдена", status: 404 }
    }

    return { data: federation, status: 200 }
  } catch (error: any) {
    console.error(`Не удалось получить данные федерации (ID: ${id}):`, error)
    return { error: error.message || "Не удалось получить данные федерации", status: 500 }
  }
}

// Создание новой федерации
export async function createFederation(federationData: z.infer<typeof createFederationSchema>) {
  try {
    // Валидация данных
    const validatedData = createFederationSchema.parse(federationData)

    const newFederation = await api.post('/federations', validatedData)

    // Обновление кэша страниц
    revalidatePath('/federations')
    revalidatePath('/admin/federations')

    return { data: newFederation, status: 201 }
  } catch (error: any) {
    console.error("Ошибка при создании федерации:", error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось создать федерацию",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Обновление федерации
export async function updateFederation(id: string, federationData: z.infer<typeof updateFederationSchema>) {
  try {
    if (!id) {
      return { error: "ID федерации не указан", status: 400 }
    }

    const federationId = Number.parseInt(id, 10)
    if (Number.isNaN(federationId)) {
      return { error: "Некорректный ID федерации", status: 400 }
    }

    // Валидация данных
    const validatedData = updateFederationSchema.parse(federationData)

    const result = await api.put(`/federations/${federationId}`, validatedData)

    // Обновление кэша страниц
    revalidatePath('/federations')
    revalidatePath(`/federations/${id}`)
    revalidatePath('/admin/federations')

    return { data: result, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при обновлении федерации (ID: ${id}):`, error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось обновить федерацию",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Удаление федерации
export async function deleteFederation(id: string) {
  try {
    if (!id) {
      return { error: "ID федерации не указан", status: 400 }
    }

    const federationId = Number.parseInt(id, 10)
    if (Number.isNaN(federationId)) {
      return { error: "Некорректный ID федерации", status: 400 }
    }

    await api.delete(`/federations/${federationId}`)

    // Обновление кэша страниц
    revalidatePath('/federations')
    revalidatePath('/admin/federations')

    return { data: { id: federationId, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении федерации (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось удалить федерацию",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
