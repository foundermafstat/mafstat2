"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma, prismaOperation } from "@/lib/prisma"

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

// Получение списка всех клубов
export async function getAllClubs() {
  return await prismaOperation(
    async () => {
      const clubs = await prisma.club.findMany({
        include: {
          federation: {
            select: {
              name: true
            }
          },
          users: {
            select: {
              id: true
            }
          },
          games: {
            select: {
              id: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedClubs = clubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        url: club.url,
        country: club.country,
        city: club.city,
        federation_id: club.federationId,
        federation_name: club.federation?.name || null,
        player_count: club.users.length,
        game_count: club.games.length,
        created_at: club.createdAt,
        updated_at: club.updatedAt
      }))

      return { data: formattedClubs, status: 200 }
    },
    "Не удалось получить список клубов"
  )
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

  return await prismaOperation(
    async () => {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        include: {
          federation: {
            select: {
              name: true
            }
          },
          users: {
            select: { id: true }
          },
          games: {
            select: { id: true }
          }
        }
      })

      if (!club) {
        return { error: "Клуб не найден", status: 404 }
      }

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedClub = {
        id: club.id,
        name: club.name,
        description: club.description,
        url: club.url,
        country: club.country,
        city: club.city,
        federation_id: club.federationId,
        federation_name: club.federation?.name || null,
        player_count: club.users.length,
        game_count: club.games.length,
        created_at: club.createdAt,
        updated_at: club.updatedAt
      }

      return { data: formattedClub, status: 200 }
    },
    `Не удалось получить данные клуба (ID: ${id})`
  )
}

// Создание нового клуба
export async function createClub(clubData: z.infer<typeof createClubSchema>) {
  try {
    // Валидация данных
    const validatedData = createClubSchema.parse(clubData)

    return await prismaOperation(
      async () => {
        // Проверка на уникальность названия
        const existingClub = await prisma.club.findFirst({
          where: { name: validatedData.name }
        })

        if (existingClub) {
          return {
            error: "Клуб с таким названием уже существует",
            status: 400
          }
        }

        // Создание нового клуба
        const newClub = await prisma.club.create({
          data: {
            name: validatedData.name,
            description: validatedData.description,
            url: validatedData.url,
            country: validatedData.country,
            city: validatedData.city,
            federationId: validatedData.federation_id
          },
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/clubs')
        revalidatePath('/admin/clubs')

        return { data: newClub, status: 201 }
      },
      "Не удалось создать клуб"
    )
  } catch (error) {
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
      error: "Не удалось создать клуб",
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

    const clubId = Number.parseInt(id, 10)
    if (Number.isNaN(clubId)) {
      return { error: "Некорректный ID клуба", status: 400 }
    }

    // Валидация данных
    const validatedData = updateClubSchema.parse(clubData)

    return await prismaOperation(
      async () => {
        // Проверка существования клуба
        const existingClub = await prisma.club.findUnique({
          where: { id: clubId }
        })

        if (!existingClub) {
          return { error: "Клуб не найден", status: 404 }
        }

        // Проверка уникальности названия (если оно изменяется)
        if (validatedData.name && validatedData.name !== existingClub.name) {
          const nameConflict = await prisma.club.findFirst({
            where: {
              name: validatedData.name,
              NOT: { id: clubId }
            }
          })
          
          if (nameConflict) {
            return {
              error: "Клуб с таким названием уже существует",
              status: 400
            }
          }
        }

        // Подготовка данных для обновления
        const updateData: Record<string, unknown> = {}
        
        if (validatedData.name !== undefined) updateData.name = validatedData.name
        if (validatedData.description !== undefined) updateData.description = validatedData.description
        if (validatedData.url !== undefined) updateData.url = validatedData.url
        if (validatedData.country !== undefined) updateData.country = validatedData.country
        if (validatedData.city !== undefined) updateData.city = validatedData.city
        if (validatedData.federation_id !== undefined) updateData.federationId = validatedData.federation_id

        // Если нет полей для обновления, возвращаем успех
        if (Object.keys(updateData).length === 0) {
          return { data: { id: clubId }, status: 200 }
        }
        
        // Выполнение обновления
        const result = await prisma.club.update({
          where: { id: clubId },
          data: updateData,
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/clubs')
        revalidatePath(`/clubs/${id}`)
        revalidatePath('/admin/clubs')

        return { data: result, status: 200 }
      },
      `Не удалось обновить клуб (ID: ${id})`
    )
  } catch (error) {
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
      error: "Не удалось обновить клуб",
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

    const clubId = Number.parseInt(id, 10)
    if (Number.isNaN(clubId)) {
      return { error: "Некорректный ID клуба", status: 400 }
    }

    return await prismaOperation(
      async () => {
        // Проверка существования клуба
        const existingClub = await prisma.club.findUnique({
          where: { id: clubId },
          include: {
            users: { select: { id: true } },
            games: { select: { id: true } }
          }
        })

        if (!existingClub) {
          return { error: "Клуб не найден", status: 404 }
        }

        // Проверка, есть ли связанные сущности
        if (existingClub.users.length > 0 || existingClub.games.length > 0) {
          return {
            error: "Невозможно удалить клуб, так как с ним связаны пользователи или игры",
            status: 400
          }
        }

        // Выполнение удаления
        await prisma.club.delete({
          where: { id: clubId }
        })

        // Обновление кэша страниц
        revalidatePath('/clubs')
        revalidatePath('/admin/clubs')

        return { data: { id: clubId, deleted: true }, status: 200 }
      },
      `Не удалось удалить клуб (ID: ${id})`
    )
  } catch (error) {
    console.error(`Ошибка при удалении клуба (ID: ${id}):`, error)
    return {
      error: "Не удалось удалить клуб",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
