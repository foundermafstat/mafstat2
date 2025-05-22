import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { query } from "@/lib/db";

// Отладочная функция для печати объекта в консоль
function debugLog(label: string, obj: any) {
  console.log(`[DEBUG] ${label}:`, JSON.stringify(obj, null, 2));
}

export async function GET(request: NextRequest) {
  console.log("[PAYMENTS API] Начало обработки запроса");
  
  try {
    // Проверка авторизации пользователя
    console.log("[PAYMENTS API] Проверка сессии...");
    let session;
    
    try {
      session = await getServerSession(authOptions);
      debugLog("Текущая сессия", session);
    } catch (sessionError) {
      console.error("[PAYMENTS API] Ошибка при получении сессии:", sessionError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Ошибка авторизации", 
          details: sessionError instanceof Error ? sessionError.message : String(sessionError) 
        },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.log("[PAYMENTS API] Сессия не найдена");
      return NextResponse.json(
        { success: false, error: "Сессия не найдена" },
        { status: 401 }
      );
    }
    
    if (!session.user) {
      console.log("[PAYMENTS API] Пользователь не авторизован");
      return NextResponse.json(
        { success: false, error: "Пользователь не авторизован" },
        { status: 401 }
      );
    }

    console.log(`[PAYMENTS API] Запрос платежей для пользователя: ${session.user.email}`);

    // Проверка роли администратора
    let users;
    try {
      users = await query`
        SELECT id, role FROM users WHERE email = ${session.user.email}
      `;
      debugLog("Результат запроса пользователя", users);
    } catch (dbError) {
      console.error("[PAYMENTS API] Ошибка при запросе пользователя:", dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Ошибка базы данных", 
          details: dbError instanceof Error ? dbError.message : String(dbError) 
        },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log("[PAYMENTS API] Пользователь не найден в базе данных");
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }
    
    // Временно отключена проверка на роль администратора
    // Теперь любой залогиненный пользователь может просматривать платежи
    /*
    if (users[0].role !== "admin") {
      console.log(`[PAYMENTS API] Недостаточно прав, роль пользователя: ${users[0].role}`);
      return NextResponse.json(
        { success: false, error: "Доступ запрещен, требуются права администратора" },
        { status: 403 }
      );
    }
    */

    // Получение всех платежей с информацией о пользователях и продуктах
    console.log("[PAYMENTS API] Запрос платежей из базы данных...");
    let payments;
    try {
      payments = await query`
        SELECT 
          p.*,
          u.email as "userEmail",
          u.name as "userName",
          prod.name as "productName"
        FROM 
          payments p
        LEFT JOIN 
          users u ON p."userId"::text = u.id::text
        LEFT JOIN 
          products prod ON p."productId"::text = prod.id::text
        ORDER BY 
          p."createdAt" DESC
      `;
    } catch (paymentError) {
      console.error("[PAYMENTS API] Ошибка при запросе платежей:", paymentError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Ошибка при получении платежей", 
          details: paymentError instanceof Error ? paymentError.message : String(paymentError) 
        },
        { status: 500 }
      );
    }

    console.log(`[PAYMENTS API] Найдено платежей: ${payments?.length || 0}`);
    debugLog("Первые 2 платежа", payments?.slice(0, 2) || []);

    if (!payments) {
      return NextResponse.json({ 
        success: true, 
        payments: [] 
      });
    }

    // Преобразование данных для UI
    const formattedPayments = payments.map((payment: any) => ({
      ...payment,
      user: payment.userEmail ? {
        id: payment.userId,
        email: payment.userEmail,
        name: payment.userName,
      } : undefined
    }));

    const response = { 
      success: true, 
      payments: formattedPayments
    };
    
    console.log("[PAYMENTS API] Успешный ответ отправлен");
    return NextResponse.json(response);

  } catch (error) {
    console.error("[PAYMENTS API] Необработанная ошибка:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
