import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

// GET - Получение структуры таблицы
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

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "")

    // Получаем список колонок с их типами данных, ограничениями и т.д.
    const query = `
      SELECT 
        a.attname AS column_name,
        format_type(a.atttypid, a.atttypmod) AS data_type,
        CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
        pg_get_expr(d.adbin, d.adrelid) AS column_default,
        con.contype AS constraint_type
      FROM 
        pg_attribute a
      LEFT JOIN 
        pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
      LEFT JOIN (
        SELECT
          conrelid,
          conkey[1] AS conkey_single,
          contype
        FROM
          pg_constraint
        WHERE
          contype IN ('p', 'u', 'f')
      ) con ON (a.attrelid = con.conrelid AND a.attnum = con.conkey_single)
      WHERE 
        a.attrelid = $1::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY 
        a.attnum
    `
    
    const columns = await sql.query(query, [tableName])

    // Преобразуем типы ограничений в более понятные
    const processedColumns = columns.map(column => {
      if (column.constraint_type) {
        switch (column.constraint_type) {
          case 'p': column.constraint_type = 'PRIMARY KEY'; break;
          case 'u': column.constraint_type = 'UNIQUE'; break;
          case 'f': column.constraint_type = 'FOREIGN KEY'; break;
          default: break;
        }
      }
      return column;
    });

    return NextResponse.json({ columns: processedColumns })
  } catch (error) {
    console.error("Ошибка при получении структуры таблицы:", error)
    return NextResponse.json(
      { error: "Ошибка при получении структуры таблицы" },
      { status: 500 }
    )
  }
}
