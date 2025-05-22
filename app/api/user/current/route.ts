import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { neon } from "@neondatabase/serverless"

import { authOptions } from "@/auth"

/**
 * API-эндпоинт для получения актуальных данных текущего пользователя
 * GET /api/user/current
 */
export async function GET() {
  try {
    // Проверяем авторизацию
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Требуется авторизация" }, 
        { status: 401 }
      )
    }
    
    // Получаем ID пользователя из сессии
    const userId = session.user.id
    
    // Подключаемся к базе данных
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Получаем свежие данные о пользователе напрямую из базы данных
    const userData = await sql`
      SELECT 
        id, name, email, image, role,
        bio, surname, nickname, country, 
        club_id as "clubId", birthday, gender,
        is_tournament_judge as "isTournamentJudge", 
        is_side_judge as "isSideJudge"
      FROM users 
      WHERE id = ${userId}
    `
    
    if (userData.length === 0) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }
    
    // Возвращаем данные пользователя
    return NextResponse.json({ user: userData[0] })
  } catch (error) {
    console.error("Ошибка при получении данных пользователя:", error)
    return NextResponse.json(
      { 
        error: "Ошибка сервера", 
        message: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}
