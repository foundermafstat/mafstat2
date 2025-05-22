import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  // Получение сессии через getServerSession
  const session = await getServerSession(authOptions);

  // Проверка аутентификации
  if (!session?.user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 }
    );
  }

  try {
    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "");

    // Получение информации о премиум-статусе пользователя
    const users = await sql`
      SELECT 
        id, 
        role, 
        premium_nights
      FROM users
      WHERE id = ${session.user.id}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const user = users[0];
    const isPremium = user.role === 'premium';
    const nightsRemaining = user.premium_nights || 0;

    return NextResponse.json({
      isPremium,
      nightsRemaining,
      role: user.role
    });
  } catch (error) {
    console.error("Ошибка получения премиум-статуса:", error);
    return NextResponse.json(
      { error: "Не удалось получить информацию о премиум-статусе" },
      { status: 500 }
    );
  }
}
