import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

// GET - Получение данных из таблицы
export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // В Next.js 15 все параметры из params должны быть await
    const paramsResolved = await params
    const tableName = paramsResolved.table

    if (!tableName) {
      return NextResponse.json(
        { error: "Не указано имя таблицы" },
        { status: 400 }
      )
    }

    // Получаем параметры запроса
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    
    // Ограничиваем максимальное количество строк для предотвращения перегрузки
    const safeLimit = Math.min(limit, 1000)

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")

    // Получаем данные таблицы с пагинацией
    // Используем безопасный вариант с параметризованным SQL
    const query = `
      SELECT *
      FROM "${tableName}"
      ORDER BY 1
      LIMIT $1
      OFFSET $2
    `
    
    try {
      const rows = await sql.query(query, [safeLimit, offset])
      return NextResponse.json({ rows })
    } catch (dbError) {
      console.error("Ошибка при выполнении запроса к таблице:", dbError)
      return NextResponse.json(
        { error: "Ошибка при доступе к данным таблицы" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Ошибка при получении данных таблицы:", error)
    return NextResponse.json(
      { error: "Ошибка при получении данных таблицы" },
      { status: 500 }
    )
  }
}
