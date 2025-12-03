import { Router } from 'express';
import {
  getFederations,
  getFederation,
  createFederation,
  updateFederation,
  deleteFederation,
} from '../controllers/federation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Публичные маршруты
router.get('/', getFederations);
router.get('/:id', getFederation);

// Защищенные маршруты (требуется аутентификация)
router.post('/', authenticate, createFederation);
router.put('/:id', authenticate, updateFederation);
router.delete('/:id', authenticate, deleteFederation);

export default router;

