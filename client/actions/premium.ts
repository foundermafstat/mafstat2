"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { getStripe, getPremiumPlans, getPremiumPlanById } from "@/lib/stripe"
import { prisma, prismaOperation } from "@/lib/prisma"

/**
 * Создание премиум-продуктов, если они еще не существуют в БД
 */
export async function ensurePremiumProducts() {
  return prismaOperation(
    async () => {
      // Проверяем существование продуктов
      const existingProducts = await prisma.product.findMany({
        where: {
          name: {
            contains: 'Премиум'
          }
        }
      })
      
      // Если продукты уже есть, возвращаем их
      if (existingProducts && existingProducts.length > 0) {
        return existingProducts
      }
      
      // Получаем премиум-планы
      const premiumPlans = await getPremiumPlans()
      
      // Создаем продукты
      const createdProducts = []
      
      for (const product of premiumPlans) {
        const insertedProduct = await prisma.product.create({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: 'RUB',
            imageUrl: '/images/premium.jpg'
          }
        })
        
        createdProducts.push(insertedProduct)
      }
      
      console.log("Премиум-продукты успешно созданы:", createdProducts)
      return createdProducts
    },
    {
      errorMsg: "Ошибка при создании премиум-продуктов",
      fallbackValue: null
    }
  )
}

/**
 * Создание премиум-плана для пользователя
 * @param planId - ID плана (premium-4 или premium-8)
 * @returns URL для оплаты или информация об ошибке
 */
export async function createPremiumCheckout({ planId }: { planId: "premium-4" | "premium-8" }) {
  try {
    // Проверка авторизации пользователя
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error("Попытка создания платежа неавторизованным пользователем")
      return { error: "Пользователь не авторизован" }
    }

    // Получение данных пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    })
    
    if (!user) {
      console.error(`Пользователь с email ${session.user.email} не найден в базе данных`)
      return { error: "Пользователь не найден" }
    }

    // Получаем план по ID
    const planConfig = await getPremiumPlanById(planId)
    if (!planConfig) {
      return { error: "Выбранный план не найден" }
    }

    // Создаем платеж в базе данных
    const payment = await prisma.payment.create({
      data: {
        amount: planConfig.price,
        currency: 'RUB',
        status: 'pending',
        paymentType: 'premium',
        userId: user.id
      }
    })
    
    console.log(`Платеж создан в базе данных: ${payment.id}`)

    // Создаем сессию Stripe для оплаты
    const stripe = await getStripe()
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "rub",
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.price * 100, // Stripe работает с наименьшими единицами валюты (копейки)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?payment_cancel=true`,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        planId: planId,
        nights: planConfig.nights.toString(),
      },
      customer_email: user.email || undefined,
    })

    console.log(`Сессия Stripe создана: ${stripeSession.id}`)

    // Обновляем платеж с ID сессии Stripe
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: stripeSession.id
      }
    })

    return { url: stripeSession.url }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Ошибка при создании платежной сессии:", errorMessage)
    return { error: "Ошибка при создании платежной сессии" }
  }
}

/**
 * Проверка статуса премиум-оплаты и активация премиум-статуса
 * @param sessionId - ID сессии Stripe
 * @returns Результат проверки статуса
 */
export async function checkPremiumPaymentStatus(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: "ID сессии не указан" }
  }
  
  try {
    console.log(`Проверка статуса премиум-платежа для сессии: ${sessionId}`)
    
    // Получаем сессию из Stripe
    const stripe = await getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    // Получаем платеж из базы данных
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId }
    })
    
    if (!payment) {
      console.error(`Платеж с ID сессии ${sessionId} не найден в базе данных`)
      return { success: false, error: "Платеж не найден" }
    }
    
    console.log(`Текущий статус платежа в Stripe: ${session.payment_status}`)
    
    // Если платеж успешно оплачен
    if (session.payment_status === "paid") {
      console.log(`Обновление статуса платежа ${payment.id} на 'completed'`)
      
      // Если платеж уже был обработан, возвращаем успех
      if (payment.status === "completed") {
        return { success: true, status: "completed", message: "Платеж уже обработан" }
      }
      
      // Получаем количество ночей из метаданных или из плана
      let nights = Number.parseInt(session.metadata?.nights || "0", 10)
      const userId = payment.userId
        
      // Если ночи не указаны в метаданных, определяем по сумме платежа
      if (!nights) {
        const amount = payment.amount
        if (amount === 2000) {
          nights = 4
        } else if (amount === 3600) {
          nights = 8
        } else {
          nights = Math.floor(amount / 500) // Примерная оценка: 500 руб за вечер
        }
      }
      
      if (!userId) {
        return { success: false, error: "Отсутствуют данные о пользователе" }
      }
      
      // Получаем текущие данные пользователя
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        return { success: false, error: "Пользователь не найден" }
      }
      
      const currentNights = user.premiumNights || 0
      const newNights = currentNights + nights
      
      // Обновляем пользователя с премиум-статусом
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'premium',
          premiumNights: newNights,
          planUpdatedAt: new Date()
        }
      })
      
      // Обновляем статус платежа
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          stripePaymentIntentId: session.payment_intent as string
        }
      })
      
      return { 
        success: true, 
        status: "completed",
        nights: newNights,
        message: `Премиум-статус активирован. Доступно игровых вечеров: ${newNights}`
      }
    }
    
    // Если платеж не оплачен или в другом статусе
    return { 
      success: true, 
      status: session.payment_status,
      message: "Платеж еще не завершен"
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Ошибка при проверке статуса платежа:", errorMessage)
    return { success: false, error: "Ошибка при проверке статуса платежа" }
  }
}

/**
 * Получение текущего премиум-статуса пользователя
 * @returns Информация о премиум-статусе пользователя
 */
export async function getPremiumStatus() {
  return prismaOperation(
    async () => {
      // Проверка авторизации пользователя
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return { 
          success: false, 
          error: "Пользователь не авторизован",
          isPremium: false,
          nights: 0
        }
      }
      
      // Получение данных пользователя
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string }
      })
      
      if (!user) {
        return { 
          success: false, 
          error: "Пользователь не найден",
          isPremium: false,
          nights: 0
        }
      }
      
      const isPremium = user.role === 'premium'
      const nights = user.premiumNights || 0
      
      // Получение истории платежей пользователя
      const payments = await prisma.payment.findMany({
        where: { userId: user.id },
        include: {
          product: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      return {
        success: true,
        isPremium,
        nights,
        payments: payments || [],
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    },
    {
      errorMsg: "Ошибка при получении премиум-статуса",
      fallbackValue: { 
        success: false, 
        error: "Ошибка при получении информации о премиум-статусе",
        isPremium: false,
        nights: 0
      }
    }
  )
}

/**
 * Использование игрового вечера (уменьшение счетчика премиум-ночей)
 * @param gameId - ID игры
 * @returns Результат операции
 */
export async function usePremiumNight(gameId: string) {
  return prismaOperation(
    async () => {
      // Проверка авторизации пользователя
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return { success: false, error: "Пользователь не авторизован" }
      }
      
      // Получение данных пользователя
      const user = await prisma.user.findUnique({
        where: { email: session.user.email as string }
      })
      
      if (!user) {
        return { success: false, error: "Пользователь не найден" }
      }
      
      // Проверка наличия премиум-ночей
      if (user.role !== 'premium' || !user.premiumNights || user.premiumNights <= 0) {
        return { 
          success: false, 
          error: "У вас нет доступных премиум-вечеров",
          isPremium: user.role === 'premium',
          nights: user.premiumNights || 0
        }
      }
      
      // Уменьшаем количество премиум-ночей
      const newNights = user.premiumNights - 1
      
      // Обновляем пользователя
      await prisma.user.update({
        where: { id: user.id },
        data: {
          premiumNights: newNights,
          // Если игровых вечеров не осталось, меняем роль на обычную
          ...(newNights <= 0 && { role: 'user' })
        }
      })
      
      // Записываем использование в лог
      await prisma.payment.create({
        data: {
          amount: 0,
          currency: 'RUB',
          status: 'completed',
          paymentType: 'premium_night_used',
          userId: user.id
        }
      })
      
      return { 
        success: true,
        message: "Премиум-вечер успешно использован",
        nights: newNights,
        isPremium: newNights > 0
      }
    },
    {
      errorMsg: "Ошибка при использовании премиум-вечера",
      fallbackValue: { success: false, error: "Ошибка при использовании премиум-вечера" }
    }
  )
}
