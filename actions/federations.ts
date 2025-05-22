"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma, prismaOperation } from "@/lib/prisma"

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
  return await prismaOperation(
    async () => {
      const federations = await prisma.federation.findMany({
        include: {
          clubs: {
            select: {
              id: true,
              users: {
                select: { id: true }
              }
            }
          },
          games: {
            select: { id: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedFederations = federations.map(federation => {
        // Подсчет количества игроков во всех клубах федерации
        const playerCount = federation.clubs.reduce(
          (total, club) => total + club.users.length, 
          0
        )

        return {
          id: federation.id,
          name: federation.name,
          description: federation.description,
          url: federation.url,
          country: federation.country,
          city: federation.city,
          additional_points_conditions: federation.additionalPointsConditions,
          club_count: federation.clubs.length,
          player_count: playerCount,
          game_count: federation.games.length,
          created_at: federation.createdAt,
          updated_at: federation.updatedAt
        }
      })

      return { data: formattedFederations, status: 200 }
    },
    "Не удалось получить список федераций"
  )
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

  return await prismaOperation(
    async () => {
      const federation = await prisma.federation.findUnique({
        where: { id: federationId },
        include: {
          clubs: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              users: {
                select: { id: true }
              }
            }
          },
          games: {
            select: { id: true }
          }
        }
      })

      if (!federation) {
        return { error: "Федерация не найдена", status: 404 }
      }

      // Подсчет количества игроков во всех клубах федерации
      const playerCount = federation.clubs.reduce(
        (total, club) => total + club.users.length, 
        0
      )

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedFederation = {
        id: federation.id,
        name: federation.name,
        description: federation.description,
        url: federation.url,
        country: federation.country,
        city: federation.city,
        additional_points_conditions: federation.additionalPointsConditions,
        club_count: federation.clubs.length,
        player_count: playerCount,
        game_count: federation.games.length,
        created_at: federation.createdAt,
        updated_at: federation.updatedAt,
        clubs: federation.clubs.map(club => ({
          id: club.id,
          name: club.name,
          city: club.city,
          country: club.country,
          player_count: club.users.length
        }))
      }

      return { data: formattedFederation, status: 200 }
    },
    `Не удалось получить данные федерации (ID: ${id})`
  )
}

// Создание новой федерации
export async function createFederation(federationData: z.infer<typeof createFederationSchema>) {
  try {
    // Валидация данных
    const validatedData = createFederationSchema.parse(federationData)

    return await prismaOperation(
      async () => {
        // Проверка на уникальность названия
        const existingFederation = await prisma.federation.findFirst({
          where: { name: validatedData.name }
        })

        if (existingFederation) {
          return {
            error: "Федерация с таким названием уже существует",
            status: 400
          }
        }

        // Создание новой федерации
        const newFederation = await prisma.federation.create({
          data: {
            name: validatedData.name,
            description: validatedData.description,
            url: validatedData.url,
            country: validatedData.country,
            city: validatedData.city,
            additionalPointsConditions: validatedData.additional_points_conditions
          },
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/federations')
        revalidatePath('/admin/federations')

        return { data: newFederation, status: 201 }
      },
      "Не удалось создать федерацию"
    )
  } catch (error) {
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
      error: "Не удалось создать федерацию",
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

    return await prismaOperation(
      async () => {
        // Проверка существования федерации
        const existingFederation = await prisma.federation.findUnique({
          where: { id: federationId }
        })

        if (!existingFederation) {
          return { error: "Федерация не найдена", status: 404 }
        }

        // Проверка уникальности названия (если оно изменяется)
        if (validatedData.name && validatedData.name !== existingFederation.name) {
          const nameConflict = await prisma.federation.findFirst({
            where: {
              name: validatedData.name,
              NOT: { id: federationId }
            }
          })
          
          if (nameConflict) {
            return {
              error: "Федерация с таким названием уже существует",
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
        if (validatedData.additional_points_conditions !== undefined) 
          updateData.additionalPointsConditions = validatedData.additional_points_conditions

        // Если нет полей для обновления, возвращаем успех
        if (Object.keys(updateData).length === 0) {
          return { data: { id: federationId }, status: 200 }
        }
        
        // Выполнение обновления
        const result = await prisma.federation.update({
          where: { id: federationId },
          data: updateData,
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/federations')
        revalidatePath(`/federations/${id}`)
        revalidatePath('/admin/federations')

        return { data: result, status: 200 }
      },
      `Не удалось обновить федерацию (ID: ${id})`
    )
  } catch (error) {
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
      error: "Не удалось обновить федерацию",
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

    return await prismaOperation(
      async () => {
        // Проверка существования федерации
        const existingFederation = await prisma.federation.findUnique({
          where: { id: federationId },
          include: {
            clubs: { select: { id: true } },
            games: { select: { id: true } }
          }
        })

        if (!existingFederation) {
          return { error: "Федерация не найдена", status: 404 }
        }

        // Проверка, есть ли связанные сущности
        if (existingFederation.clubs.length > 0 || existingFederation.games.length > 0) {
          return {
            error: "Невозможно удалить федерацию, так как с ней связаны клубы или игры",
            status: 400
          }
        }

        // Выполнение удаления
        await prisma.federation.delete({
          where: { id: federationId }
        })

        // Обновление кэша страниц
        revalidatePath('/federations')
        revalidatePath('/admin/federations')

        return { data: { id: federationId, deleted: true }, status: 200 }
      },
      `Не удалось удалить федерацию (ID: ${id})`
    )
  } catch (error) {
    console.error(`Ошибка при удалении федерации (ID: ${id}):`, error)
    return {
      error: "Не удалось удалить федерацию",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
