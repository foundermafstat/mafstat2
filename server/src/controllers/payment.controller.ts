import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await PaymentService.getAllPayments();
    res.status(200).json(payments);
  } catch (error) {
    console.error('Ошибка при получении платежей:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении платежей' });
  }
};

export const getUserPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : req.user.userId;
    const payments = await PaymentService.getUserPayments(userId);
    res.status(200).json({
      success: true,
      payments,
      totalCount: payments.length,
      completedCount: payments.filter(p => p.status === 'completed').length,
      pendingCount: payments.filter(p => p.status === 'pending').length,
      totalSpent: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
    });
  } catch (error) {
    console.error('Ошибка при получении платежей пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении платежей' });
  }
};

export const getPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await PaymentService.getPaymentById(req.params.id);
    if (!payment) {
      res.status(404).json({ message: 'Платеж не найден' });
      return;
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error('Ошибка при получении платежа:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении платежа' });
  }
};

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await PaymentService.createPayment(req.body);
    res.status(201).json(payment);
  } catch (error: any) {
    console.error('Ошибка при создании платежа:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при создании платежа' });
  }
};

export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = await PaymentService.updatePayment(req.params.id, req.body);
    res.status(200).json(payment);
  } catch (error: any) {
    console.error('Ошибка при обновлении платежа:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при обновлении платежа' });
  }
};

export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    await PaymentService.deletePayment(req.params.id);
    res.status(200).json({ message: 'Платеж успешно удален' });
  } catch (error: any) {
    console.error('Ошибка при удалении платежа:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении платежа' });
  }
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { planId } = req.body;
    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : req.user.userId;
    const user = await PaymentService.createCheckoutSession({
      userId,
      userEmail: req.user.email,
      planId,
    });

    res.status(200).json(user);
  } catch (error: any) {
    console.error('Ошибка при создании checkout сессии:', error);
    res.status(400).json({ error: error.message || 'Ошибка сервера при создании checkout сессии' });
  }
};

export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const result = await PaymentService.checkPaymentStatus(sessionId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Ошибка при проверке статуса платежа:', error);
    res.status(400).json({ success: false, error: error.message || 'Ошибка сервера' });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : req.user.userId;
    const result = await PaymentService.cancelSubscription(userId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Ошибка при отмене подписки:', error);
    res.status(400).json({ success: false, error: error.message || 'Ошибка сервера' });
  }
};

