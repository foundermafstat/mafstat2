import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { neon } from "@neondatabase/serverless";

// Обработка вебхуков от Stripe
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Отсутствует подпись Stripe или секрет вебхука" },
      { status: 400 }
    );
  }

  try {
    // Проверка подписи события
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Подключение к базе данных
    const sql = neon(process.env.DATABASE_URL || "");

    // Обработка разных типов событий
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const { userId, nights, paymentId } = paymentIntent.metadata;

        // Получаем связанную сессию Stripe через API
        let sessionId = null;
        try {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
          if (sessions.data.length > 0) {
            sessionId = sessions.data[0].id;
          }
        } catch (e) {
          console.error("Ошибка поиска Stripe session по payment_intent:", e);
        }

        if (userId && nights) {
          // Проверяем, есть ли уже у пользователя премиум
          const users = await sql`
            SELECT premium_nights
            FROM users
            WHERE id = ${userId}
          `;

          if (users.length > 0) {
            const user = users[0];
            const currentNights = user.premium_nights || 0;
            const newNights = currentNights + Number.parseInt(nights);

            // Обновляем статус премиум пользователя
            await sql`
              UPDATE users
              SET 
                role = 'premium',
                premium_nights = ${newNights},
                updated_at = NOW()
              WHERE id = ${userId}
            `;

            // Обновляем статус платежа по sessionId
            if (sessionId) {
              await sql`
                UPDATE payments
                SET status = 'completed', updated_at = NOW()
                WHERE "stripeSessionId" = ${sessionId}
              `;
              console.log(`Статус платежа обновлен для session ${sessionId}`);
            } else if (paymentId) {
              // Fallback: если sessionId не найден, пробуем по paymentId из metadata
              await sql`
                UPDATE payments
                SET status = 'completed', updated_at = NOW()
                WHERE id = ${paymentId}
              `;
              console.log(`Статус платежа обновлен по paymentId ${paymentId}`);
            } else {
              console.warn("Stripe sessionId и paymentId не найдены, платеж не обновлен");
            }

            console.log(`Премиум обновлен для пользователя ${userId}: ${newNights} вечеров`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        console.log("Платеж не удался:", event.data.object);
        break;
      }

      default:
        console.log(`Необработанное событие: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Ошибка вебхука: ${err}`);
    return NextResponse.json(
      { error: "Ошибка обработки вебхука" },
      { status: 400 }
    );
  }
}
