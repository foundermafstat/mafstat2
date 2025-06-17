import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { neon } from "@neondatabase/serverless";

/**
 * Обновление статуса платежа на "completed"
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Доступ запрещен" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID платежа не указан" },
        { status: 400 }
      );
    }

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "");

    // Получаем платеж из базы данных
    const payments = await sql`
      SELECT * FROM payments
      WHERE id = ${paymentId}
    `;

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { error: "Платеж не найден" },
        { status: 404 }
      );
    }

    const payment = payments[0];
    
    // Если платеж уже обработан, возвращаем успех
    if (payment.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Платеж уже обработан"
      });
    }
    
    // Обновляем статус платежа
    await sql`
      UPDATE payments
      SET status = 'completed'
      WHERE id = ${paymentId}
    `;
    
    // Определяем количество ночей по сумме платежа
    let nights = 0;
    const amount = payment.amount;
    if (amount === 2000) {
      nights = 4;
    } else if (amount === 3600) {
      nights = 8;
    } else {
      nights = Math.floor(amount / 500); // Примерная оценка: 500 руб за вечер
    }
    
    // Получаем текущие данные пользователя
    const users = await sql`
      SELECT id, email, role, premium_nights
      FROM users
      WHERE id = ${payment.userId}
    `;
    
    if (users && users.length > 0) {
      const user = users[0];
      const currentNights = user.premium_nights || 0;
      const newNights = currentNights + nights;
      
      // Обновляем пользователя с премиум-статусом
      await sql`
        UPDATE users
        SET 
          role = 'premium',
          premium_nights = ${newNights}
        WHERE id = ${payment.userId}
      `;
    }
    
    return NextResponse.json({
      success: true,
      message: "Статус платежа успешно обновлен"
    });
  } catch (error) {
    console.error("Ошибка при обновлении статуса платежа:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении статуса платежа" },
      { status: 500 }
    );
  }
}
