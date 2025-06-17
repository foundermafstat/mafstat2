import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

// Инициализация Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
});

/**
 * Проверка статуса сессии Stripe
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

    // Получаем информацию о сессии из Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "");

    // Получаем платеж из базы данных
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
    
    // Если платеж успешно оплачен, обновляем его статус
    if (session.payment_status === "paid" && payment.status !== "completed") {
      // Обновляем статус платежа
      await sql`
        UPDATE payments
        SET 
          status = 'completed',
          updated_at = NOW()
        WHERE id = ${payment.id}
      `;
      
      // Получаем количество ночей из метаданных или определяем по сумме
      let nights = Number.parseInt(session.metadata?.nights || "0", 10);
      if (!nights) {
        const amount = payment.amount;
        if (amount === 2000) {
          nights = 4;
        } else if (amount === 3600) {
          nights = 8;
        } else {
          nights = Math.floor(amount / 500); // Примерная оценка: 500 руб за вечер
        }
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
            premium_nights = ${newNights},
            updated_at = NOW()
          WHERE id = ${payment.userId}
        `;
      }
      
      return NextResponse.json({
        success: true,
        status: "completed",
        amount: payment.amount,
        nights: nights,
        message: "Платеж успешно обработан"
      });
    }
    
    // Возвращаем информацию о платеже
    return NextResponse.json({
      success: true,
      status: session.payment_status,
      amount: payment.amount,
      message: "Статус платежа получен"
    });
  } catch (error) {
    console.error("Ошибка при проверке сессии:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке сессии" },
      { status: 500 }
    );
  }
}
