import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { addPlayerFieldsToUsers } from "@/lib/migrations/add-player-fields-to-users";

/**
 * API эндпоинт для запуска миграции добавления полей игрока в таблицу пользователей
 * Только администраторы могут запускать эту миграцию
 * GET /api/migrations/player-fields
 */
export async function GET() {
  try {
    // Проверка аутентификации и авторизации с использованием getServerSession
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }
    
    // Проверка роли администратора
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Нет доступа. Требуется роль администратора" },
        { status: 403 }
      );
    }
    
    // Запуск миграции с добавлением поля bio
    const result = await addPlayerFieldsToUsers();
    
    if (!result.success) {
      console.error("Ошибка миграции:", result.error);
      return NextResponse.json(
        { error: "Ошибка при выполнении миграции", details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Миграция успешно выполнена: поля игрока и bio добавлены в таблицу пользователей" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Непредвиденная ошибка при выполнении миграции:", error);
    return NextResponse.json(
      { error: "Непредвиденная ошибка при выполнении миграции", details: error },
      { status: 500 }
    );
  }
}
