import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Массив имен для генерации пользователей
const firstNames = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей',
  'Алексей', 'Артем', 'Илья', 'Кирилл', 'Михаил',
  'Никита', 'Матвей', 'Роман', 'Егор', 'Иван'
];

const lastNames = [
  'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов',
  'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков',
  'Морозов', 'Волков', 'Соловьев', 'Васильев', 'Зайцев'
];

const nicknames = [
  'Shadow', 'Wolf', 'Eagle', 'Tiger', 'Phoenix',
  'Dragon', 'Falcon', 'Bear', 'Fox', 'Lion',
  'Raven', 'Hawk', 'Panther', 'Cobra', 'Viper'
];

const roles = ['civilian', 'mafia', 'don', 'sheriff'] as const;
const gameTypes = ['classic_10', 'classic_8', 'tournament'] as const;
const gameResults = ['civilians', 'mafia', 'draw'] as const;

async function main() {
  console.log('🌱 Начинаем seeding...');

  // Получаем существующие клубы и федерации
  const clubs = await prisma.club.findMany();
  const federations = await prisma.federation.findMany();
  const existingUsers = await prisma.user.findMany();

  if (clubs.length === 0) {
    console.log('⚠️  Нет клубов в базе. Создайте клубы перед запуском seed.');
    return;
  }

  if (federations.length === 0) {
    console.log('⚠️  Нет федераций в базе. Создайте федерации перед запуском seed.');
    return;
  }

  // Создаем 15 новых пользователей
  console.log('👥 Создаем 15 новых пользователей...');
  const newUsers = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const nickname = nicknames[i];
    const email = `user${existingUsers.length + i + 1}@example.com`;
    const club = clubs[Math.floor(Math.random() * clubs.length)];

    const user = await prisma.user.create({
      data: {
        name: firstName,
        surname: lastName,
        nickname: nickname,
        email: email,
        password: hashedPassword,
        country: 'Russia',
        clubId: club.id,
        role: 'user',
      },
    });

    newUsers.push(user);
    console.log(`✅ Создан пользователь: ${firstName} ${lastName} (${nickname})`);
  }

  // Объединяем существующих и новых пользователей
  const allUsers = [...existingUsers, ...newUsers];

  if (allUsers.length < 10) {
    console.log('⚠️  Недостаточно пользователей для создания игр. Нужно минимум 10.');
    return;
  }

  // Создаем 10 игр
  console.log('🎮 Создаем 10 игр с заполненными данными...');

  for (let gameIndex = 0; gameIndex < 10; gameIndex++) {
    const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    const playerCount = gameType === 'classic_8' ? 8 : 10;
    const result = gameResults[Math.floor(Math.random() * gameResults.length)];
    const club = clubs[Math.floor(Math.random() * clubs.length)];
    const federation = federations[Math.floor(Math.random() * federations.length)];
    const referee = allUsers[Math.floor(Math.random() * allUsers.length)];

    // Выбираем случайных игроков для игры
    const shuffledUsers = [...allUsers].sort(() => Math.random() - 0.5);
    const gamePlayers = shuffledUsers.slice(0, playerCount);

    // Распределяем роли
    const rolesForGame: (typeof roles[number])[] = [];
    if (playerCount === 10) {
      rolesForGame.push('don', 'sheriff', 'mafia', 'mafia', 'mafia');
      for (let i = 0; i < 5; i++) rolesForGame.push('civilian');
    } else {
      rolesForGame.push('don', 'sheriff', 'mafia', 'mafia');
      for (let i = 0; i < 4; i++) rolesForGame.push('civilian');
    }
    rolesForGame.sort(() => Math.random() - 0.5);

    // Создаем игру
    const game = await prisma.game.create({
      data: {
        name: `Игра #${gameIndex + 1}`,
        description: `Тестовая игра ${gameIndex + 1}`,
        gameType: gameType,
        result: result,
        refereeId: referee.id,
        refereeComments: `Комментарии судьи к игре ${gameIndex + 1}`,
        tableNumber: Math.floor(Math.random() * 10) + 1,
        clubId: club.id,
        federationId: federation.id,
        gamePlayers: {
          create: gamePlayers.map((player, index) => ({
            playerId: player.id,
            role: rolesForGame[index],
            slotNumber: index + 1,
            fouls: Math.floor(Math.random() * 3),
            additionalPoints: Math.floor(Math.random() * 5),
          })),
        },
      },
    });

    console.log(`✅ Создана игра #${gameIndex + 1} (ID: ${game.id})`);

    // Создаем этапы игры
    const stagesCount = Math.floor(Math.random() * 5) + 3; // 3-7 этапов
    const mafiaPlayers = gamePlayers.filter((_, idx) => 
      rolesForGame[idx] === 'mafia' || rolesForGame[idx] === 'don'
    );
    const civilianPlayers = gamePlayers.filter((_, idx) => 
      rolesForGame[idx] === 'civilian' || rolesForGame[idx] === 'sheriff'
    );

    for (let stageIndex = 0; stageIndex < stagesCount; stageIndex++) {
      const isNight = stageIndex % 2 === 0;
      const stageType = isNight ? 'night' : 'day';
      const orderNumber = stageIndex + 1;

      let stageData: any = {};

      if (isNight) {
        // Ночной этап
        const mafiaShot = Math.random() > 0.3 
          ? civilianPlayers[Math.floor(Math.random() * civilianPlayers.length)]?.id 
          : null;
        const donCheck = Math.random() > 0.5 
          ? civilianPlayers[Math.floor(Math.random() * civilianPlayers.length)]?.id 
          : null;
        const sheriffCheck = Math.random() > 0.5 
          ? mafiaPlayers[Math.floor(Math.random() * mafiaPlayers.length)]?.id 
          : null;

        stageData = {
          mafiaShot: mafiaShot,
          mafiaMissed: mafiaShot === null ? [mafiaPlayers[0]?.id].filter(Boolean) : [],
          donCheck: donCheck,
          sheriffCheck: sheriffCheck,
        };
      } else {
        // Дневной этап
        const candidates = civilianPlayers
          .slice(0, Math.min(3, civilianPlayers.length))
          .map((_, idx) => idx + 1);
        const votes = Array.from({ length: playerCount }, () => 
          Math.floor(Math.random() * playerCount) + 1
        );
        const results = candidates.slice(0, Math.min(2, candidates.length));

        stageData = {
          candidates: candidates,
          votes: votes,
          revote: Math.random() > 0.7 ? votes : [],
          results: results,
        };
      }

      await prisma.gameStage.create({
        data: {
          gameId: game.id,
          type: stageType,
          orderNumber: orderNumber,
          data: stageData,
        },
      });
    }

    console.log(`  └─ Создано ${stagesCount} этапов для игры #${gameIndex + 1}`);
  }

  console.log('✅ Seeding завершен успешно!');
  console.log(`📊 Создано:`);
  console.log(`   - 15 новых пользователей`);
  console.log(`   - 10 игр с заполненными данными`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

