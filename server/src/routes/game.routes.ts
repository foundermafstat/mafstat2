import { Router } from 'express';
import { getAllGames, getGameById, createGame, updateGame, deleteGame, addGameResult } from '../controllers/game.controller';
import { authenticate, checkRole } from '../middlewares/auth.middleware';
import { body } from 'express-validator';

const router = Router();

// Валидация для создания игры
const gameValidation = [
  body('date').isISO8601().withMessage('Дата должна быть в формате ISO8601'),
  body('location').optional().isString().withMessage('Локация должна быть строкой'),
  body('tableName').optional().isString().withMessage('Название стола должно быть строкой'),
  body('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Некорректный статус'),
  body('playerIds').optional().isArray().withMessage('playerIds должен быть массивом'),
  body('isPublic').optional().isBoolean().withMessage('isPublic должен быть булевым значением'),
];

// Валидация для результатов игры
const resultValidation = [
  body('winningTeam').isIn(['MAFIA', 'CIVILIANS', 'DRAW']).withMessage('Некорректная победившая команда'),
  body('mvpPlayerId').optional().isString().withMessage('ID MVP должен быть строкой'),
  body('bestMovePlayerId').optional().isString().withMessage('ID игрока с лучшим ходом должен быть строкой'),
];

// Маршруты для игр
router.get('/', getAllGames);
router.get('/:id', getGameById);
router.post('/', authenticate, gameValidation, createGame);
router.put('/:id', authenticate, gameValidation, updateGame);
router.delete('/:id', authenticate, deleteGame);
router.post('/:id/results', authenticate, resultValidation, addGameResult);

export default router;
