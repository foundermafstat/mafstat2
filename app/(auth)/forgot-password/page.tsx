"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Произошла ошибка при обработке запроса")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Ошибка при запросе сброса пароля:", error)
      setError("Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Восстановление пароля</CardTitle>
          <CardDescription>
            Введите ваш email для получения ссылки на сброс пароля
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Инструкции по сбросу пароля отправлены на указанный email. Пожалуйста, проверьте вашу
                почту (включая папку со спамом) и следуйте инструкциям.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/login" className="text-primary hover:underline">
                Вернуться на страницу входа
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Отправка..." : "Отправить ссылку для сброса"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Назад к странице входа
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
