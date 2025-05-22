import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Типы данных для этапов игры
interface NightStageData {
  mafiaShot: number | null;
  donCheck: number | null;
  sheriffCheck: number | null;
}

interface DayStageData {
  candidates: number[];
  votes: number[];
  revote?: number[];
  results: number[];
}

async function main() {
  try {
    console.log('Начинаем добавление этапов в существующие игры...');
    
    // Получаем список игр
    const games = await prisma.game.findMany({
      include: {
        gamePlayers: true,
        gameStages: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`Найдено ${games.length} игр`);
    
    if (games.length === 0) {
      console.log('Игры не найдены.');
      return;
    }
    
    for (const game of games) {
      // Пропускаем игры, у которых уже есть этапы
      if (game.gameStages && game.gameStages.length > 0) {
        console.log(`Игра ID ${game.id} уже имеет ${game.gameStages.length} этапов. Пропускаем.`);
        continue;
      }
      
      if (!game.gamePlayers || game.gamePlayers.length === 0) {
        console.log(`Игра ID ${game.id} не имеет игроков. Пропускаем.`);
        continue;
      }
      
      console.log(`Добавляем этапы для игры ID ${game.id} (${game.name || 'Без названия'})`);
      
      // Игроки в игре
      const players = game.gamePlayers;
      
      // Создаем случайное количество этапов (2-5 дней/ночей)
      const numberOfRounds = Math.floor(Math.random() * 3) + 2; // 2-4 раунда
      
      for (let round = 1; round <= numberOfRounds; round++) {
        // Создаем ночной этап
        await createNightStage(game.id, round, players);
        
        // Создаем дневной этап (кроме последнего раунда, если игра закончилась победой мафии)
        if (round < numberOfRounds || game.result !== 'mafia_win') {
          await createDayStage(game.id, round, players);
        }
      }
      
      console.log(`Добавлено ${numberOfRounds * 2 - (game.result === 'mafia_win' ? 1 : 0)} этапов для игры ID ${game.id}`);
    }
    
    console.log('Операция завершена успешно!');
  } catch (error) {
    console.error('Ошибка при добавлении этапов в игры:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Создание ночного этапа
async function createNightStage(gameId: number, round: number, players: any[]) {
  // Получаем игроков по ролям
  const mafiaPlayers = players.filter(p => p.role === 'mafia' || p.role === 'don');
  const donPlayer = players.find(p => p.role === 'don');
  const sheriffPlayer = players.find(p => p.role === 'sheriff');
  const civilianPlayers = players.filter(p => p.role === 'civilian' || p.role === 'sheriff');
  
  // Подготавливаем данные для ночного этапа
  const nightData: NightStageData = {
    mafiaShot: civilianPlayers.length > 0 
      ? Math.random() > 0.2  // 80% шанс, что выстрел будет успешным
        ? civilianPlayers[Math.floor(Math.random() * civilianPlayers.length)].slotNumber
        : null
      : null,
    donCheck: sheriffPlayer && donPlayer && Math.random() > 0.5
      ? sheriffPlayer.slotNumber
      : civilianPlayers.length > 0
        ? civilianPlayers[Math.floor(Math.random() * civilianPlayers.length)].slotNumber
        : null,
    sheriffCheck: sheriffPlayer && mafiaPlayers.length > 0 && Math.random() > 0.5
      ? mafiaPlayers[Math.floor(Math.random() * mafiaPlayers.length)].slotNumber
      : civilianPlayers.length > 1 && sheriffPlayer
        ? civilianPlayers.filter(p => p.id !== sheriffPlayer.id)[Math.floor(Math.random() * (civilianPlayers.length - 1))].slotNumber
        : null
  };
  
  // Создаем ночной этап
  await prisma.gameStage.create({
    data: {
      gameId: gameId,
      type: 'night',
      orderNumber: (round * 2) - 1, // Нечетные номера для ночей
      data: nightData as any
    }
  });
  
  console.log(`  Создан этап "Ночь ${round}" для игры ID ${gameId}`);
}

// Создание дневного этапа
async function createDayStage(gameId: number, round: number, players: any[]) {
  // Случайно выбираем 2-3 кандидатов на голосование
  const numCandidates = Math.floor(Math.random() * 2) + 2; // 2-3 кандидата
  const selectedCandidates: number[] = [];
  
  const availablePlayers = [...players];
  
  for (let i = 0; i < Math.min(numCandidates, availablePlayers.length); i++) {
    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    selectedCandidates.push(availablePlayers[randomIndex].slotNumber);
    availablePlayers.splice(randomIndex, 1);
  }
  
  // Генерируем случайные голоса
  const votes = selectedCandidates.map(() => 0);
  const totalVotes = players.length;
  
  // Распределяем голоса
  for (let i = 0; i < totalVotes; i++) {
    const randomCandidateIndex = Math.floor(Math.random() * selectedCandidates.length);
    votes[randomCandidateIndex]++;
  }
  
  // Проверяем, нужно ли переголосование
  const maxVotes = Math.max(...votes);
  const candidatesWithMaxVotes = votes.filter(v => v === maxVotes).length;
  
  let revote: number[] | undefined = undefined;
  let results: number[] = [];
  
  // Если есть несколько кандидатов с одинаковым количеством голосов
  if (candidatesWithMaxVotes > 1 && Math.random() > 0.5) {
    revote = [];
    
    // Выбираем кандидатов для переголосования
    selectedCandidates.forEach((candidate, index) => {
      if (votes[index] === maxVotes) {
        revote!.push(candidate);
      }
    });
    
    // Генерируем новые голоса
    const revoteResults = revote.map(() => 0);
    for (let i = 0; i < totalVotes; i++) {
      const randomCandidateIndex = Math.floor(Math.random() * revote!.length);
      revoteResults[randomCandidateIndex]++;
    }
    
    // Определяем результат переголосования
    const maxRevoteVotes = Math.max(...revoteResults);
    const winnersIndices = revoteResults
      .map((votes, index) => ({ votes, index }))
      .filter(item => item.votes === maxRevoteVotes)
      .map(item => item.index);
    
    // Выбираем победителя переголосования
    const winnerIndex = winnersIndices[Math.floor(Math.random() * winnersIndices.length)];
    results = [revote[winnerIndex]];
  } else {
    // Если нет переголосования, просто выбираем игрока с наибольшим количеством голосов
    const winnersIndices = votes
      .map((votes, index) => ({ votes, index }))
      .filter(item => item.votes === maxVotes)
      .map(item => item.index);
    
    const winnerIndex = winnersIndices[Math.floor(Math.random() * winnersIndices.length)];
    results = [selectedCandidates[winnerIndex]];
  }
  
  // Подготавливаем данные для дневного этапа
  const dayData: DayStageData = {
    candidates: selectedCandidates,
    votes: votes,
    revote: revote,
    results: results
  };
  
  // Создаем дневной этап
  await prisma.gameStage.create({
    data: {
      gameId: gameId,
      type: 'day',
      orderNumber: round * 2, // Четные номера для дней
      data: dayData as any
    }
  });
  
  console.log(`  Создан этап "День ${round}" для игры ID ${gameId}`);
}

main().catch(e => {
  console.error('Неперехваченная ошибка:', e);
  process.exit(1);
});
