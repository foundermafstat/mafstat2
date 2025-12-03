import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/auth';

// Расширяем Express Request, чтобы включить пользовательскую информацию
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware для проверки аутентификации
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Не авторизован - токен отсутствует' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decodedToken = verifyToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Не авторизован - токен недействителен или истек' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка аутентификации' });
  }
};

// Middleware для проверки роли пользователя
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    // Проверяем роль (может быть 'admin' или 'ADMIN' в зависимости от системы)
    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ message: 'Доступ запрещен - недостаточно прав' });
    }
  };
};
