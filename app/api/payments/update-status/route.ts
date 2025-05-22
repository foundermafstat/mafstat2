import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

/**
 * Обновление статуса платежа на "completed" и начисление премиум-вечеров
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "ID сессии не указан" },
        { status: 400 }
      );
    }

    // Находим платеж по sessionId
    const payments = await sql`
      SELECT * FROM payments
      WHERE "stripeSessionId" = ${sessionId}
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
        message: "Платеж уже обработан",
      });
    }

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

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const user = users[0];

    // Обновляем статус платежа
    await sql`
      UPDATE payments
      SET status = 'completed'
      WHERE id = ${payment.id}
    `;

    // Обновляем пользователя с премиум-статусом
    const currentNights = user.premium_nights || 0;
    const newNights = currentNights + nights;

    await sql`
      UPDATE users
      SET 
        role = 'premium',
        premium_nights = ${newNights}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: "Статус платежа успешно обновлен",
      nights: newNights,
    });
  } catch (error) {
    console.error("Ошибка при обновлении статуса платежа:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении статуса платежа" },
      { status: 500 }
    );
  }
}
