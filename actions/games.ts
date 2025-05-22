"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma, prismaOperation } from "@/lib/prisma"

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
  return await prismaOperation(
    async () => {
      const games = await prisma.game.findMany({
        include: {
          club: {
            select: {
              name: true
            }
          },
          federation: {
            select: {
              name: true
            }
          },
          referee: {
            select: {
              id: true,
              name: true,
              surname: true,
              nickname: true
            }
          },
          // Добавляем данные об игроках в каждой игре
          gamePlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  nickname: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedGames = games.map(game => {
        // Формирование имени судьи
        const refereeName = game.referee
          ? (game.referee.name && game.referee.surname)
            ? `${game.referee.name} ${game.referee.surname}`
            : game.referee.nickname
          : null
          
        // Обрабатываем данные об игроках
        const players = game.gamePlayers.map(gp => ({
          id: gp.player.id,
          name: gp.player.name,
          surname: gp.player.surname || '',
          nickname: gp.player.nickname || '',
          image: gp.player.image,
          role: gp.role,
          slot: gp.slotNumber,
          fouls: gp.fouls,
          // Преобразуем Decimal в JavaScript number
          additional_points: typeof gp.additionalPoints === 'object' && gp.additionalPoints !== null 
            ? Number.parseFloat(gp.additionalPoints.toString()) 
            : Number.parseFloat(String(gp.additionalPoints || 0))
        }));
        
        // Подсчитываем количество игроков по ролям
        const mafia_count = players.filter(p => p.role === 'mafia' || p.role === 'don').length;
        const civilian_count = players.filter(p => p.role === 'civilian' || p.role === 'sheriff').length;

        return {
          id: game.id,
          name: game.name,
          description: game.description,
          game_type: game.gameType,
          result: game.result,
          referee_id: game.refereeId,
          referee_name: refereeName,
          referee_comments: game.refereeComments,
          table_number: game.tableNumber,
          club_id: game.clubId,
          club_name: game.club?.name || null,
          federation_id: game.federationId,
          federation_name: game.federation?.name || null,
          created_at: game.createdAt,
          updated_at: game.updatedAt,
          // Добавляем данные об игроках
          player_count: players.length,
          mafia_count,
          civilian_count,
          players: players
        }
      })

      return { data: formattedGames, status: 200 }
    },
    "Не удалось получить список игр"
  )
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

  return await prismaOperation(
    async () => {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          club: {
            select: {
              id: true,
              name: true
            }
          },
          federation: {
            select: {
              id: true,
              name: true
            }
          },
          referee: {
            select: {
              id: true,
              name: true,
              surname: true,
              nickname: true,
              image: true
            }
          },
          gamePlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  nickname: true,
                  image: true,
                  country: true,
                  clubId: true
                }
              }
            },
            orderBy: { slotNumber: 'asc' }
          },
          gameStages: {
            orderBy: { orderNumber: 'asc' }
          },
          sideReferees: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  nickname: true,
                  image: true
                }
              }
            }
          }
        }
      })

      if (!game) {
        return { error: "Игра не найдена", status: 404 }
      }

      // Преобразование данных в формат, ожидаемый фронтендом
      const formattedGame = {
        id: game.id,
        name: game.name,
        description: game.description,
        game_type: game.gameType,
        result: game.result,
        referee_id: game.refereeId,
        referee: game.referee ? {
          id: game.referee.id,
          name: game.referee.name,
          surname: game.referee.surname,
          nickname: game.referee.nickname,
          image: game.referee.image,
          full_name: (game.referee.name && game.referee.surname) 
            ? `${game.referee.name} ${game.referee.surname}`
            : game.referee.nickname
        } : null,
        referee_comments: game.refereeComments,
        table_number: game.tableNumber,
        club_id: game.clubId,
        club_name: game.club?.name || null,
        federation_id: game.federationId,
        federation_name: game.federation?.name || null,
        created_at: game.createdAt,
        updated_at: game.updatedAt,
        players: game.gamePlayers.map(gp => ({
          id: gp.playerId,
          game_player_id: gp.id,
          name: gp.player.name,
          surname: gp.player.surname,
          nickname: gp.player.nickname,
          image: gp.player.image,
          role: gp.role,
          fouls: gp.fouls,
          additional_points: gp.additionalPoints,
          slot_number: gp.slotNumber,
          full_name: (gp.player.name && gp.player.surname) 
            ? `${gp.player.name} ${gp.player.surname}`
            : gp.player.nickname,
          country: gp.player.country,
          club_id: gp.player.clubId
        })),
        stages: game.gameStages.map(stage => ({
          id: stage.id,
          type: stage.type,
          order_number: stage.orderNumber,
          data: stage.data
        })),
        side_referees: game.sideReferees.map(sr => ({
          id: sr.playerId,
          name: sr.player.name,
          surname: sr.player.surname,
          nickname: sr.player.nickname,
          image: sr.player.image,
          full_name: (sr.player.name && sr.player.surname) 
            ? `${sr.player.name} ${sr.player.surname}`
            : sr.player.nickname
        }))
      }

      return { data: formattedGame, status: 200 }
    },
    `Не удалось получить данные игры (ID: ${id})`
  )
}

// Создание новой игры
export async function createGame(gameData: z.infer<typeof createGameSchema>) {
  try {
    // Валидация данных
    const validatedData = createGameSchema.parse(gameData)

    return await prismaOperation(
      async () => {
        // Создание новой игры
        const newGame = await prisma.game.create({
          data: {
            name: validatedData.name,
            description: validatedData.description,
            gameType: validatedData.game_type,
            result: validatedData.result,
            refereeId: validatedData.referee_id,
            refereeComments: validatedData.referee_comments,
            tableNumber: validatedData.table_number,
            clubId: validatedData.club_id,
            federationId: validatedData.federation_id
          },
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/games')
        revalidatePath('/admin/games')

        return { data: newGame, status: 201 }
      },
      "Не удалось создать игру"
    )
  } catch (error) {
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
      error: "Не удалось создать игру",
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

    return await prismaOperation(
      async () => {
        // Проверка существования игры
        const existingGame = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!existingGame) {
          return { error: "Игра не найдена", status: 404 }
        }

        // Подготовка данных для обновления
        const updateData: Record<string, unknown> = {}
        
        if (validatedData.name !== undefined) updateData.name = validatedData.name
        if (validatedData.description !== undefined) updateData.description = validatedData.description
        if (validatedData.game_type !== undefined) updateData.gameType = validatedData.game_type
        if (validatedData.result !== undefined) updateData.result = validatedData.result
        if (validatedData.referee_id !== undefined) updateData.refereeId = validatedData.referee_id
        if (validatedData.referee_comments !== undefined) updateData.refereeComments = validatedData.referee_comments
        if (validatedData.table_number !== undefined) updateData.tableNumber = validatedData.table_number
        if (validatedData.club_id !== undefined) updateData.clubId = validatedData.club_id
        if (validatedData.federation_id !== undefined) updateData.federationId = validatedData.federation_id

        // Если нет полей для обновления, возвращаем успех
        if (Object.keys(updateData).length === 0) {
          return { data: { id: gameId }, status: 200 }
        }
        
        // Выполнение обновления
        const result = await prisma.game.update({
          where: { id: gameId },
          data: updateData,
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath('/games')
        revalidatePath(`/games/${id}`)
        revalidatePath('/admin/games')

        return { data: result, status: 200 }
      },
      `Не удалось обновить игру (ID: ${id})`
    )
  } catch (error) {
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
      error: "Не удалось обновить игру",
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

    return await prismaOperation(
      async () => {
        // Проверка существования игры
        const existingGame = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!existingGame) {
          return { error: "Игра не найдена", status: 404 }
        }

        // Выполнение удаления (Prisma автоматически удалит связанные записи благодаря onDelete: Cascade)
        await prisma.game.delete({
          where: { id: gameId }
        })

        // Обновление кэша страниц
        revalidatePath('/games')
        revalidatePath('/admin/games')

        return { data: { id: gameId, deleted: true }, status: 200 }
      },
      `Не удалось удалить игру (ID: ${id})`
    )
  } catch (error) {
    console.error(`Ошибка при удалении игры (ID: ${id}):`, error)
    return {
      error: "Не удалось удалить игру",
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

    const numericGameId = Number.parseInt(gameId, 10)
    const numericPlayerId = Number.parseInt(playerId, 10)
    
    if (Number.isNaN(numericGameId) || Number.isNaN(numericPlayerId)) {
      return { error: "Некорректный ID игры или игрока", status: 400 }
    }

    return await prismaOperation(
      async () => {
        // Проверка существования игры
        const game = await prisma.game.findUnique({
          where: { id: numericGameId }
        })

        if (!game) {
          return { error: "Игра не найдена", status: 404 }
        }

        // Проверка существования игрока
        const player = await prisma.user.findUnique({
          where: { id: numericPlayerId }
        })

        if (!player) {
          return { error: "Игрок не найден", status: 404 }
        }

        // Проверка, что слот не занят
        const existingSlot = await prisma.gamePlayer.findFirst({
          where: {
            gameId: numericGameId,
            slotNumber: slotNumber
          }
        })

        if (existingSlot) {
          return { 
            error: `Слот ${slotNumber} уже занят другим игроком`, 
            status: 400 
          }
        }

        // Проверка, что игрок еще не добавлен в игру
        const existingPlayer = await prisma.gamePlayer.findFirst({
          where: {
            gameId: numericGameId,
            playerId: numericPlayerId
          }
        })

        if (existingPlayer) {
          return { 
            error: "Этот игрок уже добавлен в игру", 
            status: 400 
          }
        }

        // Добавление игрока в игру
        const result = await prisma.gamePlayer.create({
          data: {
            gameId: numericGameId,
            playerId: numericPlayerId,
            role: role,
            slotNumber: slotNumber,
            fouls: 0,
            additionalPoints: 0
          },
          select: { id: true }
        })

        // Обновление кэша страниц
        revalidatePath(`/games/${gameId}`)
        revalidatePath('/admin/games')

        return { data: result, status: 201 }
      },
      "Не удалось добавить игрока в игру"
    )
  } catch (error) {
    console.error(`Ошибка при добавлении игрока в игру:`, error)
    return {
      error: "Не удалось добавить игрока в игру",
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

    const numericGameId = Number.parseInt(gameId, 10)
    const numericGamePlayerId = Number.parseInt(gamePlayerId, 10)
    
    if (Number.isNaN(numericGameId) || Number.isNaN(numericGamePlayerId)) {
      return { error: "Некорректный ID игры или записи игрока", status: 400 }
    }

    return await prismaOperation(
      async () => {
        // Проверка существования записи игрока в игре
        const gamePlayer = await prisma.gamePlayer.findFirst({
          where: {
            id: numericGamePlayerId,
            gameId: numericGameId
          }
        })

        if (!gamePlayer) {
          return { error: "Игрок не найден в этой игре", status: 404 }
        }

        // Удаление игрока из игры
        await prisma.gamePlayer.delete({
          where: { id: numericGamePlayerId }
        })

        // Обновление кэша страниц
        revalidatePath(`/games/${gameId}`)
        revalidatePath('/admin/games')

        return { data: { id: numericGamePlayerId, deleted: true }, status: 200 }
      },
      "Не удалось удалить игрока из игры"
    )
  } catch (error) {
    console.error(`Ошибка при удалении игрока из игры:`, error)
    return {
      error: "Не удалось удалить игрока из игры",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
      status: 500
    }
  }
}
