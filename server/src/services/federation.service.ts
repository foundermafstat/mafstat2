import { prisma } from '../utils/db';

export class FederationService {
  // Получение всех федераций
  static async getAllFederations() {
    return prisma.federation.findMany({
      include: {
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
  }

  // Получение федерации по ID
  static async getFederationById(id: number) {
    return prisma.federation.findUnique({
      where: { id },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
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
}

