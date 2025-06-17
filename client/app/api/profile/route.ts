import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"

import { authOptions } from "@/auth"
import { query } from "@/lib/db"

// Схема валидации для запроса обновления профиля
const updateProfileSchema = z.object({
  // Базовые поля пользователя
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  
  // Дополнительные поля игрока
  surname: z.string().min(2).optional(),
  nickname: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  clubId: z.number().optional().nullable(),
  birthday: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  gender: z.enum(["male", "female", "other"]).optional(),
  isTournamentJudge: z.boolean().optional(),
  isSideJudge: z.boolean().optional()
})

export async function PUT(request: Request) {
  try {
    // Проверяем аутентификацию пользователя
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
    }

    // Получаем данные из запроса
    const body = await request.json()
    
    // Валидируем данные
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Ошибка валидации данных", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }
    
    const data = validationResult.data
    
    // Формируем только те поля, которые были предоставлены для обновления
    const updates: Record<string, string | number | boolean | Date | null> = {}
    
    // Базовые поля пользователя
    if (data.name !== undefined) updates.name = data.name
    if (data.email !== undefined) updates.email = data.email
    if (data.bio !== undefined) updates.bio = data.bio
    if (data.avatarUrl !== undefined) updates.image = data.avatarUrl
    
    // Дополнительные поля игрока
    if (data.surname !== undefined) updates.surname = data.surname
    if (data.nickname !== undefined) updates.nickname = data.nickname
    if (data.country !== undefined) updates.country = data.country
    if (data.clubId !== undefined) updates.club_id = data.clubId
    if (data.birthday !== undefined) updates.birthday = data.birthday
    if (data.gender !== undefined) updates.gender = data.gender
    if (data.isTournamentJudge !== undefined) updates.is_tournament_judge = data.isTournamentJudge
    if (data.isSideJudge !== undefined) updates.is_side_judge = data.isSideJudge
    
    // Получаем ID пользователя из сессии
    const userId = session.user.id
    
    // Проверяем, какие поля существуют в таблице users
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `
    console.log("Запрос для получения колонок:", columnsQuery)
    const columnsResult = await query(columnsQuery)
    console.log("Доступные колонки в таблице users:", columnsResult)
    
    const existingColumns = columnsResult.map((col: { column_name: string }) => col.column_name)
    console.log("Список существующих колонок:", existingColumns)
    
    // Оставляем только те поля, которые есть в таблице
    const filteredUpdates: Record<string, string | number | boolean | Date | null> = {}
    console.log("Исходные данные обновления:", updates)
    
    for (const [key, value] of Object.entries(updates)) {
      if (existingColumns.includes(key)) {
        filteredUpdates[key] = value
      } else {
        console.warn(`Поле ${key} отсутствует в таблице users и будет проигнорировано`)
      }
    }
    
    console.log("Отфильтрованные данные обновления:", filteredUpdates)
    
    // Если нет полей для обновления, возвращаем успех без изменений
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ message: "Нет данных для обновления" })
    }
    
    // Создаем SQL-запрос для обновления только предоставленных полей
    const setClause = Object.entries(filteredUpdates)
      .map(([key, _], index) => `${key} = $${index + 2}`)
      .join(", ")
    
    const values = [userId, ...Object.values(filteredUpdates)]
    
    const updateQuery = `
      UPDATE users 
      SET ${setClause}
      WHERE id = $1
      RETURNING id, name, email, image, bio, surname, nickname, 
                country, club_id AS "clubId", birthday, gender, 
                is_tournament_judge AS "isTournamentJudge", 
                is_side_judge AS "isSideJudge"
    `
    
    console.log("SQL-запрос для обновления:", updateQuery)
    console.log("Параметры запроса:", values)
    
    // Выполняем запрос к базе данных
    try {
      const result = await query(updateQuery, values)
      console.log("Результат запроса:", result)
      
      // Проверяем результат
      if (!result || !Array.isArray(result) || result.length === 0) {
        console.error("Ошибка: результат запроса пустой или не является массивом")
        return NextResponse.json({ error: "Не удалось обновить профиль" }, { status: 500 })
      }
      
      // Возвращаем обновленные данные пользователя
      return NextResponse.json({
        success: true,
        message: "Профиль успешно обновлен",
        user: result[0]
      })
    } catch (error) {
      console.error("Ошибка при выполнении SQL-запроса:", error)
      return NextResponse.json({ 
        error: "Ошибка сервера при обновлении профиля",
        message: error instanceof Error ? error.message : String(error),
        details: error
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error)
    return NextResponse.json({ 
      error: "Ошибка сервера при обновлении профиля",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET запрос для получения данных текущего пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
    }
    
    const userId = session.user.id
    
    // Получаем расширенные данные пользователя из базы данных, включая поля игрока
    const userResult = await query(`
      SELECT id, name, email, image, bio,
             surname, nickname, country, 
             club_id AS "clubId", birthday, gender,
             is_tournament_judge AS "isTournamentJudge", 
             is_side_judge AS "isSideJudge"
      FROM users 
      WHERE id = $1
    `, [userId])
    
    if (!userResult || !Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      user: userResult[0]
    })
  } catch (error) {
    console.error("Ошибка при получении данных профиля:", error)
    return NextResponse.json({ 
      error: "Ошибка сервера при получении данных профиля",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
