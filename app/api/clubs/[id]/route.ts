import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // В Next.js 15 все параметры из params должны быть await
    const paramsResolved = await params
    
    if (!paramsResolved.id) {
      return NextResponse.json({ 
        error: "Требуется ID клуба", 
        message: "Не указан ID клуба в запросе" 
      }, { status: 400 })
    }

    const clubId = paramsResolved.id
    console.log("Fetching club with ID:", clubId)

    // Получаем базовые данные клуба напрямую без параметров, так как есть проблемы с параметризацией
    const clubResult = await query(`SELECT c.*, f.name as federation_name 
                                    FROM clubs c
                                    LEFT JOIN federations f ON c.federation_id = f.id
                                    WHERE c.id = ${clubId}`)
    
    // Подробный лог для отладки
    console.log("Club result type:", typeof clubResult)
    console.log("Club result is array:", Array.isArray(clubResult))
    console.log("Club result length:", clubResult?.length || 0)
    
    // Проверяем различные форматы данных
    let club = null
    
    // Вариант 1: Результат напрямую является массивом записей
    if (Array.isArray(clubResult) && clubResult.length > 0) {
      club = clubResult[0]
      console.log("Получены данные клуба из массива");
    } 
    // Вариант 2: Стандартный формат с rows
    else if (clubResult?.rows && clubResult.rows.length > 0) {
      club = clubResult.rows[0]
      console.log("Получены данные клуба из rows");
    }
    
    console.log("Найден клуб:", club ? "Да" : "Нет")
    
    if (!club) {
      // Возвращаем информацию об ошибке
      return NextResponse.json({ 
        success: false,
        error: "Клуб не найден", 
        message: `Клуб с ID ${clubId} не найден в базе данных или возникла проблема с доступом к данным`,
        debug: {
          resultType: typeof clubResult,
          isArray: Array.isArray(clubResult),
          resultLength: Array.isArray(clubResult) ? clubResult.length : 0,
          hasRowsProperty: Boolean(clubResult?.rows)
        }
      }, { status: 404 })
    }
    
    // Получаем игроков клуба (используем таблицу users вместо players, так как у нас система основана на пользователях)
    const playersResult = await query(`SELECT u.id, u.name, u.surname, u.nickname, u.image, u.country, u.gender 
                                      FROM users u
                                      WHERE u.club_id = ${clubId}
                                      ORDER BY u.name, u.surname`)
                                      
    const players = Array.isArray(playersResult) 
                    ? playersResult 
                    : (playersResult?.rows || [])
    
    // Получаем игры клуба напрямую через связь club_id в таблице games
    const gamesResult = await query(`SELECT g.*
                                    FROM games g
                                    WHERE g.club_id = ${clubId}
                                    ORDER BY g.created_at DESC`)
                                    
    const games = Array.isArray(gamesResult) 
                  ? gamesResult 
                  : (gamesResult?.rows || [])

    // Если клуб найден, возвращаем его данные и связанные данные
    return NextResponse.json({
      ...club,
      players: players,
      games: games
    })
  } catch (error) {
    console.error("Error fetching club details:", error)
    return NextResponse.json({ 
      success: false,
      error: "Ошибка при получении данных клуба",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 })
    }

    const clubId = params.id
    const body = await request.json()
    const { name, description, url, country, city, federation_id } = body

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    // Using direct string interpolation to avoid parameter binding issues
    await query(`
      UPDATE clubs
      SET name = '${name.replace(/'/g, "''")}', 
          description = ${description ? `'${description.replace(/'/g, "''")}'` : "NULL"}, 
          url = ${url ? `'${url.replace(/'/g, "''")}'` : "NULL"}, 
          country = ${country ? `'${country.replace(/'/g, "''")}'` : "NULL"}, 
          city = ${city ? `'${city.replace(/'/g, "''")}'` : "NULL"}, 
          federation_id = ${federation_id || "NULL"},
          updated_at = NOW()
      WHERE id = ${clubId}
    `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating club:", error)
    return NextResponse.json({ error: "Failed to update club" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "Club ID is required" }, { status: 400 })
    }

    const clubId = Number.parseInt(params.id, 10)

    // Using direct string interpolation to avoid parameter binding issues
    // Update players to remove club association
    await query(`
      UPDATE players
      SET club_id = NULL, updated_at = NOW()
      WHERE club_id = ${clubId}
    `)

    // Delete the club
    await query(`
      DELETE FROM clubs
      WHERE id = ${clubId}
    `)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting club:", error)
    return NextResponse.json({ error: "Failed to delete club" }, { status: 500 })
  }
}
