import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET: Получение игр, включенных в рейтинг
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;

    // Получаем игры, включенные в рейтинг
    const games = await query(
      "SELECT g.*, rg.added_at as added_to_rating_at
       FROM games g
       JOIN rating_games rg ON g.id = rg.game_id
       WHERE rg.rating_id = $1
       ORDER BY g.created_at DESC",
      [ratingId]
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
    
    // Проверяем, существуют ли игры
    const gameIds = await Promise.all(gameIdsToAdd.map(async (gameId: number | string) => {
      const gameCheck = await query(
        "SELECT id FROM games WHERE id = $1",
        [gameId]
      );
      
      if (!gameCheck || gameCheck.length === 0) {
        console.warn("Game ID ", gameId, "not found");
        return null;
      }
      
      // Проверяем, не добавлена ли уже эта игра в рейтинг
      const existingCheck = await query(
        "SELECT id FROM rating_games WHERE rating_id = $1 AND game_id = $2",
        [ratingId, gameId]
      );
      
      if (existingCheck && existingCheck.length > 0) {
        console.warn("Game ID ", gameId, "is already in this rating");
        return null;
      }
      
      return gameId;
    }));
    
    // Фильтруем null значения (невалидные или уже существующие игры)
    const validGameIds = gameIds.filter(id => id !== null) as number[];
    
    if (validGameIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid game IDs were provided" },
        { status: 400 }
      );
    }
    
    // Добавляем игры в рейтинг
    for (const gameId of validGameIds) {
      await query(
        `INSERT INTO rating_games (rating_id, game_id)
         VALUES ($1, $2)`,
        [ratingId, gameId]
      );
    }
    
    // Запускаем пересчет рейтинговых результатов
    await recalculateRatingResults(ratingId);
    
    return NextResponse.json(
      { success: true, message: "Game added to rating successfully" },
      { status: 201 }
    );
  } catch (error) {
    // Используем сохраненный ID вместо params.id
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
    await query(
      `DELETE FROM rating_games 
       WHERE rating_id = $1 AND game_id = $2`,
      [ratingId, gameId]
    );
    
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
    await query(
      "DELETE FROM rating_results WHERE rating_id = $1",
      [ratingId]
    );
    
    // Получаем все игры в рейтинге
    const ratingGames = await query(
      "SELECT game_id FROM rating_games WHERE rating_id = $1",
      [ratingId]
    );
    
    if (!ratingGames || ratingGames.length === 0) {
      return; // Нет игр в рейтинге, нечего пересчитывать
    }
    
    // Извлекаем ID игр
    const gameIds = ratingGames.map((game: { game_id: number }) => game.game_id);
    
    // Получаем результаты всех игроков во всех играх рейтинга
    const playerResults = await query(
      "SELECT 
        gp.player_id,
        gp.role,
        g.result as game_result,
        gp.additional_points,
        g.id as game_id
      FROM game_players gp
      JOIN games g ON gp.game_id = g.id
      WHERE g.id = ANY($1::int[])", 
      [gameIds]
    );
    
    // Структура для сбора статистики по игрокам
    const playerStats = new Map();
    
    // Обрабатываем результаты каждого игрока
    for (const result of playerResults) {
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
      await query(`
        INSERT INTO rating_results (
          rating_id, 
          player_id, 
          points, 
          games_played, 
          wins, 
          civilian_wins, 
          mafia_wins, 
          don_games, 
          sheriff_games, 
          first_outs
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        ratingId,
        playerId,
        stats.points,
        stats.games_played,
        stats.wins,
        stats.civilian_wins,
        stats.mafia_wins,
        stats.don_games,
        stats.sheriff_games,
        stats.first_outs
      ]);
    }
    
    console.log("Recalculated rating results for rating ID", ratingId);
  } catch (error) {
    console.error("Error recalculating rating results for rating", ratingId, ":", error);
    throw error;
  }
}
