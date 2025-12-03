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
// ВАЖНО: Специфичные маршруты должны быть ПЕРЕД параметризованными
router.get('/stats', getUsersWithStats); // Должен быть перед /:id
router.get('/premium-status', authenticate, getPremiumStatus);
router.get('/', getUsers);
router.get('/:id', getUser);

// Защищенные маршруты (требуется аутентификация)
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/use-premium-night', authenticate, usePremiumNight);

// Маршруты для создания/обновления/удаления (требуется аутентификация)
router.post('/', authenticate, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

export default router;

