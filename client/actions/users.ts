"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { api } from "@/lib/api"

// Схема для валидации данных пользователя при создании
const createUserSchema = z.object({
  name: z.string().min(1, "Имя обязательно"),
  surname: z.string().min(1, "Фамилия обязательна"),
  nickname: z.string().min(1, "Никнейм обязателен"),
  email: z.string().email("Неверный формат email"),
  password: z.string().optional(),
  image: z.string().optional(),
  bio: z.string().optional(),
  country: z.string().optional(),
  club_id: z.number().optional(), 
  birthday: z.string().optional(),
  gender: z.string().optional(),
  is_tournament_judge: z.boolean().default(false),
  is_side_judge: z.boolean().default(false),
  role: z.string().default("user")
})

// Схема для валидации при обновлении (все поля опциональны)
const updateUserSchema = createUserSchema.partial()

export interface UserWithStats {
  id: string
  name: string | null
  surname: string | null
  nickname: string | null
  email: string
  image: string | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  role: string
  country: string | null
  birthday: Date | null
  gender: string | null
  club_id: number | null
  club_name: string | null
  club_city: string | null
  club_country: string | null
  total_games: number
  civ_win_rate: string
  mafia_win_rate: string
  sheriff_win_rate: string
  don_win_rate: string
  avg_additional_points: string
  total_fouls: number
}

// Cache the users data for 60 seconds
const USERS_CACHE_TTL = 60 * 1000; // 1 minute
let cachedUsers: UserWithStats[] | null = null;
let lastFetchTime = 0;

export async function getUsersWithStats(): Promise<UserWithStats[]> {
  // Return cached data if it's still valid
  const now = Date.now();
  if (cachedUsers && (now - lastFetchTime) < USERS_CACHE_TTL) {
    return cachedUsers;
  }

  try {
    // Get users with stats from API
    const users = await api.get('/users/stats')
    
    // Update cache
    cachedUsers = users;
    lastFetchTime = now;

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Получение списка всех пользователей
export async function getAllUsers({ clubId }: { clubId?: number } = {}) {
  try {
    const endpoint = clubId ? `/users?clubId=${clubId}` : '/users'
    const users = await api.get(endpoint)
    return { data: users, status: 200 }
  } catch (error) {
    console.error("Не удалось получить список пользователей:", error)
    return { data: [], status: 500 }
  }
}

// Получение пользователя по ID
export async function getUserById(id: string) {
  if (!id) {
    return { error: "ID пользователя не указан", status: 400 }
  }

  try {
    const user = await api.get(`/users/${id}`)
    
    if (!user) {
      return { error: "Пользователь не найден", status: 404 }
    }

    return { data: user, status: 200 }
  } catch (error: any) {
    console.error(`Не удалось получить данные пользователя (ID: ${id}):`, error)
    return { error: error.message || "Не удалось получить данные пользователя", status: 500 }
  }
}

// Создание нового пользователя
export async function createUser(userData: z.infer<typeof createUserSchema>) {
  try {
    const validatedData = createUserSchema.parse(userData)

    const newUser = await api.post('/users', validatedData)

    revalidatePath('/users')
    revalidatePath('/admin/users')

    return { data: newUser, status: 201 }
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error)
    
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: "Не удалось создать пользователя",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Обновление пользователя
export async function updateUser(id: string, userData: z.infer<typeof updateUserSchema>) {
  try {
    if (!id) {
      return { error: "ID пользователя не указан", status: 400 }
    }

    const validatedData = updateUserSchema.parse(userData)

    const result = await api.put(`/users/${id}`, validatedData)

    revalidatePath('/users')
    revalidatePath(`/users/${id}`)
    revalidatePath('/admin/users')

    return { data: result, status: 200 }
  } catch (error) {
    console.error(`Ошибка при обновлении пользователя (ID: ${id}):`, error)
    
    if (error instanceof z.ZodError) {
      return {
        error: "Ошибка валидации данных",
        details: error.errors,
        status: 400
      }
    }
    
    return {
      error: "Не удалось обновить пользователя",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}

// Удаление пользователя
export async function deleteUser(id: string) {
  try {
    if (!id) {
      return { error: "ID пользователя не указан", status: 400 }
    }

    await api.delete(`/users/${id}`)

    revalidatePath('/users')
    revalidatePath('/admin/users')

    return { data: { id, deleted: true }, status: 200 }
  } catch (error: any) {
    console.error(`Ошибка при удалении пользователя (ID: ${id}):`, error)
    return {
      error: error.message || "Не удалось удалить пользователя",
      status: 500
    }
  }
}
