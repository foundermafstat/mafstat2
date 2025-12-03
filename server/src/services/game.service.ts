import { prisma } from '../utils/db';

export class GameService {
  // Получение всех игр
  static async getAllGames() {
    return prisma.game.findMany({
      include: {
        referee: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        federation: {
          select: {
            id: true,
            name: true,
          },
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение игры по ID
  static async getGameById(id: number) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        referee: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        federation: {
          select: {
            id: true,
            name: true,
          },
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
              },
            },
          },
          orderBy: {
            slotNumber: 'asc',
          },
        },
        gameStages: {
          orderBy: {
            orderNumber: 'asc',
          },
        },
      },
    });

    if (!game) {
      return null;
    }

    // Преобразуем даты в ISO строки для корректной передачи через API
    return {
      ...game,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      gamePlayers: game.gamePlayers.map((gp) => ({
        ...gp,
        createdAt: gp.createdAt.toISOString(),
        updatedAt: gp.updatedAt.toISOString(),
      })),
      gameStages: game.gameStages.map((gs) => ({
        ...gs,
        createdAt: gs.createdAt.toISOString(),
        updatedAt: gs.updatedAt.toISOString(),
      })),
    };
  }

  // Создание игры
  static async createGame(data: {
    name?: string;
    description?: string;
    game_type: string;
    result?: string;
    referee_id?: number;
    referee_comments?: string;
    table_number?: number;
    club_id?: number;
    federation_id?: number;
  }) {
    return prisma.game.create({
      data: {
        name: data.name,
        description: data.description,
        gameType: data.game_type,
        result: data.result,
        refereeId: data.referee_id,
        refereeComments: data.referee_comments,
        tableNumber: data.table_number,
        clubId: data.club_id,
        federationId: data.federation_id,
      },
      include: {
        referee: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Обновление игры
  static async updateGame(id: number, data: {
    name?: string;
    description?: string;
    game_type?: string;
    result?: string;
    referee_id?: number;
    referee_comments?: string;
    table_number?: number;
    club_id?: number;
    federation_id?: number;
  }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.game_type !== undefined) updateData.gameType = data.game_type;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.referee_id !== undefined) updateData.refereeId = data.referee_id;
    if (data.referee_comments !== undefined) updateData.refereeComments = data.referee_comments;
    if (data.table_number !== undefined) updateData.tableNumber = data.table_number;
    if (data.club_id !== undefined) updateData.clubId = data.club_id;
    if (data.federation_id !== undefined) updateData.federationId = data.federation_id;

    return prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        referee: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Удаление игры
  static async deleteGame(id: number) {
    return prisma.game.delete({
      where: { id },
    });
  }

  // Добавление игрока в игру
  static async addPlayerToGame(
    gameId: number,
    playerId: number,
    role: string,
    slotNumber: number
  ) {
    return prisma.gamePlayer.create({
      data: {
        gameId,
        playerId,
        role,
        slotNumber,
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
            image: true,
          },
        },
      },
    });
  }

  // Удаление игрока из игры
  static async removePlayerFromGame(gameId: number, gamePlayerId: number) {
    return prisma.gamePlayer.delete({
      where: { id: gamePlayerId },
    });
  }
}

