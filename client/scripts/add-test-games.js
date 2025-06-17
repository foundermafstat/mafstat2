#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Начинаем создание тестовых игр...');
    
    // Получаем существующих игроков
    const users = await prisma.user.findMany({
      take: 10, // Ограничиваем количество до 10 игроков
      orderBy: { id: 'asc' }
    });
    
    if (users.length < 10) {
      console.error('Недостаточно игроков в базе данных. Необходимо минимум 10 игроков.');
      return;
    }
    
    // Сначала удалим существующие тестовые игры, если они есть
    console.log('Удаление существующих тестовых игр...');
    try {
      await prisma.gamePlayer.deleteMany({
        where: {
          gameId: { in: [6, 7, 8, 9, 10] } // Удаляем игроков из тестовых игр с ID 6-10
        }
      });
      
      await prisma.game.deleteMany({
        where: {
          id: { in: [6, 7, 8, 9, 10] } // Удаляем тестовые игры с ID 6-10
        }
      });
    } catch (error) {
      console.log('Ошибка при удалении существующих игр, продолжаем...', error.message);
    }
    
    // Создаем новую игру
    const newGame = await prisma.game.create({
      data: {
        name: 'Тестовая игра классическая 10',
        description: 'Классическая игра на 10 человек с подробными результатами',
        gameType: 'classic_10',
        result: 'civilians_win', // Победа мирных
        refereeId: users[0].id, // Первый пользователь будет судьей
        refereeComments: 'Отличная игра! Мирные одержали уверенную победу благодаря хорошей координации.',
        tableNumber: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    console.log(`Создана новая игра с ID: ${newGame.id}`);
    
    // Распределяем роли для игроков
    const roles = [
      'civilian', 'civilian', 'civilian', 'civilian', 'civilian', 'civilian', // 6 мирных
      'sheriff', // 1 шериф
      'mafia', 'mafia', // 2 мафии
      'don' // 1 дон
    ];
    
    // Распределяем игроков по слотам с различными результатами
    // Внимание: Каждый игрок может быть только в одном слоте в одной игре (уникальное ограничение)
    const playerAssignments = [
      { userId: users[1].id, role: 'sheriff', slot: 1, additionalPoints: 1.5, fouls: 0 },
      { userId: users[2].id, role: 'mafia', slot: 2, additionalPoints: 0.5, fouls: 1 },
      { userId: users[3].id, role: 'civilian', slot: 3, additionalPoints: 2.0, fouls: 0 },
      { userId: users[4].id, role: 'don', slot: 4, additionalPoints: 1.0, fouls: 0 },
      { userId: users[5].id, role: 'civilian', slot: 5, additionalPoints: 0.0, fouls: 2 },
      { userId: users[6].id, role: 'civilian', slot: 6, additionalPoints: 0.5, fouls: 1 },
      { userId: users[7].id, role: 'mafia', slot: 7, additionalPoints: 0.0, fouls: 0 },
      { userId: users[8].id, role: 'civilian', slot: 8, additionalPoints: 1.0, fouls: 0 },
      { userId: users[9].id, role: 'civilian', slot: 9, additionalPoints: 0.5, fouls: 0 },
      // Для слота 10 используем другого пользователя (судью в качестве игрока)
      { userId: users[0].id, role: 'civilian', slot: 10, additionalPoints: 0.0, fouls: 1 },
    ];
    
    // Создаем записи игроков для этой игры
    for (const assignment of playerAssignments) {
      await prisma.gamePlayer.create({
        data: {
          gameId: newGame.id,
          playerId: assignment.userId,
          role: assignment.role,
          slotNumber: assignment.slot,
          additionalPoints: assignment.additionalPoints,
          fouls: assignment.fouls,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log(`Добавлен игрок ID: ${assignment.userId} в слот ${assignment.slot} с ролью ${assignment.role}`);
    }
    
    // Создаем вторую игру с другим результатом
    const secondGame = await prisma.game.create({
      data: {
        name: 'Тестовая игра мафия победила',
        description: 'Классическая игра на 10 человек с победой мафии',
        gameType: 'classic_10',
        result: 'mafia_win', // Победа мафии
        refereeId: users[0].id, // Первый пользователь будет судьей
        refereeComments: 'Мафия отлично скоординировалась и смогла переиграть мирных',
        tableNumber: 1,
        createdAt: new Date(Date.now() - 86400000), // Вчерашняя дата
        updatedAt: new Date(Date.now() - 86400000),
      }
    });
    
    console.log(`Создана вторая игра с ID: ${secondGame.id}`);
    
    // Другое распределение ролей для второй игры
    // Исправлена ошибка уникального ограничения - каждый игрок может быть только в одном слоте
    const secondPlayerAssignments = [
      { userId: users[3].id, role: 'sheriff', slot: 1, additionalPoints: 0.5, fouls: 1 },
      { userId: users[4].id, role: 'civilian', slot: 2, additionalPoints: 0.0, fouls: 0 },
      { userId: users[5].id, role: 'mafia', slot: 3, additionalPoints: 2.5, fouls: 0 },
      { userId: users[6].id, role: 'civilian', slot: 4, additionalPoints: 1.0, fouls: 2 },
      { userId: users[7].id, role: 'don', slot: 5, additionalPoints: 3.0, fouls: 0 },
      { userId: users[8].id, role: 'civilian', slot: 6, additionalPoints: 0.0, fouls: 0 },
      { userId: users[9].id, role: 'mafia', slot: 7, additionalPoints: 2.0, fouls: 0 },
      { userId: users[1].id, role: 'civilian', slot: 8, additionalPoints: 0.5, fouls: 1 },
      { userId: users[2].id, role: 'civilian', slot: 9, additionalPoints: 0.0, fouls: 0 },
      { userId: users[0].id, role: 'civilian', slot: 10, additionalPoints: 0.0, fouls: 0 },
    ];
    
    // Создаем записи игроков для второй игры
    for (const assignment of secondPlayerAssignments) {
      await prisma.gamePlayer.create({
        data: {
          gameId: secondGame.id,
          playerId: assignment.userId,
          role: assignment.role,
          slotNumber: assignment.slot,
          additionalPoints: assignment.additionalPoints,
          fouls: assignment.fouls,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        }
      });
      console.log(`Добавлен игрок ID: ${assignment.userId} в слот ${assignment.slot} с ролью ${assignment.role} для второй игры`);
    }
    
    console.log('Тестовые игры успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании тестовых игр:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
