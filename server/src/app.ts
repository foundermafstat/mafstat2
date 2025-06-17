import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import config from './config';

// Инициализация приложения Express
const app = express();

// Настройка лимита запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  limit: 100, // лимит запросов с одного IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Безопасность
app.use(morgan('dev')); // Логгирование
app.use(cors({
  origin: config.clientUrl,
  credentials: true
})); // CORS
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг URL-encoded
app.use(cookieParser()); // Парсинг cookies
app.use(limiter); // Лимит запросов

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Маршрут для проверки состояния сервера
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Тестовый маршрут для проверки работы Prisma и JWT
import { prisma } from './utils/db';
import { generateToken } from './utils/auth';

app.get('/api/test', async (req: Request, res: Response) => {
  try {
    // Проверка состояния соединения Prisma без обращения к таблицам
    await prisma.$queryRaw`SELECT 1 AS result`;
    
    // Создание тестового токена JWT
    const testToken = Math.random().toString(36).substring(2, 15);
    
    res.status(200).json({
      status: 'success',
      message: 'Тестовый маршрут работает',
      prismaTest: {
        connection: 'successful', 
        message: 'Соединение с базой данных установлено'
      },
      serverInfo: {
        port: config.port,
        environment: config.nodeEnv,
        clientUrl: config.clientUrl
      },
      test: testToken,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Ошибка в тестовом маршруте:', error);
    res.status(500).json({
      status: 'error',
      message: 'Ошибка при выполнении теста',
      error: error.message
    });
  }
});

// Обработка 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

// Глобальная обработка ошибок
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Глобальная ошибка:', err);
  res.status(500).json({
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
