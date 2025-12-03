import { prisma } from '../utils/db';

export class FederationService {
  // Получение всех федераций
  static async getAllFederations() {
    const federations = await prisma.federation.findMany({
      include: {
        clubs: {
          include: {
            club: {
              include: {
                users: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            clubs: true,
            games: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Вычисляем количество уникальных игроков для каждой федерации
    return federations.map((federation) => {
      // Собираем все уникальные ID пользователей из всех клубов федерации
      const uniquePlayerIds = new Set<number>();
      federation.clubs.forEach((fc) => {
        fc.club.users.forEach((user) => {
          uniquePlayerIds.add(user.id);
        });
      });

      return {
        id: federation.id,
        name: federation.name,
        description: federation.description,
        url: federation.url,
        country: federation.country,
        city: federation.city,
        additionalPointsConditions: federation.additionalPointsConditions,
        createdAt: federation.createdAt.toISOString(),
        updatedAt: federation.updatedAt.toISOString(),
        club_count: federation._count.clubs,
        game_count: federation._count.games,
        player_count: uniquePlayerIds.size,
      };
    });
  }

  // Получение федерации по ID
  static async getFederationById(id: number) {
    const federation = await prisma.federation.findUnique({
      where: { id },
      include: {
        clubs: {
          include: {
            club: {
              include: {
                users: {
                  select: {
                    id: true,
                  },
                },
                _count: {
                  select: {
                    users: true,
                    games: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            clubs: true,
            games: true,
          },
        },
      },
    });

    if (!federation) {
      return null;
    }

    // Вычисляем количество уникальных игроков
    const uniquePlayerIds = new Set<number>();
    federation.clubs.forEach((fc) => {
      fc.club.users.forEach((user) => {
        uniquePlayerIds.add(user.id);
      });
    });

    return {
      id: federation.id,
      name: federation.name,
      description: federation.description,
      url: federation.url,
      country: federation.country,
      city: federation.city,
      additionalPointsConditions: federation.additionalPointsConditions,
      createdAt: federation.createdAt.toISOString(),
      updatedAt: federation.updatedAt.toISOString(),
      clubs: federation.clubs.map((fc) => ({
        id: fc.club.id,
        name: fc.club.name,
        city: fc.club.city,
        country: fc.club.country,
        player_count: fc.club._count.users,
        game_count: fc.club._count.games,
      })),
      club_count: federation._count.clubs,
      game_count: federation._count.games,
      player_count: uniquePlayerIds.size,
    };
  }

  // Создание федерации
  static async createFederation(data: {
    name: string;
    description?: string;
    url?: string | null;
    country?: string;
    city?: string;
    additional_points_conditions?: any;
  }) {
    return prisma.federation.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        country: data.country,
        city: data.city,
        additionalPointsConditions: data.additional_points_conditions,
      },
    });
  }

  // Обновление федерации
  static async updateFederation(id: number, data: {
    name?: string;
    description?: string;
    url?: string | null;
    country?: string;
    city?: string;
    additional_points_conditions?: any;
  }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.additional_points_conditions !== undefined) {
      updateData.additionalPointsConditions = data.additional_points_conditions;
    }

    return prisma.federation.update({
      where: { id },
      data: updateData,
    });
  }

  // Удаление федерации
  static async deleteFederation(id: number) {
    return prisma.federation.delete({
      where: { id },
    });
  }

  // Получение игроков федерации со статистикой
  static async getFederationPlayers(id: number) {
    // Получаем все клубы федерации
    const federation = await prisma.federation.findUnique({
      where: { id },
      include: {
        clubs: {
          include: {
            club: {
              include: {
                users: {
                  include: {
                    gamePlayers: {
                      include: {
                        game: {
                          select: {
                            id: true,
                            result: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!federation) {
      return null;
    }

    // Собираем всех уникальных игроков из всех клубов федерации
    const playersMap = new Map<number, any>();

    federation.clubs.forEach((fc) => {
      fc.club.users.forEach((user) => {
        if (!playersMap.has(user.id)) {
          const games = user.gamePlayers || [];
          const totalGames = games.length;
          
          // Подсчитываем победы
          const civWins = games.filter(
            (gp) => gp.role === 'civilian' && gp.game?.result === 'civilians'
          ).length;
          const mafiaWins = games.filter(
            (gp) => gp.role === 'mafia' && gp.game?.result === 'mafia'
          ).length;
          const sheriffWins = games.filter(
            (gp) => gp.role === 'sheriff' && gp.game?.result === 'civilians'
          ).length;
          const donWins = games.filter(
            (gp) => gp.role === 'don' && gp.game?.result === 'mafia'
          ).length;
          
          const totalWins = civWins + mafiaWins + sheriffWins + donWins;
          const overallWinrate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

          playersMap.set(user.id, {
            id: user.id,
            name: user.name || null,
            surname: user.surname || null,
            nickname: user.nickname || null,
            club_id: user.clubId || null,
            club_name: fc.club.name || null,
            country: user.country || null,
            photo_url: user.image || user.photoUrl || null,
            is_tournament_judge: user.isTournamentJudge,
            is_side_judge: user.isSideJudge,
            created_at: user.createdAt.toISOString(),
            updated_at: user.updatedAt.toISOString(),
            stats: {
              total_games: totalGames,
              total_wins: totalWins,
              overall_winrate: overallWinrate,
            },
            total_games: totalGames,
            total_wins: totalWins,
            overall_winrate: overallWinrate,
          });
        }
      });
    });

    return Array.from(playersMap.values());
  }
}

