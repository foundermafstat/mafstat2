import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // В Next.js 15 все параметры из params должны быть await
    const paramsResolved = await params
    
    if (!paramsResolved.id) {
      return NextResponse.json({ 
        error: "Требуется ID игрока", 
        message: "Не указан ID игрока в запросе" 
      }, { status: 400 })
    }

    const playerId = paramsResolved.id
    console.log("Fetching player with ID:", playerId)
    
    // Получаем базовые данные игрока напрямую без параметров, так как есть проблемы с параметризацией
    const playerResult = await query(`SELECT * FROM players WHERE id = ${playerId}`)
    
    // Подробный лог для отладки
    console.log("Player result type:", typeof playerResult)
    console.log("Player result is array:", Array.isArray(playerResult))
    console.log("Player result length:", playerResult?.length || 0)
    
    // Проверяем различные форматы данных
    let player = null
    
    // Вариант 1: Результат напрямую является массивом записей
    if (Array.isArray(playerResult) && playerResult.length > 0) {
      player = playerResult[0]
      console.log("Получены данные игрока из массива");
    } 
    // Вариант 2: Стандартный формат с rows
    else if (playerResult?.rows && playerResult.rows.length > 0) {
      player = playerResult.rows[0]
      console.log("Получены данные игрока из rows");
    }
    
    console.log("Найден игрок:", player ? "Да" : "Нет")
    
    if (!player) {
      // Возвращаем информацию об ошибке
      return NextResponse.json({ 
        success: false,
        error: "Игрок не найден", 
        message: `Игрок с ID ${playerId} не найден в базе данных или возникла проблема с доступом к данным`,
        debug: {
          resultType: typeof playerResult,
          isArray: Array.isArray(playerResult),
          resultLength: Array.isArray(playerResult) ? playerResult.length : 0,
          hasRowsProperty: Boolean(playerResult?.rows)
        }
      }, { status: 404 })
    }
    
    // Дополнительно загружаем данные о клубе, если у игрока есть club_id
    let club = null
    if (player.club_id) {
      const clubResult = await query(`SELECT * FROM clubs WHERE id = ${player.club_id}`)
      
      // Обрабатываем результат с учетом разных форматов
      if (Array.isArray(clubResult) && clubResult.length > 0) {
        club = clubResult[0]
      } else if (clubResult?.rows && clubResult.rows.length > 0) {
        club = clubResult.rows[0]
      }
    }
    
    // Если игрок найден, возвращаем его данные
    return NextResponse.json({
      success: true,
      data: {
        ...player,
        club
      }
    })
  } catch (error) {
    console.error("Error fetching player details:", error)
    return NextResponse.json({ 
      success: false,
      error: "Ошибка при получении данных игрока",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
