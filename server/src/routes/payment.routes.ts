import { Router } from 'express';
import {
  getPayments,
  getUserPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  createCheckoutSession,
  checkPaymentStatus,
  cancelSubscription,
} from '../controllers/payment.controller';
import { authenticate, checkRole } from '../middlewares/auth.middleware';

const router = Router();

// Защищенные маршруты (требуется аутентификация)
router.get('/user', authenticate, getUserPayments);
router.post('/create-checkout', authenticate, createCheckoutSession);
router.post('/check-status', authenticate, checkPaymentStatus);
router.post('/cancel-subscription', authenticate, cancelSubscription);

// Маршруты для работы с платежами (требуется аутентификация)
router.get('/', authenticate, getPayments);
router.get('/:id', authenticate, getPayment);
router.post('/', authenticate, createPayment);
router.put('/:id', authenticate, updatePayment);
router.delete('/:id', authenticate, deletePayment);

export default router;

