import { Request, Response } from 'express';
import { prisma } from '../utils/db';

// Получение всех игр
export const getAllGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await prisma.game.findMany({
      include: {
        gameMaster: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        players: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        results: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.status(200).json(games);
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка игр' });
  }
};

// Получение игры по ID
export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = req.params.id;
    
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        gameMaster: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        players: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        results: true
      }
    });

    if (!game) {
      res.status(404).json({ message: 'Игра не найдена' });
      return;
    }

    res.status(200).json(game);
  } catch (error) {
    console.error('Ошибка при получении игры:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении игры' });
  }
};

// Создание новой игры
export const createGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const { date, location, tableName, status, playerIds, isPublic, notes } = req.body;
    
    // Преобразуем дату из строки в объект Date, если нужно
    const gameDate = new Date(date);
    
    const newGame = await prisma.game.create({
      data: {
        date: gameDate,
        location,
        tableName,
        status: status || 'SCHEDULED',
        isPublic: isPublic ?? true,
        notes,
        gameMasterId: req.user.userId,
        players: {
          connect: playerIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        gameMaster: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        players: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.status(201).json(newGame);
  } catch (error) {
    console.error('Ошибка при создании игры:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании игры' });
  }
};

// Обновление игры
export const updateGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const gameId = req.params.id;
    const { date, location, tableName, status, playerIds, isPublic, notes } = req.body;
    
    // Сначала проверяем, существует ли игра и имеет ли пользователь права на её редактирование
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true }
    });

    if (!existingGame) {
      res.status(404).json({ message: 'Игра не найдена' });
      return;
    }

    // Проверяем права (редактировать может только гейм-мастер или администратор)
    if (existingGame.gameMasterId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'У вас нет прав для редактирования этой игры' });
      return;
    }
    
    // Преобразуем дату из строки в объект Date, если нужно
    const gameDate = date ? new Date(date) : undefined;
    
    // Обновляем игру
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        date: gameDate,
        location,
        tableName,
        status,
        isPublic,
        notes,
        players: playerIds ? {
          set: playerIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        gameMaster: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        players: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        results: true
      }
    });
    
    res.status(200).json(updatedGame);
  } catch (error) {
    console.error('Ошибка при обновлении игры:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении игры' });
  }
};

// Удаление игры
export const deleteGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }
    
    const gameId = req.params.id;
    
    // Проверяем, существует ли игра и имеет ли пользователь права на её удаление
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      res.status(404).json({ message: 'Игра не найдена' });
      return;
    }

    // Проверяем права (удалять может только гейм-мастер или администратор)
    if (game.gameMasterId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'У вас нет прав для удаления этой игры' });
      return;
    }
    
    // Удаляем игру
    await prisma.game.delete({
      where: { id: gameId }
    });
    
    res.status(200).json({ message: 'Игра успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении игры:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении игры' });
  }
};

// Добавление результатов игры
export const addGameResult = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }
    
    const gameId = req.params.id;
    const { winningTeam, mvpPlayerId, bestMovePlayerId } = req.body;
    
    // Проверяем, существует ли игра и имеет ли пользователь права
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      res.status(404).json({ message: 'Игра не найдена' });
      return;
    }

    // Проверяем права (добавлять результаты может только гейм-мастер или администратор)
    if (game.gameMasterId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'У вас нет прав для добавления результатов' });
      return;
    }
    
    // Добавляем результаты
    const gameResult = await prisma.gameResult.create({
      data: {
        gameId,
        winningTeam,
        mvpPlayerId,
        bestMovePlayerId
      }
    });

    // Обновляем статус игры
    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'COMPLETED' }
    });
    
    res.status(201).json(gameResult);
  } catch (error) {
    console.error('Ошибка при добавлении результатов игры:', error);
    res.status(500).json({ message: 'Ошибка сервера при добавлении результатов игры' });
  }
};
