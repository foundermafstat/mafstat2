import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { neon } from "@neondatabase/serverless";

/**
 * API эндпоинт для принудительного обновления сессий пользователя
 * POST /api/auth/refresh-sessions
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка прав администратора
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    // Получаем ID пользователя из запроса
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "ID пользователя не указан" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || "");
    
    // Удаляем существующие сессии пользователя из таблицы sessions
    const result = await sql`
      DELETE FROM sessions 
      WHERE session->>'userId' = ${userId.toString()}
    `;

    console.log(`Обновлено сессий: ${result.count}`);

    return NextResponse.json({
      success: true,
      message: "Сессии пользователя обновлены успешно",
      count: result.count
    });
  } catch (error) {
    console.error("Ошибка при обновлении сессий:", error);
    return NextResponse.json(
      { 
        error: "Ошибка при обновлении сессий пользователя",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
