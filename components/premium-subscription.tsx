"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createPremiumCheckout, checkPremiumPaymentStatus, getPremiumStatus } from "@/actions/premium"
import { premiumPlans, type PremiumPlan } from "@/lib/stripe-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Тип для платежа
interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  productId?: string;
  productName?: string;
}

// Тип для статуса премиум-подписки
interface PremiumStatus {
  success: boolean;
  isPremium: boolean;
  nights: number;
  error?: string;
  payments?: Payment[];
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function PremiumSubscription() {
  const [loading, setLoading] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [status, setStatus] = useState<PremiumStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [purchasedNights, setPurchasedNights] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Проверка статуса платежа при успешном возврате из Stripe
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    const success = searchParams.get("payment_success")
    
    const checkPayment = async () => {
      // Получаем информацию о плане по ID в URL или устанавливаем значение по умолчанию
      const planId = searchParams.get("plan_id")
      let nights = 0
      
      if (planId) {
        const plan = premiumPlans.find(p => p.id === planId)
        if (plan) {
          nights = plan.nights
        }
      } else {
        if (sessionId) {
          try {
            const stripe = await fetch("/api/payments/check-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            }).then(res => res.json())
            
            if (stripe.success && stripe.amount) {
              // Определяем количество ночей по сумме платежа
              if (stripe.amount === 2000 || stripe.amount === 20) {
                nights = 4
              } else if (stripe.amount === 3600 || stripe.amount === 36) {
                nights = 8
              } else {
                const plan = premiumPlans.find(p => p.price === stripe.amount / 100)
                if (plan) {
                  nights = plan.nights
                } else {
                  nights = 4 // По умолчанию
                }
              }
            } else {
              nights = 4 // По умолчанию
            }
          } catch (e) {
            console.error("Ошибка при проверке сессии:", e)
            nights = 4 // По умолчанию
          }
        } else if (success) {
          nights = 4 // По умолчанию
        }
      }
      
      setPurchasedNights(nights)
      
      if (sessionId) {
        setCheckingPayment(true)
        
        // Сначала обновляем статус платежа через API
        try {
          const updateResult = await fetch("/api/payments/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }).then(res => res.json())
          
          if (updateResult.success) {
            console.log("Статус платежа обновлен:", updateResult)
            setPaymentSuccess(true)
            
            // Если API вернул количество ночей, используем его
            if (updateResult.nights) {
              setPurchasedNights(updateResult.nights)
            }
          }
        } catch (e) {
          console.error("Ошибка при обновлении статуса платежа:", e)
        }
        
        // Затем проверяем статус через стандартный метод
        const result = await checkPremiumPaymentStatus(sessionId)
        if (result.success) {
          setPaymentSuccess(true)
          await fetchStatus()
        } else {
          setError(result.error || "Ошибка при проверке платежа")
        }
        
        setCheckingPayment(false)
        
        const url = new URL(window.location.href)
        url.searchParams.delete("session_id")
        url.searchParams.set("payment_success", "true")
        router.replace(url.pathname + url.search)
      } else if (success) {
        setPaymentSuccess(true)
        await fetchStatus()
      }
    }
    
    if (sessionId || success) {
      checkPayment()
    }
  }, [searchParams, router])
  
  // Запрос статуса при загрузке компонента
  useEffect(() => {
    fetchStatus()
  }, [])
  
  // Получение текущего статуса пользователя
  const fetchStatus = async () => {
    try {
      const result = await getPremiumStatus()
      setStatus(result)
      if (!result.success && result.error) {
        setError(result.error)
      } else {
        setError(null)
      }
    } catch (e) {
      console.error("Ошибка при получении статуса:", e)
      setError("Не удалось получить информацию о премиум-статусе")
    }
  }
  
  // Обработка покупки премиум-плана
  const handlePurchase = async (planId: "premium-4" | "premium-8") => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await createPremiumCheckout({ planId })
      
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        const url = new URL(result.url)
        url.searchParams.append("plan_id", planId)
        
        window.location.href = url.toString()
        return
      }
    } catch (e) {
      console.error("Ошибка при создании платежа:", e)
      const errorMessage = typeof e === 'object' && e !== null && 'message' in e 
        ? String(e.message) 
        : "Не удалось создать платеж"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Сообщение об успешной покупке */}
      {paymentSuccess && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Платеж успешно выполнен!</AlertTitle>
          <AlertDescription>
            Вы успешно приобрели {purchasedNights} премиум {purchasedNights === 1 ? 'вечер' : 
              purchasedNights < 5 ? 'вечера' : 'вечеров'}.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Отображение статуса */}
      {status?.isPremium && (
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Премиум-статус активен <Badge className="bg-green-600">Активно</Badge>
            </CardTitle>
            <CardDescription>
              У вас есть доступ к расширенной статистике
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              Доступно игровых вечеров: <span className="text-xl text-green-700">{status.nights}</span>
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Отображение ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}
      
      {/* Карточки с планами */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {premiumPlans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-3xl font-bold">{plan.price} ₽</p>
              <p className="text-sm text-muted-foreground">
                {plan.price / plan.nights} ₽ за вечер
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(plan.id as "premium-4" | "premium-8")}
                disabled={loading || checkingPayment}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  `Купить за ${plan.price} ₽`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Индикатор проверки платежа */}
      {checkingPayment && (
        <div className="flex justify-center items-center p-4">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <p>Проверка статуса платежа...</p>
        </div>
      )}
    </div>
  )
}
