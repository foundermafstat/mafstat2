import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

/**
 * API-эндпоинт для получения информации о конкретном пользователе (игроке)
 * GET /api/users/players/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Асинхронное ожидание params для Next.js App Router
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams.id
  console.log(`Запрос API /api/users/players/${id} начат`)
  
  if (!id) {
    return NextResponse.json(
      { error: "ID пользователя не указан" },
      { status: 400 }
    )
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Выполняем запрос к базе данных для получения данных пользователя
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.image,
        u.surname, 
        u.nickname, 
        u.country, 
        u.bio,
        u.gender,
        u.birthday,
        u.is_tournament_judge as "isTournamentJudge",
        u.is_side_judge as "isSideJudge",
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.role,
        c.id as "clubId",
        c.name as "clubName"
      FROM 
        users u
      LEFT JOIN 
        clubs c ON u.club_id = c.id
      WHERE 
        u.id = ${id}
    `
    
    if (!users.length) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }
    
    const user = users[0]
    console.log(`Данные пользователя получены: ${user.name} ${user.surname}`)
    
    // Получаем статистику по играм пользователя, если есть связанная таблица
    let gamesStats = null
    try {
      const gamesStatsQuery = await sql`
        SELECT 
          COUNT(*) as "totalGames",
          SUM(CASE WHEN 
            (gp.role = 'civilian' AND g.result = 'civilians_win') OR
            (gp.role = 'sheriff' AND g.result = 'civilians_win') OR
            (gp.role = 'mafia' AND g.result = 'mafia_win') OR
            (gp.role = 'don' AND g.result = 'mafia_win')
          THEN 1 ELSE 0 END) as "wins",
          SUM(CASE WHEN g.result = 'draw' THEN 1 ELSE 0 END) as "draws",
          SUM(CASE WHEN 
            (gp.role = 'civilian' AND g.result = 'mafia_win') OR
            (gp.role = 'sheriff' AND g.result = 'mafia_win') OR
            (gp.role = 'mafia' AND g.result = 'civilians_win') OR
            (gp.role = 'don' AND g.result = 'civilians_win')
          THEN 1 ELSE 0 END) as "losses"
        FROM 
          game_players gp
        JOIN 
          games g ON gp.game_id = g.id
        WHERE 
          gp.player_id = ${id}
      `
      
      if (gamesStatsQuery.length > 0) {
        gamesStats = gamesStatsQuery[0]
      }
    } catch (error) {
      console.log("Ошибка при получении статистики игр:", error)
      // Продолжаем работу без статистики игр
    }
    
    // Возвращаем данные пользователя и статистику игр
    return NextResponse.json({ 
      user,
      gamesStats
    })
    
  } catch (error) {
    console.error("Ошибка при получении данных пользователя:", error)
    
    return NextResponse.json(
      { 
        error: "Не удалось получить данные пользователя", 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
