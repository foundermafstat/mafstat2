"use server"

import { revalidatePath } from "next/cache"
import Stripe from "stripe"

import { auth } from "@/auth"
import { prisma, prismaOperation } from "@/lib/prisma"
import { z } from "zod"

// Инициализация Stripe
// biome-ignore lint/style/noNonNullAssertion: <explanation>
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

// Схема валидации для создания продукта
const createProductSchema = z.object({
  name: z.string().min(1, "Название продукта обязательно"),
  description: z.string().min(1, "Описание продукта обязательно"),
  price: z.number().positive("Цена должна быть положительным числом"),
  currency: z.string().default("USD"),
  imageUrl: z.string().optional(),
})

type CreateProductInput = z.infer<typeof createProductSchema>

/**
 * Создание продукта в базе данных
 */
export async function createProduct(productData: CreateProductInput) {
  return prismaOperation(
    async () => {
      // Валидация данных
      const validatedData = createProductSchema.parse(productData)
      
      const product = await prisma.product.create({
        data: validatedData,
      })

      revalidatePath("/products")
      revalidatePath("/admin/products")
      return product
    },
    {
      errorMsg: "Ошибка при создании продукта",
      fallbackValue: null,
    }
  )
}

/**
 * Получение всех продуктов
 */
export async function getProducts() {
  return prismaOperation(
    async () => {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })
      return products
    },
    {
      errorMsg: "Ошибка при получении продуктов",
      fallbackValue: [],
    }
  )
}

/**
 * Получение продукта по ID
 */
export async function getProductById(id: string) {
  if (!id) {
    console.error("ID продукта не указан")
    return null
  }
  
  return prismaOperation(
    async () => {
      const product = await prisma.product.findUnique({
        where: { id },
      })
      
      if (!product) {
        console.log(`Продукт с ID ${id} не найден`)
      }
      
      return product
    },
    {
      errorMsg: `Ошибка при получении продукта ${id}`,
      fallbackValue: null,
    }
  )
}

/**
 * Создание платежной сессии Stripe для подписки на тарифный план
 * @param planId - Идентификатор плана (monthly или yearly)
 * @returns Объект с URL сессии или информацией об ошибке
 */
export async function createCheckoutSession({ planId }: { planId: "monthly" | "yearly" }) {
  if (!planId) {
    console.error("ID тарифного плана не указан")
    return { error: "ID тарифного плана не указан" }
  }
  
  try {
    // Проверка авторизации пользователя
    const session = await auth()
    if (!session?.user) {
      console.error("Попытка создания платежа неавторизованным пользователем")
      return { error: "Пользователь не авторизован" }
    }

    // Получение данных пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })

    if (!user) {
      console.error(`Пользователь с email ${session.user.email} не найден в базе данных`)
      return { error: "Пользователь не найден" }
    }

    // Настройка цены и описания для выбранного плана
    const planConfig = {
      monthly: {
        name: "Ежемесячная подписка Perfect Pitcher",
        description: "Доступ к полному функционалу Perfect Pitcher на 1 месяц",
        price: 9.99,
        interval: "month",
        interval_count: 1,
      },
      yearly: {
        name: "Годовая подписка Perfect Pitcher",
        description: "Доступ к полному функционалу Perfect Pitcher на 1 год (2 месяца бесплатно)",
        price: 99.99,
        interval: "year",
        interval_count: 1,
      },
    }[planId]

    // Получаем конфигурацию выбранного плана
    const plan = planConfig
    console.log(`Создание подписки для пользователя ${user.id} на план: ${planId}`)

    // Создаем платеж в базе данных
    const payment = await prisma.payment.create({
      data: {
        amount: plan.price,
        currency: "USD",
        status: "pending",
        paymentType: "subscription",
        userId: user.id,
      },
    })

    console.log(`Платеж создан в базе данных: ${payment.id}`)

    // Проверка наличия APP_URL
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL не найден в переменных окружения")
      return { error: "Ошибка конфигурации сервера" }
    }

    // Создаем сессию Stripe для оформления подписки
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: Math.round(plan.price * 100), // Stripe работает с наименьшими единицами валюты (центы)
            recurring: {
              interval: plan.interval,
              interval_count: plan.interval_count,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        planId: planId,
      },
      customer_email: user.email || undefined,
    })

    console.log(`Сессия Stripe создана: ${stripeSession.id}`)

    // Обновляем платеж с ID сессии Stripe и payment_intent
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: stripeSession.id,
        status: "completed", // Устанавливаем статус completed сразу
        stripePaymentIntentId: stripeSession.payment_intent as string || null,
      },
    })

    return { url: stripeSession.url }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Ошибка при создании платежной сессии:", errorMessage)
    return { error: "Ошибка при создании платежной сессии" }
  }
}

/**
 * Проверка статуса платежа и обновление данных пользователя
 * @param sessionId - ID сессии Stripe
 * @returns Результат проверки статуса
 */
export async function checkPaymentStatus(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: "ID сессии не указан" }
  }
  
  try {
    // Получаем информацию о сессии из Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })
    
    if (!checkoutSession) {
      return { success: false, error: "Сессия не найдена" }
    }
    
    // Проверяем статус платежа
    if (checkoutSession.payment_status !== "paid") {
      return { 
        success: false, 
        status: checkoutSession.payment_status, 
        message: "Платеж не завершен" 
      }
    }
    
    // Получаем платеж из базы данных по ID сессии
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    })
    
    if (!payment) {
      return { success: false, error: "Платеж не найден в базе данных" }
    }
    
    // Если платеж уже был обработан, возвращаем успех
    if (payment.status === "completed") {
      return { success: true, status: "completed", message: "Платеж уже обработан" }
    }
    
    // Обновляем статус платежа
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        stripePaymentIntentId: checkoutSession.payment_intent as string,
      },
    })
    
    // Если это подписка, создаем запись о подписке
    if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
      const planId = checkoutSession.metadata?.planId as "monthly" | "yearly"
      const userId = payment.userId
      
      // Создаем запись о подписке
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan: planId === "monthly" ? "MONTHLY" : "YEARLY",
          stripeSubscriptionId: checkoutSession.subscription as string,
          stripePriceId: checkoutSession.metadata?.priceId as string,
          startDate: new Date(),
          endDate: planId === "monthly" 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 дней
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +365 дней
        },
      })
      
      // Обновляем платеж с ID подписки
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          subscriptionId: subscription.id,
        },
      })
      
      // Обновляем план пользователя
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planId === "monthly" ? "MONTHLY" : "YEARLY",
          planUpdatedAt: new Date(),
        },
      })
      
      return { 
        success: true, 
        subscription, 
        message: "Подписка успешно оформлена" 
      }
    }
    
    return { success: true, message: "Платеж успешно обработан" }
  } catch (error) {
    console.error("Ошибка при проверке статуса платежа:", error)
    return { success: false, error: "Ошибка при проверке статуса платежа" }
  }
}

/**
 * Отмена подписки пользователя
 * @returns Результат отмены подписки
 */
export async function cancelSubscription() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return { success: false, error: "Пользователь не авторизован" }
    }
    
    // Получаем пользователя и его активные подписки
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })
    
    if (!user) {
      return { success: false, error: "Пользователь не найден" }
    }
    
    // Проверяем наличие активной подписки
    if (!user.subscriptions.length) {
      return { success: false, error: "Активная подписка не найдена" }
    }
    
    const subscription = user.subscriptions[0]
    
    // Если есть ID подписки в Stripe, отменяем её там
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      } catch (stripeError) {
        console.error("Ошибка при отмене подписки в Stripe:", stripeError)
        // Продолжаем выполнение, чтобы обновить статус в нашей БД
      }
    }
    
    // Обновляем статус подписки в базе данных
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    })
    
    // Возвращаем пользователя на бесплатный план
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "FREE",
        planUpdatedAt: new Date(),
      },
    })
    
    return { 
      success: true, 
      message: "Подписка успешно отменена. По окончании оплаченного периода вы будете переведены на бесплатный план."
    }
  } catch (error) {
    console.error("Ошибка при отмене подписки:", error)
    return { success: false, error: "Ошибка при отмене подписки" }
  }
}

/**
 * Проверка статуса платежа
 */
export async function verifyPayment({ sessionId }: { sessionId: string }) {
  if (!sessionId) {
    console.error("ID сессии не указан")
    return { success: false, error: "ID сессии не указан" }
  }
  
  try {
    console.log(`Проверка статуса платежа для сессии: ${sessionId}`)
    
    // Получаем сессию из Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    // Получаем платеж из базы данных
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { product: true },
    })
    
    if (!payment) {
      console.error(`Платеж с ID сессии ${sessionId} не найден в базе данных`)
      return { success: false, error: "Платеж не найден" }
    }
    
    console.log(`Текущий статус платежа в Stripe: ${session.payment_status}`)
    
    // Если платеж успешно оплачен
    if (session.payment_status === "paid") {
      console.log(`Обновление статуса платежа ${payment.id} на 'completed'`)
      
      // Обновляем статус платежа в базе данных
      await prisma.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: "completed",
          stripeCustomerId: session.customer as string,
        },
      })
      
      return { 
        success: true, 
        status: "completed",
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          productName: payment.product.name
        }
      }
    }
    
    // Если платеж не оплачен
    return { 
      success: true, 
      status: session.payment_status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        productName: payment.product.name
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Ошибка при проверке статуса платежа:", errorMessage)
    return { success: false, error: "Ошибка при проверке статуса платежа" }
  }
}

/**
 * Получение платежей пользователя
 * @returns Структурированный ответ с платежами пользователя или информацией об ошибке
 */
export async function getUserPayments() {
  try {
    // Проверка авторизации пользователя
    const session = await auth()
    if (!session?.user) {
      console.log("Попытка получения платежей неавторизованным пользователем")
      return { 
        success: false, 
        error: "Требуется авторизация", 
        payments: [] 
      }
    }

    // Получение пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })

    if (!user) {
      console.log(`Пользователь с email ${session.user.email} не найден в базе данных`)
      return { 
        success: false, 
        error: "Пользователь не найден", 
        payments: [] 
      }
    }

    console.log(`Получение платежей для пользователя: ${user.id}`)
    
    // Получение платежей из базы данных
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Найдено ${payments.length} платежей для пользователя ${user.id}`)
    
    // Формирование ответа с дополнительной информацией
    return { 
      success: true, 
      payments,
      totalCount: payments.length,
      completedCount: payments.filter(p => p.status === "completed").length,
      pendingCount: payments.filter(p => p.status === "pending").length,
      totalSpent: payments
        .filter(p => p.status === "completed")
        .reduce((sum, payment) => sum + payment.amount, 0)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Ошибка при получении платежей пользователя:", errorMessage)
    return { 
      success: false, 
      error: "Ошибка при получении платежей", 
      payments: [] 
    }
  }
}
