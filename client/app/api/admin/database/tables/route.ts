import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

// GET - Получение списка всех таблиц в базе данных
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Получаем список таблиц
    const tablesList = await sql.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    // Для каждой таблицы получаем количество записей
    const tables = await Promise.all(
      tablesList.map(async (table) => {
        // Убедимся, что tablename существует в table
        if (!table || typeof table.tablename !== 'string') {
          return { name: 'unknown', rowCount: 0 };
        }
        
        const countQuery = `SELECT COUNT(*) as count FROM "${table.tablename}"`
        const countResult = await sql.query(countQuery)
        
        return {
          name: table.tablename,
          rowCount: Number.parseInt(countResult[0]?.count || '0')
        }
      })
    )
    
    // Получение информации о базе данных
    const dbInfo = await sql.query(`
      SELECT 
        current_database() AS name,
        pg_size_pretty(pg_database_size(current_database())) AS size
    `)
    
    return NextResponse.json({
      tables,
      database: dbInfo.length > 0 ? dbInfo[0] : null
    })
  } catch (error) {
    console.error("Ошибка при получении списка таблиц:", error)
    return NextResponse.json(
      { error: "Ошибка при получении списка таблиц" },
      { status: 500 }
    )
  }
}
