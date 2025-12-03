import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import config from '../config';

// Тип для полезной нагрузки токена
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Хеширование пароля
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// Сравнение пароля с хешем
export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Создание JWT токена
export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id.toString(),
    email: user.email || '',
    role: user.role
  };

  // Используем сигнатуру без дополнительных опций
  return jwt.sign(payload, String(config.jwtSecret));
};

// Создание refresh токена
export const generateRefreshToken = (): string => {
  // Используем сигнатуру без дополнительных опций
  return jwt.sign({}, String(config.jwtSecret));
};

// Верификация токена
export const verifyToken = (token: string): JwtPayload => {
  try {
    const secret = String(config.jwtSecret);
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
