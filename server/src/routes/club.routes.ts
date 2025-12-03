import { Router } from 'express';
import {
  getClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
} from '../controllers/club.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Публичные маршруты
router.get('/', getClubs);
router.get('/:id', getClub);

// Защищенные маршруты (требуется аутентификация)
router.post('/', authenticate, createClub);
router.put('/:id', authenticate, updateClub);
router.delete('/:id', authenticate, deleteClub);

export default router;

