import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // В Next.js 15 все параметры из params должны быть await
    const paramsResolved = await params
    
    if (!paramsResolved.id) {
      return NextResponse.json({ 
        success: false,
        error: "Требуется ID игры", 
        message: "Не указан ID игры в запросе" 
      }, { status: 400 })
    }

    const gameId = paramsResolved.id
    console.log("Fetching game with ID:", gameId)

    // Используем параметризованный запрос с $1 вместо прямой интерполяции
    const gameResult = await query(`
      SELECT g.*, 
             CASE WHEN p.name IS NOT NULL AND p.surname IS NOT NULL 
                  THEN p.name || ' ' || p.surname 
                  ELSE 'Unknown' 
             END as referee_name
      FROM games g
      LEFT JOIN players p ON g.referee_id = p.id
      WHERE g.id = $1
    `, [gameId])
    
    // Подробный лог для отладки
    console.log("Game result type:", typeof gameResult)
    console.log("Game result is array:", Array.isArray(gameResult))
    console.log("Game result length:", gameResult?.length || 0)
    console.log("Game has rows property:", Boolean(gameResult?.rows))
    
    // Проверяем различные форматы данных
    let game = null
    
    // Вариант 1: Результат напрямую является массивом записей
    if (Array.isArray(gameResult) && gameResult.length > 0) {
      game = gameResult[0]
      console.log("Получены данные игры из массива");
    } 
    // Вариант 2: Стандартный формат с rows
    else if (gameResult?.rows && gameResult.rows.length > 0) {
      game = gameResult.rows[0]
      console.log("Получены данные игры из rows");
    }
    
    console.log("Найдена игра:", game ? "Да" : "Нет")
    
    if (!game) {
      // Возвращаем информацию об ошибке
      return NextResponse.json({ 
        success: false,
        error: "Игра не найдена", 
        message: `Игра с ID ${gameId} не найдена в базе данных или возникла проблема с доступом к данным`,
        debug: {
          resultType: typeof gameResult,
          isArray: Array.isArray(gameResult),
          resultLength: Array.isArray(gameResult) ? gameResult.length : 0,
          hasRowsProperty: Boolean(gameResult?.rows)
        }
      }, { status: 404 })
    }
    
    // Получаем игроков игры - используем Prisma
    console.log("Fetching players for game ID:", gameId);
    
    let players = [];
    
    try {
      const prismaGamePlayers = await prisma.gamePlayer.findMany({
        where: {
          gameId: Number(gameId)
        },
        include: {
          player: {
            include: {
              club: true
            }
          }
        },
        orderBy: {
          slotNumber: 'asc'
        }
      });
      
      console.log(`Found ${prismaGamePlayers.length} players using Prisma`);
      
      // Преобразуем данные в необходимый формат
      players = prismaGamePlayers.map(gp => ({
        id: gp.id,
        game_id: gp.gameId,
        player_id: gp.playerId,
        role: gp.role,
        slot_number: gp.slotNumber,
        fouls: gp.fouls,
        additional_points: gp.additionalPoints,
        name: gp.player.name,
        surname: gp.player.surname,
        nickname: gp.player.nickname,
        photo_url: gp.player.image,
        club_name: gp.player.club?.name || null
      }));
      
      console.log("Processed players data:", 
        players.length > 0 ? 
        `Found ${players.length} players, first player: ${players[0].name} ${players[0].surname}` : 
        "No players found");
    } catch (error) {
      console.error("Error fetching players with Prisma:", error);
      
      // Запасной вариант - используем SQL запрос
      console.log("Trying to fetch players with SQL query");
      try {
        const playersResult = await query(`
          SELECT gp.*, 
                 p.name, p.surname, p.nickname, p.photo_url,
                 c.name as club_name
          FROM game_players gp
          JOIN players p ON gp.player_id = p.id
          LEFT JOIN clubs c ON p.club_id = c.id
          WHERE gp.game_id = $1
          ORDER BY gp.slot_number ASC
        `, [gameId]);
        
        players = Array.isArray(playersResult) 
                       ? playersResult 
                       : (playersResult?.rows || []);
        
        console.log(`Found ${players.length} players using SQL query`);
      } catch (sqlError) {
        console.error("Error fetching players with SQL:", sqlError);
      }
    }
    
    // Получаем этапы игры - используем параметризованный запрос
    const stagesResult = await query(`
      SELECT *
      FROM game_stages
      WHERE game_id = $1
      ORDER BY order_number ASC
    `, [gameId])
    
    const stages = Array.isArray(stagesResult) 
                   ? stagesResult 
                   : (stagesResult?.rows || [])

    // Если игра найдена, возвращаем ее данные и связанные данные
    return NextResponse.json({
      ...game,
      players: players,
      stages: stages
    })
  } catch (error) {
    console.error("Error fetching game data:", error)
    return NextResponse.json({ error: "Failed to fetch game data" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const gameId = params.id

    // Delete game players
    await query("DELETE FROM game_players WHERE game_id = $1", [gameId])

    // Delete game side referees
    await query("DELETE FROM game_side_referees WHERE game_id = $1", [gameId])

    // Delete game stages
    await query("DELETE FROM game_stages WHERE game_id = $1", [gameId])

    // Delete the game
    await query("DELETE FROM games WHERE id = $1", [gameId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting game:", error)
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 })
  }
}

/**
 * Обновление существующей игры по ID
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем, что ID указан в запросе
    if (!params?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Требуется ID игры"
      }, { status: 400 });
    }

    const gameId = Number.parseInt(params.id, 10);
    const gameData = await request.json();
    
    console.log('Updating game with ID:', gameId, 'New data:', gameData);

    // Проверяем существование игры перед обновлением
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!existingGame) {
      return NextResponse.json({ 
        success: false,
        error: "Игра не найдена"
      }, { status: 404 });
    }

    // Подготавливаем данные для обновления
    const gameUpdateData = {
      name: gameData.name ?? existingGame.name,
      description: gameData.description ?? existingGame.description,
      gameType: gameData.gameType ?? existingGame.gameType,
      refereeId: gameData.judge ? Number.parseInt(String(gameData.judge), 10) : existingGame.refereeId,
      refereeComments: gameData.refereeComments ?? existingGame.refereeComments,
      tableNumber: gameData.table ?? existingGame.tableNumber,
      result: gameData.result ?? existingGame.result,
      updatedAt: new Date()
    };

    // Обновляем данные игры
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: gameUpdateData
    });

    // Если есть данные игроков - обновляем их через транзакцию
    if (gameData.players && Array.isArray(gameData.players) && gameData.players.length > 0) {
      // Сначала удаляем всех существующих игроков этой игры
      await prisma.gamePlayer.deleteMany({
        where: { gameId: gameId }
      });

      // Затем добавляем новых игроков
      const playersToCreate = gameData.players
        .filter((player: { player_id: number | string }) => player.player_id) 
        .map((player: { 
          player_id: number | string; 
          role: string; 
          fouls: number;
          additional_points: number | string;
          slot_number: number; 
        }) => ({
          gameId: gameId,
          playerId: Number.parseInt(String(player.player_id), 10),
          role: player.role,
          fouls: player.fouls || 0,
          additionalPoints: Number.parseFloat(String(player.additional_points || 0)),
          slotNumber: player.slot_number
        }));

      if (playersToCreate.length > 0) {
        await prisma.gamePlayer.createMany({
          data: playersToCreate
        });
      }
    }

    return NextResponse.json({
      success: true,
      id: updatedGame.id,
      message: "Игра успешно обновлена"
    });

  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json({ 
      success: false,
      error: "Ошибка при обновлении игры",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
