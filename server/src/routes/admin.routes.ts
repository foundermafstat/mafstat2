import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminProducts,
  getAdminPayments,
  getAdminSubscriptions,
} from '../controllers/admin.controller';
import { authenticate, checkRole } from '../middlewares/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации и роли admin
router.use(authenticate);
router.use(checkRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUser);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);
router.get('/products', getAdminProducts);
router.get('/payments', getAdminPayments);
router.get('/subscriptions', getAdminSubscriptions);

export default router;

