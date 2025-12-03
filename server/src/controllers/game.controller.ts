import { Request, Response } from 'express';
import { GameService } from '../services/game.service';

// Получение всех игр
export const getAllGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const games = await GameService.getAllGames();
    res.status(200).json(games);
  } catch (error) {
    console.error('Ошибка при получении списка игр:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка игр' });
  }
};

// Получение игры по ID
export const getGameById = async (req: Request, res: Response): Promise<void> => {
  try {
    const gameId = parseInt(req.params.id);
    const game = await GameService.getGameById(gameId);
    
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

    const game = await GameService.createGame(req.body);
    res.status(201).json(game);
  } catch (error: any) {
    console.error('Ошибка при создании игры:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при создании игры' });
  }
};

// Обновление игры
export const updateGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const gameId = parseInt(req.params.id);
    const game = await GameService.updateGame(gameId, req.body);
    res.status(200).json(game);
  } catch (error: any) {
    console.error('Ошибка при обновлении игры:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при обновлении игры' });
  }
};

// Удаление игры
export const deleteGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }
    
    const gameId = parseInt(req.params.id);
    await GameService.deleteGame(gameId);
    res.status(200).json({ message: 'Игра успешно удалена' });
  } catch (error: any) {
    console.error('Ошибка при удалении игры:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении игры' });
  }
};

// Добавление игрока в игру
export const addPlayerToGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const gameId = parseInt(req.params.id);
    const { playerId, role, slotNumber } = req.body;
    
    const result = await GameService.addPlayerToGame(gameId, parseInt(playerId), role, slotNumber);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Ошибка при добавлении игрока в игру:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при добавлении игрока' });
  }
};

// Удаление игрока из игры
export const removePlayerFromGame = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const gameId = parseInt(req.params.id);
    const gamePlayerId = parseInt(req.params.playerId);
    
    await GameService.removePlayerFromGame(gameId, gamePlayerId);
    res.status(200).json({ message: 'Игрок успешно удален из игры' });
  } catch (error: any) {
    console.error('Ошибка при удалении игрока из игры:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении игрока' });
  }
};
