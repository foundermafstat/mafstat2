"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

// Схема валидации для новых паролей
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [validating, setValidating] = useState(true)

  // Проверяем валидность токена при загрузке
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        setError("Токен сброса пароля отсутствует или недействителен")
        setValidating(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setTokenValid(false)
          setError(data.error || "Ссылка для сброса пароля недействительна или устарела")
        } else {
          setTokenValid(true)
        }
      } catch (error) {
        console.error("Ошибка проверки токена:", error)
        setTokenValid(false)
        setError("Произошла ошибка при проверке токена сброса пароля")
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrors({})

    // Валидация формы
    try {
      resetPasswordSchema.parse({ password, confirmPassword })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        for (const err of error.errors) {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message
          }
        }
        setErrors(fieldErrors)
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Произошла ошибка при сбросе пароля")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error)
      setError("Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.")
      setIsLoading(false)
    }
  }

  // Показываем состояние загрузки
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Сброс пароля</CardTitle>
            <CardDescription>
              Проверка ссылки для сброса пароля...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Если токен недействителен
  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Ошибка сброса пароля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || "Недействительная ссылка для сброса пароля"}</AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Запросить новую ссылку для сброса пароля
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Сброс пароля</CardTitle>
          <CardDescription>
            Создайте новый пароль для вашей учетной записи
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Ваш пароль успешно изменен. Теперь вы можете войти в систему, используя новый пароль.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/login" className="text-primary hover:underline">
                Перейти на страницу входа
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Новый пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить новый пароль"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
