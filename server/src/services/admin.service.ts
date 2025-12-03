import { prisma } from '../utils/db';

export class AdminService {
  // Получение статистики админ-панели
  static async getAdminStats() {
    const [
      totalUsers,
      totalGames,
      totalClubs,
      totalFederations,
      totalPayments,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.club.count(),
      prisma.federation.count(),
      prisma.payment.count(),
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalUsers,
      totalGames,
      totalClubs,
      totalFederations,
      totalPayments,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  // Получение всех пользователей для админ-панели
  static async getAllUsers() {
    return prisma.user.findMany({
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            gamePlayers: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение всех продуктов
  static async getAllProducts() {
    return prisma.product.findMany({
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение всех подписок
  static async getAllSubscriptions() {
    return prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

