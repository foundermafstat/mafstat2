import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { UserService } from '../services/user.service';
import { PaymentService } from '../services/payment.service';

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await AdminService.getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await AdminService.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователей' });
  }
};

export const getAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователя' });
  }
};

export const createAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.createUser(req.body);
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Ошибка при создании пользователя:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при создании пользователя' });
  }
};

export const updateAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при обновлении пользователя' });
  }
};

export const deleteAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Проверяем, не пытаемся ли мы удалить текущего пользователя
    if (req.user) {
      const currentUserId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : req.user.userId;
      if (parseInt(req.params.id) === currentUserId) {
        res.status(400).json({ message: 'Нельзя удалить текущего пользователя' });
        return;
      }
    }

    await UserService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'Пользователь успешно удален' });
  } catch (error: any) {
    console.error('Ошибка при удалении пользователя:', error);
    res.status(400).json({ message: error.message || 'Ошибка сервера при удалении пользователя' });
  }
};

export const getAdminProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await AdminService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    console.error('Ошибка при получении продуктов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении продуктов' });
  }
};

export const getAdminPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await PaymentService.getAllPayments();
    res.status(200).json(payments);
  } catch (error) {
    console.error('Ошибка при получении платежей:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении платежей' });
  }
};

export const getAdminSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptions = await AdminService.getAllSubscriptions();
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Ошибка при получении подписок:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении подписок' });
  }
};

