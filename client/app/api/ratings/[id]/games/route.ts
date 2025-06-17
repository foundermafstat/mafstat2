import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET: Получение игр, включенных в рейтинг
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;

    // Получаем игры, включенные в рейтинг
    const games = await prisma.ratingGame.findMany({
      where: {
        ratingId: Number(ratingId)
      },
      include: {
        game: true
      },
      orderBy: {
        game: {
          createdAt: 'desc'
        }
      }
    }).then(ratingGames => 
      ratingGames.map(rg => ({
        ...rg.game,
        added_to_rating_at: rg.addedAt
      }))
    );

    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error(`Error fetching rating games for rating ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rating games" },
      { status: 500 }
    );
  }
}

// POST: Добавление игры в рейтинг
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Объявляем переменную вне блока try/catch для доступа в catch
  const ratingId = params.id;
  try {
    // Используем ratingId, объявленный выше
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { game_id, game_ids } = data;
    
    // Поддерживаем как один game_id, так и массив game_ids
    if (!game_id && (!game_ids || !Array.isArray(game_ids) || game_ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 }
      );
    }
    
    // Определяем, с какими ID работаем
    const gameIdsToAdd = game_ids || [game_id];
    
    // Проверяем, существует ли рейтинг и имеет ли пользователь права на его изменение
    const checkResults = await query(
      `SELECT r.*, u.email 
       FROM ratings r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1`,
      [ratingId]
    );
    
    if (!checkResults || checkResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rating not found" },
        { status: 404 }
      );
    }
    
    // Проверка прав доступа - только владелец может редактировать
    if (checkResults[0].email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this rating" },
        { status: 403 }
      );
    }
    
    // Проверяем, что игра не добавлена в рейтинг
    const existingGames = await prisma.ratingGame.findMany({
      where: {
        ratingId: ratingId,
        gameId: { in: gameIdsToAdd.map((id: string | number) => Number(id)) }
      },
      select: { gameId: true }
    });
    
    if (existingGames.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Game with ID ${existingGames[0].gameId} is already in this rating` 
        },
        { status: 400 }
      );
    }
    
    // Проверяем существование игр
    const gamesExist = await prisma.game.findMany({
      where: {
        id: { in: gameIdsToAdd.map((id: string | number) => Number(id)) }
      },
      select: { id: true }
    });
    
    if (gamesExist.length !== gameIdsToAdd.length) {
      return NextResponse.json(
        { success: false, error: "One or more games not found" },
        { status: 404 }
      );
    }
    
    // Добавляем игры в рейтинг
    await prisma.ratingGame.createMany({
      data: gameIdsToAdd.map((gameId: string | number) => ({
        ratingId: ratingId,
        gameId: Number(gameId),
        addedAt: new Date(),
        addedBy: session.user?.email || ''
      })),
      skipDuplicates: true
    });
    
    // Запускаем пересчет рейтинговых результатов
    await recalculateRatingResults(ratingId);
    
    return NextResponse.json(
      { success: true, message: "Game(s) added to rating successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding game to rating", ratingId, ":", error);
    return NextResponse.json(
      { success: false, error: "Failed to add game to rating" },
      { status: 500 }
    );
  }
}

// DELETE: Удаление игры из рейтинга
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Получаем идентификатор игры из URL параметров
    const url = new URL(request.url);
    const gameId = url.searchParams.get("game_id");
    
    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 }
      );
    }
    
    // Проверяем, существует ли рейтинг и имеет ли пользователь права на его изменение
    const checkResults = await query(
      `SELECT r.*, u.email 
       FROM ratings r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1`,
      [ratingId]
    );
    
    if (!checkResults || checkResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rating not found" },
        { status: 404 }
      );
    }
    
    // Проверка прав доступа - только владелец может редактировать
    if (checkResults[0].email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this rating" },
        { status: 403 }
      );
    }
    
    // Удаляем игру из рейтинга
    await prisma.ratingGame.deleteMany({
      where: {
        ratingId: ratingId,
        gameId: Number(gameId)
      }
    });
    
    // Запускаем пересчет рейтинговых результатов
    await recalculateRatingResults(ratingId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error removing game from rating ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to remove game from rating" },
      { status: 500 }
    );
  }
}

// Функция пересчета результатов рейтинга
async function recalculateRatingResults(ratingId: string | number) {
  try {
    // Сначала очищаем предыдущие результаты
    await prisma.ratingResult.deleteMany({
      where: { ratingId: Number(ratingId) }
    });
    
    // Получаем все игры в рейтинге
    const ratingGames = await prisma.ratingGame.findMany({
      where: { ratingId: Number(ratingId) },
      select: { gameId: true }
    });
    
    if (!ratingGames || ratingGames.length === 0) {
      return; // Нет игр в рейтинге, нечего пересчитывать
    }
    
    // Извлекаем ID игр
    const gameIds = ratingGames.map(game => game.gameId);
    
    // Получаем результаты всех игроков во всех играх рейтинга
    const playerResults = await prisma.gamePlayer.findMany({
      where: {
        gameId: { in: gameIds }
      },
      select: {
        playerId: true,
        role: true,
        additionalPoints: true,
        game: {
          select: {
            id: true,
            result: true
          }
        }
      }
    });
    
    // Преобразуем результаты в ожидаемый формат
    const formattedPlayerResults = playerResults.map(pr => ({
      player_id: pr.playerId,
      role: pr.role,
      game_result: pr.game.result,
      additional_points: pr.additionalPoints,
      game_id: pr.game.id
    }));
    
    // Структура для сбора статистики по игрокам
    const playerStats = new Map();
    
    // Обрабатываем результаты каждого игрока
    for (const result of formattedPlayerResults) {
      const playerId = result.player_id;
      
      // Если игрок еще не учтен в статистике, добавляем его
      if (!playerStats.has(playerId)) {
        playerStats.set(playerId, {
          player_id: playerId,
          points: 0,
          games_played: 0,
          wins: 0,
          civilian_wins: 0,
          mafia_wins: 0,
          don_games: 0,
          sheriff_games: 0,
          first_outs: 0
        });
      }
      
      const stats = playerStats.get(playerId);
      stats.games_played += 1;
      
      // Корректно обрабатываем дополнительные очки, преобразуя их в число
      try {
        // Если значение отсутствует, используем 0
        if (result.additional_points === null || result.additional_points === undefined) {
          stats.points += 0;
        } else {
          // Преобразуем в число, предварительно приводя к строке и очищая от недопустимых символов
          const additionalPointsStr = String(result.additional_points);
          
          // Специальная обработка формата "00.500.900.202.00" - берем только первое число до точки
          let pointsValue = 0;
          
          // Паттерн для извлечения первого дробного числа из строки
          const match = additionalPointsStr.match(/(-?\d*[.,]?\d+)/);
          if (match && match[0]) {
            // Нормализуем число, заменяя запятую на точку
            const normalizedNumber = match[0].replace(',', '.');
            pointsValue = Number.parseFloat(normalizedNumber) || 0;
          } else {
            // Если паттерн не сработал, пробуем другую стратегию
            // Удаляем все недопустимые символы и оставляем только первую точку
            const cleanedStr = additionalPointsStr
              .replace(/,/g, '.') // Заменяем запятые на точки
              .replace(/[^0-9\.-]/g, ''); // Удаляем всё кроме цифр, точек и минуса
            
            // Оставляем только первую точку
            let formattedStr = cleanedStr;
            const dotIndex = formattedStr.indexOf('.');
            if (dotIndex !== -1) {
              formattedStr = formattedStr.substring(0, dotIndex + 1) +
                           formattedStr.substring(dotIndex + 1).replace(/\./g, '');
            }
            
            pointsValue = Number.parseFloat(formattedStr) || 0;
          }
          
          console.log("Parsed additional points:", {
            original: result.additional_points,
            parsedValue: pointsValue
          });
          
          stats.points += pointsValue;
        }
      } catch (e) {
        console.error("Error processing additional points:", e);
        // В случае ошибки, используем 0
        stats.points += 0;
      }
      
      // Анализируем роль и результат игры
      const role = result.role;
      const gameResult = result.game_result;
      
      if (role === 'don') {
        stats.don_games += 1;
      } else if (role === 'sheriff') {
        stats.sheriff_games += 1;
      }
      
      // Определяем, выиграл ли игрок
      let isWinner = false;
      if ((role === 'civilian' || role === 'sheriff') && gameResult === 'civilians_win') {
        isWinner = true;
        stats.civilian_wins += 1;
      } else if ((role === 'mafia' || role === 'don') && gameResult === 'mafia_win') {
        isWinner = true;
        stats.mafia_wins += 1;
      }
      
      if (isWinner) {
        stats.wins += 1;
        stats.points += 1; // Бонусный балл за победу
      }
    }
    
    // Сохраняем обновленные результаты в базу данных
    for (const [playerId, stats] of playerStats) {
      await prisma.ratingResult.create({
        data: {
          ratingId: Number(ratingId),
          playerId: playerId,
          points: stats.points,
          gamesPlayed: stats.games_played,
          wins: stats.wins,
          civilianWins: stats.civilian_wins,
          mafiaWins: stats.mafia_wins,
          donGames: stats.don_games,
          sheriffGames: stats.sheriff_games,
          firstOuts: stats.first_outs
        }
      });
    }
    
    console.log("Recalculated rating results for rating ID", ratingId);
  } catch (error) {
    console.error("Error recalculating rating results for rating", ratingId, ":", error);
    throw error;
  }
}
