import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { prisma } from "@/lib/prisma"

/**
 * API-эндпоинт для получения детальной статистики игрока по ролям
 * GET /api/users/players/[id]/stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Асинхронное ожидание params для Next.js App Router
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams.id
  console.log(`Запрос API /api/users/players/${id}/stats начат`)
  
  if (!id) {
    return NextResponse.json(
      { error: "ID пользователя не указан" },
      { status: 400 }
    )
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Общие данные о пользователе
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.surname, 
        u.nickname, 
        u.country,
        u.image,
        c.name as club_name
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
    
    // Получаем общую статистику игр
    const overallStats = await sql`
      SELECT 
        COUNT(DISTINCT g.id) AS total_games,
        COUNT(DISTINCT CASE WHEN 
          (gp.role = 'civilian' AND g.result = 'civilians_win') OR
          (gp.role = 'sheriff' AND g.result = 'civilians_win') OR
          (gp.role = 'mafia' AND g.result = 'mafia_win') OR
          (gp.role = 'don' AND g.result = 'mafia_win')
        THEN g.id END) AS total_wins,
        ROUND(
          COUNT(DISTINCT CASE WHEN 
            (gp.role = 'civilian' AND g.result = 'civilians_win') OR
            (gp.role = 'sheriff' AND g.result = 'civilians_win') OR
            (gp.role = 'mafia' AND g.result = 'mafia_win') OR
            (gp.role = 'don' AND g.result = 'mafia_win')
          THEN g.id END)::numeric / 
          NULLIF(COUNT(DISTINCT g.id), 0)::numeric * 100, 2
        ) AS overall_winrate,
        AVG(gp.additional_points) AS avg_additional_points,
        COALESCE(SUM(gp.fouls), 0) AS total_fouls
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id}
    `

    // Статистика по роли Мирный
    const civilianStats = await sql`
      SELECT 
        COUNT(*) AS games_played,
        SUM(CASE WHEN g.result = 'civilians_win' THEN 1 ELSE 0 END) AS games_won,
        ROUND(
          SUM(CASE WHEN g.result = 'civilians_win' THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100, 2
        ) AS winrate,
        AVG(gp.additional_points) AS avg_additional_points,
        COALESCE(SUM(gp.fouls), 0) AS total_fouls
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id} AND gp.role = 'civilian'
    `

    // Статистика по роли Мафия
    const mafiaStats = await sql`
      SELECT 
        COUNT(*) AS games_played,
        SUM(CASE WHEN g.result = 'mafia_win' THEN 1 ELSE 0 END) AS games_won,
        ROUND(
          SUM(CASE WHEN g.result = 'mafia_win' THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100, 2
        ) AS winrate,
        AVG(gp.additional_points) AS avg_additional_points,
        COALESCE(SUM(gp.fouls), 0) AS total_fouls
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id} AND gp.role = 'mafia'
    `

    // Статистика по роли Шериф
    const sheriffStats = await sql`
      SELECT 
        COUNT(*) AS games_played,
        SUM(CASE WHEN g.result = 'civilians_win' THEN 1 ELSE 0 END) AS games_won,
        ROUND(
          SUM(CASE WHEN g.result = 'civilians_win' THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100, 2
        ) AS winrate,
        AVG(gp.additional_points) AS avg_additional_points,
        COALESCE(SUM(gp.fouls), 0) AS total_fouls
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id} AND gp.role = 'sheriff'
    `

    // Статистика по роли Дон
    const donStats = await sql`
      SELECT 
        COUNT(*) AS games_played,
        SUM(CASE WHEN g.result = 'mafia_win' THEN 1 ELSE 0 END) AS games_won,
        ROUND(
          SUM(CASE WHEN g.result = 'mafia_win' THEN 1 ELSE 0 END)::numeric / 
          NULLIF(COUNT(*), 0)::numeric * 100, 2
        ) AS winrate,
        AVG(gp.additional_points) AS avg_additional_points,
        COALESCE(SUM(gp.fouls), 0) AS total_fouls
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id} AND gp.role = 'don'
    `

    // Получение последних 10 игр
    const recentGames = await sql`
      SELECT 
        g.id,
        g.created_at AS date,
        gp.role,
        g.result,
        gp.slot_number AS slot,
        gp.additional_points AS extra_points,
        gp.fouls,
        g.game_type
      FROM 
        game_players gp
      JOIN 
        games g ON gp.game_id = g.id
      WHERE 
        gp.player_id = ${id}
      ORDER BY 
        g.created_at DESC
      LIMIT 10
    `

    // Формируем и возвращаем полную статистику
    return NextResponse.json({
      user,
      stats: {
        overall: overallStats[0] || {},
        civilian: civilianStats[0] || {},
        mafia: mafiaStats[0] || {},
        sheriff: sheriffStats[0] || {},
        don: donStats[0] || {}
      },
      recentGames
    })
    
  } catch (error) {
    console.error("Ошибка при получении статистики игрока:", error)
    
    return NextResponse.json(
      { 
        error: "Не удалось получить статистику игрока", 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
