import { prisma } from '../utils/db';
import { hashPassword, comparePasswords } from '../utils/auth';

export class UserService {
  // Получение всех пользователей
  static async getAllUsers(clubId?: number) {
    const where = clubId ? { clubId } : {};
    
    return prisma.user.findMany({
      where,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение пользователей со статистикой
  static async getUsersWithStats() {
    const users = await prisma.user.findMany({
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
        gamePlayers: {
          include: {
            game: true,
          },
        },
      },
    });

    return users.map((user) => {
      const games = user.gamePlayers;
      const totalGames = games.length;
      
      const civWins = games.filter(
        (gp) => gp.role === 'civilian' && gp.game.result === 'civilians'
      ).length;
      const mafiaWins = games.filter(
        (gp) => gp.role === 'mafia' && gp.game.result === 'mafia'
      ).length;
      const sheriffWins = games.filter(
        (gp) => gp.role === 'sheriff' && gp.game.result === 'civilians'
      ).length;
      const donWins = games.filter(
        (gp) => gp.role === 'don' && gp.game.result === 'mafia'
      ).length;

      const totalFouls = games.reduce((sum, gp) => sum + gp.fouls, 0);
      const totalAdditionalPoints = games.reduce(
        (sum, gp) => sum + Number(gp.additionalPoints),
        0
      );

      return {
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
        total_games: totalGames,
        civ_win_rate: totalGames > 0 ? ((civWins / totalGames) * 100).toFixed(2) : '0.00',
        mafia_win_rate: totalGames > 0 ? ((mafiaWins / totalGames) * 100).toFixed(2) : '0.00',
        sheriff_win_rate: totalGames > 0 ? ((sheriffWins / totalGames) * 100).toFixed(2) : '0.00',
        don_win_rate: totalGames > 0 ? ((donWins / totalGames) * 100).toFixed(2) : '0.00',
        avg_additional_points: totalGames > 0 ? (totalAdditionalPoints / totalGames).toFixed(2) : '0.00',
        total_fouls: totalFouls,
      };
    });
  }

  // Получение пользователя по ID
  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });
  }

  // Создание пользователя
  static async createUser(data: {
    name: string;
    surname?: string;
    nickname?: string;
    email: string;
    password?: string;
    image?: string;
    bio?: string;
    country?: string;
    club_id?: number;
    birthday?: string;
    gender?: string;
    is_tournament_judge?: boolean;
    is_side_judge?: boolean;
    role?: string;
  }) {
    const hashedPassword = data.password ? await hashPassword(data.password) : null;

    return prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        nickname: data.nickname,
        email: data.email,
        password: hashedPassword,
        image: data.image,
        bio: data.bio,
        country: data.country,
        clubId: data.club_id,
        birthday: data.birthday ? new Date(data.birthday) : null,
        gender: data.gender,
        isTournamentJudge: data.is_tournament_judge || false,
        isSideJudge: data.is_side_judge || false,
        role: data.role || 'user',
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });
  }

  // Обновление пользователя
  static async updateUser(id: string, data: {
    name?: string;
    surname?: string;
    nickname?: string;
    email?: string;
    password?: string;
    image?: string;
    bio?: string;
    country?: string;
    club_id?: number | null;
    birthday?: string | null;
    gender?: string;
    is_tournament_judge?: boolean;
    is_side_judge?: boolean;
    role?: string;
    premiumNights?: number;
  }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      updateData.password = await hashPassword(data.password);
    }
    if (data.image !== undefined) updateData.image = data.image;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.club_id !== undefined) updateData.clubId = data.club_id;
    if (data.birthday !== undefined) {
      updateData.birthday = data.birthday ? new Date(data.birthday) : null;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.is_tournament_judge !== undefined) updateData.isTournamentJudge = data.is_tournament_judge;
    if (data.is_side_judge !== undefined) updateData.isSideJudge = data.is_side_judge;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.premiumNights !== undefined) updateData.premiumNights = data.premiumNights;

    return prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });
  }

  // Удаление пользователя
  static async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id: parseInt(id) },
    });
  }

  // Обновление профиля текущего пользователя
  static async updateProfile(userId: number, data: {
    name?: string;
    surname?: string;
    nickname?: string;
    country?: string;
    bio?: string;
    image?: string;
    clubId?: number | null;
    birthday?: string | null;
    gender?: string;
  }) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.surname !== undefined) updateData.surname = data.surname;
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.clubId !== undefined) updateData.clubId = data.clubId;
    if (data.birthday !== undefined) {
      updateData.birthday = data.birthday ? new Date(data.birthday) : null;
    }
    if (data.gender !== undefined) updateData.gender = data.gender;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    });
  }

  // Изменение пароля
  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new Error('Пользователь не найден или не имеет пароля');
    }

    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Неверный текущий пароль');
    }

    const hashedPassword = await hashPassword(newPassword);

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  // Получение премиум статуса
  static async getPremiumStatus(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        payments: {
          where: {
            status: 'completed',
            paymentType: 'subscription',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return {
      isPremium: user.plan !== 'FREE',
      nights: user.premiumNights,
      plan: user.plan,
      payments: user.payments,
      subscriptions: user.subscriptions,
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  }

  // Использование премиум ночи
  static async usePremiumNight(userId: number, gameId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.premiumNights <= 0) {
      throw new Error('Недостаточно премиум ночей');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        premiumNights: {
          decrement: 1,
        },
      },
    });
  }
}

