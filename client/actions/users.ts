"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma, prismaOperation } from "@/lib/prisma"

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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        nickname: true,
        email: true,
        image: true,
        isTournamentJudge: true,
        isSideJudge: true,
        role: true,
        country: true,
        birthday: true,
        gender: true,
        clubId: true,
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true
          }
        }
      },
    });

    // Transform the data to match the expected structure
    const transformedUsers = users.map(user => ({
      id: user.id.toString(),
      name: user.name,
      surname: user.surname,
      nickname: user.nickname,
      email: user.email,
      image: user.image,
      isTournamentJudge: user.isTournamentJudge,
      isSideJudge: user.isSideJudge,
      role: user.role,
      country: user.country,
      birthday: user.birthday,
      gender: user.gender,
      club_id: user.clubId,
      club_name: user.club?.name || null,
      club_city: user.club?.city || null,
      club_country: user.club?.country || null,
      total_games: 0,
      civ_win_rate: '0',
      mafia_win_rate: '0',
      sheriff_win_rate: '0',
      don_win_rate: '0',
      avg_additional_points: '0',
      total_fouls: 0
    } as UserWithStats));

    // Update cache
    cachedUsers = transformedUsers;
    lastFetchTime = now;

    return transformedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
}

// Получение списка всех пользователей
export async function getAllUsers({ clubId }: { clubId?: number } = {}) {
  return await prismaOperation(
    async () => {
      const users = await prisma.user.findMany({
        where: clubId ? { clubId } : {},
        select: {
          id: true, 
          name: true, 
          surname: true, 
          nickname: true,
          email: true,
          image: true,
          isTournamentJudge: true,
          isSideJudge: true,
          role: true,
          country: true,
          birthday: true,
          gender: true,
          clubId: true,
          club: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true
            }
          }
        },
        orderBy: [
          { name: 'asc' },
          { surname: 'asc' }
        ]
      })

      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
        email: user.email,
        image: user.image,
        is_tournament_judge: user.isTournamentJudge,
        is_side_judge: user.isSideJudge,
        role: user.role,
        country: user.country,
        birthday: user.birthday,
        gender: user.gender,
        club_id: user.clubId,
        club_name: user.club?.name,
        club_city: user.club?.city || null,
        club_country: user.club?.country || null
      }))

      return { data: formattedUsers, status: 200 }
    },
    "Не удалось получить список пользователей"
  )
}

// Получение пользователя по ID
export async function getUserById(id: string) {
  if (!id) {
    return { error: "ID пользователя не указан", status: 400 }
  }

  const userId = Number.parseInt(id, 10)
  if (Number.isNaN(userId)) {
    return { error: "Некорректный ID пользователя", status: 400 }
  }

  return await prismaOperation(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          surname: true,
          nickname: true,
          email: true,
          image: true,
          bio: true,
          country: true,
          birthday: true,
          gender: true,
          isTournamentJudge: true,
          isSideJudge: true,
          role: true,
          clubId: true,
          createdAt: true,
          updatedAt: true,
          club: {
            select: {
              name: true
            }
          }
        }
      })

      if (!user) {
        return { error: "Пользователь не найден", status: 404 }
      }

      const formattedUser = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
        email: user.email,
        image: user.image,
        bio: user.bio,
        country: user.country,
        birthday: user.birthday,
        gender: user.gender,
        is_tournament_judge: user.isTournamentJudge,
        is_side_judge: user.isSideJudge,
        role: user.role,
        club_id: user.clubId,
        club_name: user.club?.name,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }

      return { data: formattedUser, status: 200 }
    },
    `Не удалось получить данные пользователя (ID: ${id})`
  )
}

// Создание нового пользователя
export async function createUser(userData: z.infer<typeof createUserSchema>) {
  try {
    const validatedData = createUserSchema.parse(userData)

    return await prismaOperation(
      async () => {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { nickname: validatedData.nickname },
              { email: validatedData.email }
            ]
          }
        })

        if (existingUser) {
          return {
            error: "Пользователь с таким никнеймом или email уже существует",
            status: 400
          }
        }

        const newUser = await prisma.user.create({
          data: {
            name: validatedData.name,
            surname: validatedData.surname,
            nickname: validatedData.nickname,
            email: validatedData.email,
            password: validatedData.password,
            image: validatedData.image,
            bio: validatedData.bio,
            role: validatedData.role,
            country: validatedData.country,
            clubId: validatedData.club_id,
            birthday: validatedData.birthday ? new Date(validatedData.birthday) : undefined,
            gender: validatedData.gender,
            isTournamentJudge: validatedData.is_tournament_judge,
            isSideJudge: validatedData.is_side_judge
          },
          select: { id: true }
        })

        revalidatePath('/users')
        revalidatePath('/admin/users')

        return { data: newUser, status: 201 }
      },
      "Не удалось создать пользователя"
    )
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

    const userId = Number.parseInt(id, 10)
    if (Number.isNaN(userId)) {
      return { error: "Некорректный ID пользователя", status: 400 }
    }

    const validatedData = updateUserSchema.parse(userData)

    return await prismaOperation(
      async () => {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId }
        })

        if (!existingUser) {
          return { error: "Пользователь не найден", status: 404 }
        }

        if (validatedData.nickname || validatedData.email) {
          const conflictCheck = await prisma.user.findFirst({
            where: {
              OR: [
                validatedData.nickname ? { nickname: validatedData.nickname } : {},
                validatedData.email ? { email: validatedData.email } : {}
              ],
              NOT: { id: userId }
            }
          })
          
          if (conflictCheck) {
            return {
              error: "Пользователь с таким никнеймом или email уже существует",
              status: 400
            }
          }
        }

        const updateData: Record<string, unknown> = {}
        
        if (validatedData.name !== undefined) updateData.name = validatedData.name
        if (validatedData.surname !== undefined) updateData.surname = validatedData.surname
        if (validatedData.nickname !== undefined) updateData.nickname = validatedData.nickname
        if (validatedData.email !== undefined) updateData.email = validatedData.email
        if (validatedData.password !== undefined) updateData.password = validatedData.password
        if (validatedData.image !== undefined) updateData.image = validatedData.image
        if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
        if (validatedData.role !== undefined) updateData.role = validatedData.role
        if (validatedData.country !== undefined) updateData.country = validatedData.country
        if (validatedData.club_id !== undefined) updateData.clubId = validatedData.club_id
        if (validatedData.birthday !== undefined) updateData.birthday = validatedData.birthday ? new Date(validatedData.birthday) : null
        if (validatedData.gender !== undefined) updateData.gender = validatedData.gender
        if (validatedData.is_tournament_judge !== undefined) updateData.isTournamentJudge = validatedData.is_tournament_judge
        if (validatedData.is_side_judge !== undefined) updateData.isSideJudge = validatedData.is_side_judge

        if (Object.keys(updateData).length === 0) {
          return { data: { id: userId }, status: 200 }
        }
        
        const result = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: { id: true }
        })

        revalidatePath('/users')
        revalidatePath(`/users/${id}`)
        revalidatePath('/admin/users')

        return { data: result, status: 200 }
      },
      `Не удалось обновить пользователя (ID: ${id})`
    )
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

    const userId = Number.parseInt(id, 10)
    if (Number.isNaN(userId)) {
      return { error: "Некорректный ID пользователя", status: 400 }
    }

    return await prismaOperation(
      async () => {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true }
        })

        if (!existingUser) {
          return { error: "Пользователь не найден", status: 404 }
        }

        if (existingUser.role === 'admin') {
          return { 
            error: "Нельзя удалить пользователя с ролью администратора", 
            status: 403 
          }
        }

        await prisma.user.delete({
          where: { id: userId }
        })

        revalidatePath('/users')
        revalidatePath('/admin/users')

        return { data: { id: userId, deleted: true }, status: 200 }
      },
      `Не удалось удалить пользователя (ID: ${id})`
    )
  } catch (error) {
    console.error(`Ошибка при удалении пользователя (ID: ${id}):`, error)
    return {
      error: "Не удалось удалить пользователя",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
