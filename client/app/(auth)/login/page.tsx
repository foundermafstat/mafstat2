"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info, Github, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testAccounts, setTestAccounts] = useState<{type: string, email: string, password: string}[]>([])
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  // Создание и загрузка тестовых аккаунтов
  useEffect(() => {
    const createTestAccounts = async () => {
      try {
        const response = await fetch('/api/setup/test-accounts')
        const data = await response.json()
        if (data.success && data.testAccounts) {
          setTestAccounts(data.testAccounts)
        }
      } catch (error) {
        console.error("Ошибка при создании тестовых аккаунтов:", error)
      }
    }
    
    createTestAccounts()
  }, [])

  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "CredentialsSignin":
          setError("Неверный email или пароль")
          break
        default:
          setError(`Ошибка аутентификации: ${errorParam}`)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Использовать редирект для NextAuth вместо ручного перенаправления
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: '/',
        redirect: true,
      })

      // Этот код не будет выполнен при redirect: true
      // Но оставляем для случая, если redirect будет отключен
      if (result?.error) {
        setError("Неверный email или пароль")
        setIsLoading(false)
        return
      }
    } catch (error) {
      console.error("Ошибка входа:", error)
      setError("Произошла ошибка при входе. Пожалуйста, попробуйте снова.")
      setIsLoading(false)
    }
  }

  // Функция для быстрого входа с тестовыми данными
  const loginWithTestAccount = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  // Функции для входа через социальные сети
  const loginWithGoogle = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }
  
  const loginWithGithub = async () => {
    setIsLoading(true)
    await signIn("github", { callbackUrl: "/" })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>Введите свои учетные данные для доступа к аккаунту</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Тестовые аккаунты */}
            {testAccounts.length > 0 && (
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  className="w-full text-sm flex items-center justify-center gap-2"
                  type="button"
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                >
                  <Info className="h-4 w-4" />
                  {showTestAccounts ? "Скрыть тестовые аккаунты" : "Показать тестовые аккаунты"}
                </Button>
                
                {showTestAccounts && (
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    <h3 className="font-medium mb-2">Тестовые аккаунты:</h3>
                    <div className="space-y-2">
                      {testAccounts.map((account) => (
                        <div key={`account-${account.email}`} className="p-2 border rounded-md">
                          <p className="font-medium">{account.type}</p>
                          <p>Email: <span className="font-mono">{account.email}</span></p>
                          <p>Пароль: <span className="font-mono">{account.password}</span></p>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="mt-1 w-full"
                            onClick={() => loginWithTestAccount(account.email, account.password)}
                          >
                            Использовать
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="text-right text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Забыли пароль?
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Вход..." : "Войти"}
            </Button>
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">или войти через</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={loginWithGoogle} 
                disabled={isLoading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <title>Логотип Google</title>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={loginWithGithub} 
                disabled={isLoading}
                className="w-full"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
            
            <div className="text-sm text-center mt-4">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Зарегистрируйтесь
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
