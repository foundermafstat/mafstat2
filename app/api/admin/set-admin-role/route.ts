import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

/**
 * Устанавливает роль администратора для текущего пользователя
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации пользователя
    console.log("[SET_ADMIN_API] Проверка сессии...");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("[SET_ADMIN_API] Пользователь не авторизован");
      return NextResponse.json(
        { success: false, error: "Пользователь не авторизован" },
        { status: 401 }
      );
    }

    // Получаем email пользователя из сессии
    const userEmail = session.user.email;
    console.log(`[SET_ADMIN_API] Установка роли admin для пользователя: ${userEmail}`);

    // Обновляем роль пользователя в базе данных
    const result = await sql`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = ${userEmail} 
      RETURNING id, email, role
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Роль администратора успешно установлена",
      user: result[0]
    });
  } catch (error) {
    console.error("[SET_ADMIN_API] Ошибка:", error);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
