import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { query } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Fetching all games")
    
    const result = await query(`
      SELECT g.*, 
             p.name || ' ' || p.surname as referee_name
      FROM games g
      LEFT JOIN players p ON g.referee_id = p.id
      ORDER BY g.created_at DESC
    `)

    // Подробный лог для отладки
    console.log("Games result type:", typeof result)
    console.log("Games result is array:", Array.isArray(result))
    console.log("Games result length:", result?.length || 0)
    console.log("Games has rows property:", Boolean(result?.rows))
    
    // Универсальная обработка результатов запроса
    const games = Array.isArray(result) ? result : result.rows || []
    console.log("API response games count:", games.length)

    // Расширяем ответ дополнительной информацией
    return NextResponse.json({
      success: true,
      count: games.length,
      data: games
    })
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ 
      success: false,
      error: "Ошибка при получении списка игр",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * Создание новой игры
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const gameData = await request.json();
    console.log('Creating new game with data:', gameData);

    // Проверяем основные обязательные поля
    if (!gameData.gameType) {
      return NextResponse.json({ 
        success: false,
        error: "Тип игры обязателен"
      }, { status: 400 });
    }

    // Преобразуем данные из формы в формат для базы данных
    const gameInsertData = {
      name: gameData.name || null,
      description: gameData.description || null,
      gameType: gameData.gameType,
      refereeId: gameData.judge ? Number.parseInt(String(gameData.judge), 10) : null,
      refereeComments: gameData.refereeComments || null,
      tableNumber: gameData.table || null,
      result: gameData.result || null,
      createdAt: gameData.dateTime ? new Date(gameData.dateTime) : new Date(),
      updatedAt: new Date()
    };

    // Создаем игру
    const createdGame = await prisma.game.create({
      data: gameInsertData
    });

    if (!createdGame) {
      throw new Error("Не удалось создать игру");
    }

    // Если есть игроки, добавляем их
    if (gameData.players && Array.isArray(gameData.players) && gameData.players.length > 0) {
      const playersToCreate = gameData.players
        .filter((player: { player_id: number | string }) => player.player_id) // Оставляем только игроков с указанными ID
        .map((player: { 
          player_id: number | string; 
          role: string; 
          fouls: number;
          additional_points: number | string;
          slot_number: number; 
        }) => ({
          gameId: createdGame.id,
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
      id: createdGame.id,
      message: "Игра успешно создана"
    });

  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ 
      success: false,
      error: "Ошибка при создании игры",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
