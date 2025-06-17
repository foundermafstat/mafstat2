import { Router } from 'express';
import { register, login, refreshAccessToken, getProfile, logout } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { body } from 'express-validator';

const router = Router();

// Валидация для регистрации
const registerValidation = [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать не менее 6 символов'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username должен содержать не менее 3 символов'),
];

// Валидация для входа
const loginValidation = [
  body('email').isEmail().withMessage('Введите корректный email'),
  body('password').exists().withMessage('Пароль обязателен'),
];

// Маршруты аутентификации
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);
router.get('/profile', authenticate, getProfile);

export default router;
