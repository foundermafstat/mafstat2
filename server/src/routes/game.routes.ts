import { Router } from 'express';
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  addPlayerToGame,
  removePlayerFromGame,
} from '../controllers/game.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Публичные маршруты
router.get('/', getAllGames);
router.get('/:id', getGameById);

// Защищенные маршруты (требуется аутентификация)
router.post('/', authenticate, createGame);
router.put('/:id', authenticate, updateGame);
router.delete('/:id', authenticate, deleteGame);
router.post('/:id/players', authenticate, addPlayerToGame);
router.delete('/:id/players/:playerId', authenticate, removePlayerFromGame);

export default router;
