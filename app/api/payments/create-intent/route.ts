import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, premiumPlans } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const session = await auth();
  
  // Проверка аутентификации
  if (!session?.user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { planId } = body;
    
    // Поиск выбранного плана
    const selectedPlan = premiumPlans.find(plan => plan.id === planId);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: "План не найден" },
        { status: 400 }
      );
    }
    
    // Создание платежного намерения в Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPlan.price * 100, // Stripe использует минимальные единицы валюты (копейки)
      currency: "rub",
      description: `Premium ${selectedPlan.nights} вечеров для ${session.user.email}`,
      metadata: {
        userId: session.user.id,
        planId: selectedPlan.id,
        nights: selectedPlan.nights.toString(),
      },
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Ошибка создания платежа:", error);
    return NextResponse.json(
      { error: "Не удалось создать платеж" },
      { status: 500 }
    );
  }
}
