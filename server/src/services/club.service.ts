import { prisma } from '../utils/db';

export class ClubService {
  // Получение всех клубов
  static async getAllClubs() {
    const clubs = await prisma.club.findMany({
      include: {
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        _count: {
          select: {
            users: true,
            games: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clubs.map((club) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      url: club.url,
      country: club.country,
      city: club.city,
      federation_id: club.federationId,
      federation_name: club.federation?.name || null,
      player_count: club._count.users,
      game_count: club._count.games,
      players: club.users.map((user) => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
      })),
      created_at: club.createdAt,
      updated_at: club.updatedAt,
    }));
  }

  // Получение клуба по ID
  static async getClubById(id: number) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            nickname: true,
          },
        },
        _count: {
          select: {
            users: true,
            games: true,
          },
        },
      },
    });

    if (!club) {
      return null;
    }

    return {
      id: club.id,
      name: club.name,
      description: club.description,
      url: club.url,
      country: club.country,
      city: club.city,
      federation_id: club.federationId,
      federation_name: club.federation?.name || null,
      player_count: club._count.users,
      game_count: club._count.games,
      players: club.users.map((user) => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
      })),
      created_at: club.createdAt,
      updated_at: club.updatedAt,
    };
  }

  // Создание клуба
  static async createClub(data: {
    name: string;
    description?: string;
    url?: string | null;
    country?: string;
    city?: string;
    federation_id?: number | null;
  }) {
    return prisma.club.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        country: data.country,
        city: data.city,
        federationId: data.federation_id,
      },
      include: {
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Обновление клуба
  static async updateClub(id: number, data: {
    name?: string;
    description?: string;
    url?: string | null;
    country?: string;
    city?: string;
    federation_id?: number | null;
  }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.federation_id !== undefined) updateData.federationId = data.federation_id;

    return prisma.club.update({
      where: { id },
      data: updateData,
      include: {
        federation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Удаление клуба
  static async deleteClub(id: number) {
    return prisma.club.delete({
      where: { id },
    });
  }
}

