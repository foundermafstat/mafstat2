import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

// GET - Получение пользователя по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json(
        { error: "Не указан ID пользователя" },
        { status: 400 }
      )
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")

    // Запрос данных пользователя
    const users = await sql`
      SELECT id, name, email, role, "emailVerified", created_at, updated_at
      FROM users
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error)
    return NextResponse.json(
      { error: "Ошибка при получении пользователя" },
      { status: 500 }
    )
  }
}

// PUT - Обновление пользователя
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json(
        { error: "Не указан ID пользователя" },
        { status: 400 }
      )
    }

    // Получение данных запроса
    const { name, email, password, role } = await request.json()

    // Проверка обязательных полей
    if (!name || !email) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 }
      )
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")

    // Проверка наличия пользователя
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    // Проверка, не занят ли email другим пользователем
    if (email) {
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email.toLowerCase()} AND id != ${userId}
      `
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: "Email уже используется другим пользователем" },
          { status: 409 }
        )
      }
    }

    // Выполняем обновление с учетом наличия или отсутствия пароля
    let result
    if (password) {
      // С обновлением пароля
      const hashedPassword = await hash(password, 10)
      result = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email.toLowerCase()},
          password = ${hashedPassword},
          role = ${role || 'user'},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role
      `
    } else {
      // Без обновления пароля
      result = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email.toLowerCase()},
          role = ${role || 'user'},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role
      `
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении пользователя" },
      { status: 500 }
    )
  }
}

// DELETE - Удаление пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    const userId = params.id
    if (!userId) {
      return NextResponse.json(
        { error: "Не указан ID пользователя" },
        { status: 400 }
      )
    }

    // Не позволяем удалить текущего пользователя
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Невозможно удалить текущего пользователя" },
        { status: 400 }
      )
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")

    // Проверка наличия пользователя
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      )
    }

    // Удаление пользователя
    await sql`
      DELETE FROM users
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении пользователя" },
      { status: 500 }
    )
  }
}
