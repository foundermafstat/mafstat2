"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"

export type Club = {
  id: number
  name: string
  description: string | null
  url: string | null
  country: string | null
  city: string | null
  federation_id: number | null
  federation_name: string | null
  player_count: number
  game_count: number
  players: {
    id: number
    name: string
    surname: string | null
    nickname: string | null
  }[]
  created_at: Date
  updated_at: Date
}

// Схема для валидации данных клуба при создании
const createClubSchema = z.object({
  name: z.string().min(1, "Название клуба обязательно"),
  description: z.string().optional(),
  url: z.string().url("Некорректный URL").optional().nullable(),
  country: z.string().optional(),
  city: z.string().optional(),
  federation_id: z.number().optional().nullable()
})

// Схема для валидации при обновлении (все поля опциональны)
const updateClubSchema = createClubSchema.partial()

// Cache for clubs data
const CLUBS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedClubs: Club[] | null = null;
let lastClubsFetchTime = 0;

// Получение списка всех клубов
export async function getAllClubs() {
  // Return cached data if it's still valid
  const now = Date.now();
  if (cachedClubs && (now - lastClubsFetchTime) < CLUBS_CACHE_TTL) {
    return { data: cachedClubs };
  }

  try {
    const clubs = await api.get('/clubs')

    // Update cache
    cachedClubs = clubs;
    lastClubsFetchTime = now;

    return { data: clubs };
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return { data: [] };
  }
}

// Получение клуба по ID
export async function getClubById(id: string) {
  if (!id) {
    return { error: "ID клуба не указан", status: 400 }
  }

  const clubId = Number.parseInt(id, 10)
  if (Number.isNaN(clubId)) {
    return { error: "Некорректный ID клуба", status: 400 }
  }

  try {
    const club = await api.get(`/clubs/${clubId}`)
    
    if (!club) {
      return { error: "Клуб не найден", status: 404 }
    }

    return { data: club, status: 200 }
  } catch (error: any) {
    return { error: error.message || `Не удалось получить данные клуба (ID: ${id})`, status: 500 }
  }
}

// Создание нового клуба
export async function createClub(clubData: z.infer<typeof createClubSchema>) {
  try {
    // Валидация данных
    const validatedData = createClubSchema.parse(clubData)

    const newClub = await api.post('/clubs', validatedData)

    // Обновление кэша страниц
    revalidatePath('/clubs')
    revalidatePath('/admin/clubs')

    return { data: newClub, status: 201 }
  } catch (error: any) {
    console.error("Ошибка при создании клуба:", error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось создать клуб",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Обновление клуба
export async function updateClub(id: string, clubData: z.infer<typeof updateClubSchema>) {
  try {
    if (!id) {
      return { error: "ID клуба не указан", status: 400 }
    }

    // Валидация данных
    const validatedData = updateClubSchema.parse(clubData)

    const result = await api.put(`/clubs/${id}`, validatedData)

    // Обновление кэша страниц
    revalidatePath('/clubs')
    revalidatePath(`/clubs/${id}`)
    revalidatePath('/admin/clubs')

    return { data: result, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при обновлении клуба (ID: ${id}):`, error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось обновить клуб",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Удаление клуба
export async function deleteClub(id: string) {
  try {
    if (!id) {
      return { error: "ID клуба не указан", status: 400 }
    }

    await api.delete(`/clubs/${id}`)

    // Обновление кэша страниц
    revalidatePath('/clubs')
    revalidatePath('/admin/clubs')

    return { data: { id, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении клуба (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось удалить клуб",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
