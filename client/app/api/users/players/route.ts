import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

/**
 * API-эндпоинт для получения списка пользователей (игроков)
 * GET /api/users/players
 */
export async function GET() {
  console.log("Запрос API /api/users/players начат")
  
  try {
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Выполняем запрос к базе данных для получения игроков из таблицы users
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
        c.name as "clubName"
      FROM 
        users u
      LEFT JOIN 
        clubs c ON u.club_id = c.id
      ORDER BY 
        u.name ASC
    `
    
    console.log(`Получено ${users.length} пользователей из базы данных`)
    
    return NextResponse.json({ players: users })
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error)
    
    return NextResponse.json(
      { 
        error: "Не удалось получить данные пользователей", 
        message: error instanceof Error ? error.message : String(error),
        players: []
      }, 
      { status: 500 }
    )
  }
}
