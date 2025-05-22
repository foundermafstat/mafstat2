import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Роли игроков в мафии
const ROLES = ['civilian', 'civilian', 'civilian', 'civilian', 'civilian', 'civilian', 'mafia', 'mafia', 'sheriff', 'don'];

// ID игры, для которой нужно добавить игроков
const GAME_ID = 7; // Измените на нужный ID игры

async function main() {
  try {
    console.log(`Начинаем добавление игроков в игру ID ${GAME_ID}...`);
    
    // Проверяем, существует ли игра
    const game = await prisma.game.findUnique({
      where: { id: GAME_ID },
      include: {
        gamePlayers: true
      }
    });
    
    if (!game) {
      console.error(`Игра с ID ${GAME_ID} не найдена.`);
      return;
    }
    
    console.log(`Найдена игра: ${game.name || 'Без названия'} (ID: ${game.id})`);
    
    // Проверяем, есть ли уже игроки в игре
    if (game.gamePlayers && game.gamePlayers.length > 0) {
      console.log(`Игра ID ${game.id} уже имеет ${game.gamePlayers.length} игроков. Удаляем их...`);
      
      // Удаляем существующих игроков
      await prisma.gamePlayer.deleteMany({
        where: { gameId: game.id }
      });
      
      console.log(`Игроки удалены.`);
    }
    
    // Получаем список всех игроков
    const players = await prisma.user.findMany({
      where: {
        isTournamentJudge: false,  // Не выбираем судей
        isSideJudge: false         // Не выбираем боковых судей
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`Найдено ${players.length} игроков.`);
    
    if (players.length === 0) {
      console.error('Игроки не найдены. Создайте игроков перед добавлением их в игры.');
      return;
    }
    
    // Берем случайную выборку из 10 игроков для игры
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // Распределяем роли между игроками
    const shuffledRoles = [...ROLES].sort(() => 0.5 - Math.random());
    
    // Создаем записи игроков в игре
    for (let i = 0; i < Math.min(shuffledPlayers.length, 10); i++) {
      const player = shuffledPlayers[i];
      const role = shuffledRoles[i];
      const slotNumber = i + 1;
      
      await prisma.gamePlayer.create({
        data: {
          gameId: game.id,
          playerId: player.id,
          role: role,
          slotNumber: slotNumber,
          fouls: Math.floor(Math.random() * 3),  // 0-2 фолов случайным образом
          additionalPoints: parseFloat((Math.random() * 2).toFixed(1)),  // 0-2 дополнительных баллов
        }
      });
      
      console.log(`Добавлен игрок ${player.name} ${player.surname || ''} как ${role} в слот ${slotNumber}`);
    }
    
    // Обновляем количество игроков в игре
    await prisma.game.update({
      where: { id: game.id },
      data: {
        // Если результат еще не установлен, случайным образом устанавливаем
        result: game.result || (Math.random() > 0.5 ? 'civilians_win' : 'mafia_win')
      }
    });
    
    console.log(`Игра ID ${game.id} обновлена с 10 игроками`);
    console.log('Операция завершена успешно!');
  } catch (error) {
    console.error('Ошибка при добавлении игроков в игру:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error('Неперехваченная ошибка:', e);
  process.exit(1);
});
