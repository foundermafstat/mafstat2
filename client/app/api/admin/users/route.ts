import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth" 

// GET - Получение списка всех пользователей
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Запрос списка пользователей
    const users = await sql`
      SELECT 
        users.id, users.name, users.email, users.role, users."emailVerified", users.created_at, users.updated_at,
        users.bio, users.surname, users.nickname, users.country, users.club_id as "clubId", users.birthday, 
        users.gender, users.is_tournament_judge as "isTournamentJudge", users.is_side_judge as "isSideJudge",
        users.premium_nights as "premiumNights"
      FROM users
      ORDER BY users.id
    `
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error)
    return NextResponse.json(
      { error: "Ошибка при получении пользователей" },
      { status: 500 }
    )
  }
}

// POST - Создание нового пользователя
export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    
    // Получение данных запроса
    const { name, email, password, role } = await request.json()
    
    // Проверка обязательных полей
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 }
      )
    }
    
    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Проверка существования пользователя
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      )
    }
    
    // Хеширование пароля
    const hashedPassword = await hash(password, 10)
    
    // Создание пользователя
    const result = await sql`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (${name}, ${email.toLowerCase()}, ${hashedPassword}, ${role || 'user'}, NOW(), NOW())
      RETURNING id, name, email, role
    `
    
    return NextResponse.json({ user: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error)
    return NextResponse.json(
      { error: "Ошибка при создании пользователя" },
      { status: 500 }
    )
  }
}
