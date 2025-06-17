import app from './app';
import config from './config';
import { prisma } from './utils/db';

const PORT = config.port;

// Функция для корректного завершения приложения
const gracefulShutdown = async () => {
  try {
    // Закрываем соединение с базой данных
    await prisma.$disconnect();
    console.log('Соединение с базой данных закрыто');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при закрытии соединений:', error);
    process.exit(1);
  }
};

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
===========================================
🚀 Сервер запущен на порту ${PORT}
📡 Режим: ${config.nodeEnv}
📂 База данных: Prisma с PostgreSQL
===========================================
  `);
});

// Обработчики сигналов для корректного завершения
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
