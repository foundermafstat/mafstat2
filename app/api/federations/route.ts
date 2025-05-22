import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  console.log("Запрос API /api/federations начат")
  
  try {
    // Проверяем существование таблицы перед выполнением запроса
    const sql = neon(process.env.DATABASE_URL || "")
    
    // Выполняем прямой запрос к базе данных, минуя слой абстракции
    const directResult = await sql`
      SELECT f.*, 
             (SELECT COUNT(*) FROM clubs c WHERE c.federation_id = f.id) as club_count,
             (SELECT COUNT(*) FROM players p JOIN clubs c ON p.club_id = c.id WHERE c.federation_id = f.id) as player_count
      FROM federations f
      ORDER BY f.name ASC
    `
    
    console.log("Прямой запрос к базе данных вернул", directResult.length, "федераций")
    
    // Возвращаем результаты напрямую
    return NextResponse.json({ federations: directResult })
  } catch (error) {
    console.error("Ошибка при получении федераций:", error)
    
    // Возвращаем пустой массив федераций вместе с ошибкой
    return NextResponse.json(
      { 
        error: "Не удалось получить данные федераций", 
        message: error instanceof Error ? error.message : String(error),
        federations: []
      }, 
      { status: 500 }
    )
  }
}
