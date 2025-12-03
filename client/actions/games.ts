"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"

// Схема для валидации данных игры при создании
const createGameSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  game_type: z.string().min(1, "Тип игры обязателен"),
  result: z.string().optional(),
  referee_id: z.number().optional(),
  referee_comments: z.string().optional(),
  table_number: z.number().int().optional(),
  club_id: z.number().optional(),
  federation_id: z.number().optional()
})

// Схема для валидации при обновлении (все поля опциональны)
const updateGameSchema = createGameSchema.partial()

// Получение списка всех игр
export async function getAllGames() {
  try {
    const games = await api.get('/games')
    return { data: games, status: 200 }
  } catch (error: any) {
    console.error("Не удалось получить список игр:", error)
    return { data: [], status: 500, error: error.message }
  }
}

// Получение игры по ID
export async function getGameById(id: string) {
  if (!id) {
    return { error: "ID игры не указан", status: 400 }
  }

  const gameId = Number.parseInt(id, 10)
  if (Number.isNaN(gameId)) {
    return { error: "Некорректный ID игры", status: 400 }
  }

  try {
    const game = await api.get(`/games/${gameId}`)
    
    if (!game) {
      return { error: "Игра не найдена", status: 404 }
    }

    return { data: game, status: 200 }
  } catch (error: any) {
    console.error(`Не удалось получить данные игры (ID: ${id}):`, error)
    return { error: error.message || "Не удалось получить данные игры", status: 500 }
  }
}

// Создание новой игры
export async function createGame(gameData: z.infer<typeof createGameSchema>) {
  try {
    // Валидация данных
    const validatedData = createGameSchema.parse(gameData)

    const newGame = await api.post('/games', validatedData)

    // Обновление кэша страниц
    revalidatePath('/games')
    revalidatePath('/admin/games')

    return { data: newGame, status: 201 }
  } catch (error: any) {
    console.error("Ошибка при создании игры:", error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось создать игру",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Обновление игры
export async function updateGame(id: string, gameData: z.infer<typeof updateGameSchema>) {
  try {
    if (!id) {
      return { error: "ID игры не указан", status: 400 }
    }

    const gameId = Number.parseInt(id, 10)
    if (Number.isNaN(gameId)) {
      return { error: "Некорректный ID игры", status: 400 }
    }

    // Валидация данных
    const validatedData = updateGameSchema.parse(gameData)

    const result = await api.put(`/games/${gameId}`, validatedData)

    // Обновление кэша страниц
    revalidatePath('/games')
    revalidatePath(`/games/${id}`)
    revalidatePath('/admin/games')

    return { data: result, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при обновлении игры (ID: ${id}):`, error)
    
    // Проверка на ошибку валидации
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: error.message || "Не удалось обновить игру",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Удаление игры
export async function deleteGame(id: string) {
  try {
    if (!id) {
      return { error: "ID игры не указан", status: 400 }
    }

    const gameId = Number.parseInt(id, 10)
    if (Number.isNaN(gameId)) {
      return { error: "Некорректный ID игры", status: 400 }
    }

    await api.delete(`/games/${gameId}`)

    // Обновление кэша страниц
    revalidatePath('/games')
    revalidatePath('/admin/games')

    return { data: { id: gameId, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении игры (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось удалить игру",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Добавление игрока в игру
export async function addPlayerToGame(
  gameId: string, 
  playerId: string, 
  role: string, 
  slotNumber: number
) {
  try {
    if (!gameId || !playerId || !role || slotNumber === undefined) {
      return { 
        error: "Не указаны все необходимые данные (ID игры, ID игрока, роль, номер слота)", 
        status: 400 
      }
    }

    const result = await api.post(`/games/${gameId}/players`, {
      playerId,
      role,
      slotNumber
    })

    // Обновление кэша страниц
    revalidatePath(`/games/${gameId}`)
    revalidatePath('/admin/games')

    return { data: result, status: 201 }
  } catch (error: any) {
    console.error(`Ошибка при добавлении игрока в игру:`, error)
    return {
      error: error.message || "Не удалось добавить игрока в игру",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Удаление игрока из игры
export async function removePlayerFromGame(
  gameId: string, 
  gamePlayerId: string
) {
  try {
    if (!gameId || !gamePlayerId) {
      return { 
        error: "Не указаны все необходимые данные (ID игры, ID записи игрока в игре)", 
        status: 400 
      }
    }

    await api.delete(`/games/${gameId}/players/${gamePlayerId}`)

    // Обновление кэша страниц
    revalidatePath(`/games/${gameId}`)
    revalidatePath('/admin/games')

    return { data: { id: gamePlayerId, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении игрока из игры:`, error)
    return {
      error: error.message || "Не удалось удалить игрока из игры",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
