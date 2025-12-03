"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { getStripe, getPremiumPlans, getPremiumPlanById } from "@/lib/stripe"
import { api } from "@/lib/api"

// Функция заглушка для prismaOperation, чтобы не ломать совместимость
// В реальном коде нужно заменить на вызовы API
async function prismaOperation<T>(
  operation: () => Promise<T>, 
  options?: any
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('Operation Error:', error)
    if (options?.fallbackValue) return options.fallbackValue
    throw error
  }
}

/**
 * Создание премиум-продуктов, если они еще не существуют в БД
 */
export async function ensurePremiumProducts() {
  return prismaOperation(
    async () => {
      // TODO: Реализовать через API
      // const existingProducts = await api.get('/products?name=Премиум')
      
      // if (existingProducts && existingProducts.length > 0) {
      //   return existingProducts
      // }
      
      // Для клиентской части пока возвращаем моковые данные
      // Реальная логика должна быть на сервере
      const premiumPlans = await getPremiumPlans()
      
      // В идеале сервер должен сам создавать продукты при старте
      // await api.post('/products/init-premium', { plans: premiumPlans })
      
      return premiumPlans.map(p => ({
        ...p,
        currency: 'RUB',
        imageUrl: '/images/premium.jpg'
      }))
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

    // Получаем план по ID
    const planConfig = await getPremiumPlanById(planId)
    if (!planConfig) {
      return { error: "Выбранный план не найден" }
    }

    // Создаем платеж через API
    try {
      const paymentResponse = await api.post('/payments/create-checkout', {
        planId,
        userId: session.user.id,
        userEmail: session.user.email,
        amount: planConfig.price,
        description: planConfig.description,
        name: planConfig.name
      })
      
      if (paymentResponse.url) {
        return { url: paymentResponse.url }
      }
      
      // Если API вернул ошибку или не вернул URL
      if (paymentResponse.error) {
        return { error: paymentResponse.error }
      }
    } catch (error) {
      console.error("API call failed, falling back to client-side Stripe", error)
    }

    // Fallback: если API недоступен, пробуем создать сессию Stripe напрямую (как было раньше)
    // Но сохранение в БД теперь невозможно без Prisma
    // Поэтому лучше вернуть ошибку, если API недоступен
    
    return { error: "Сервис платежей временно недоступен" }
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
    
    // Вызываем API для проверки статуса
    const result = await api.post('/payments/check-status', { sessionId })
    
    return result
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
      
      try {
        // Получаем данные через API
        const status = await api.get('/users/premium-status')
        return status
      } catch (error) {
        console.error("Failed to fetch premium status from API:", error)
        
        // Fallback from session if API fails
        return {
          success: true,
          isPremium: session.user.role === 'premium',
          nights: 0, // Cannot get nights from session reliably without update
          payments: [],
          user: {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role
          }
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
      
      try {
        // Вызываем API
        const result = await api.post('/users/use-premium-night', { gameId })
        return result
      } catch (error) {
        console.error("API error:", error)
        return { success: false, error: "Ошибка при использовании премиум-вечера" }
      }
    },
    {
      errorMsg: "Ошибка при использовании премиум-вечера",
      fallbackValue: { success: false, error: "Ошибка при использовании премиум-вечера" }
    }
  )
}
