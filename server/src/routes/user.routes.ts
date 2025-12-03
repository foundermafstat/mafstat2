import { Router } from 'express';
import {
  getUsers,
  getUsersWithStats,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getPremiumStatus,
  usePremiumNight,
} from '../controllers/user.controller';
import { authenticate, checkRole } from '../middlewares/auth.middleware';
import { body } from 'express-validator';

const router = Router();

// Публичные маршруты
router.get('/', getUsers);
router.get('/:id', getUser);

// Защищенные маршруты (требуется аутентификация)
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.get('/premium-status', authenticate, getPremiumStatus);
router.post('/use-premium-night', authenticate, usePremiumNight);

// Маршрут для получения пользователей со статистикой
router.get('/stats', getUsersWithStats);

// Маршруты для создания/обновления/удаления (требуется аутентификация)
router.post('/', authenticate, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;

