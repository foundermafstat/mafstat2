"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Federation } from "@/types/game"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditFederationPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [additionalPointsConditions, setAdditionalPointsConditions] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Загрузка данных федерации
  useEffect(() => {
    async function fetchFederation() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/federations/${params.id}`)
        
        if (!response.ok) {
          throw new Error(`Ошибка при загрузке данных федерации: ${response.status}`)
        }
        
        const federation: Federation = await response.json()
        
        // Заполнение формы данными
        setName(federation.name || "")
        setDescription(federation.description || "")
        setUrl(federation.url || "")
        setCountry(federation.country || "")
        setCity(federation.city || "")
        
        // Преобразование JSON объекта в строку для отображения в поле textarea
        if (federation.additional_points_conditions) {
          setAdditionalPointsConditions(
            JSON.stringify(federation.additional_points_conditions, null, 2)
          )
        }
      } catch (err) {
        console.error("Ошибка при загрузке федерации:", err)
        setError(err instanceof Error ? err.message : "Ошибка загрузки данных")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFederation()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Ошибка",
        description: "Название федерации обязательно",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Парсинг строки с дополнительными очками в JSON
      let parsedConditions = null
      if (additionalPointsConditions) {
        try {
          parsedConditions = JSON.parse(additionalPointsConditions)
        } catch (parseError) {
          toast({
            title: "Ошибка",
            description: "Условия дополнительных очков должны быть в формате JSON",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Отправка данных на сервер
      const response = await fetch(`/api/federations/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          url,
          country,
          city,
          additional_points_conditions: parsedConditions,
        }),
      })

      if (!response.ok) {
        throw new Error("Ошибка при обновлении федерации")
      }

      toast({
        title: "Успех",
        description: "Федерация успешно обновлена",
      })

      // Редирект на страницу федерации
      router.push(`/federations/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Ошибка при обновлении федерации:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Ошибка при обновлении федерации",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="flex items-center mb-6">
            <Link href={`/federations/${params.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Вернуться к федерации
              </Button>
            </Link>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-500">Ошибка загрузки данных</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <div className="mt-4">
                <Link href={`/federations/${params.id}`}>
                  <Button>Вернуться к федерации</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href={`/federations/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к федерации
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Редактирование федерации</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Детали федерации</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Название федерации <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите название федерации"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Описание
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Введите описание федерации"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Веб-сайт
                    </label>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm font-medium">
                      Страна
                    </label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Введите страну"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">
                      Город
                    </label>
                    <Input 
                      id="city" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      placeholder="Введите город" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="additionalPointsConditions" className="text-sm font-medium">
                    Условия дополнительных очков (JSON)
                  </label>
                  <Textarea
                    id="additionalPointsConditions"
                    value={additionalPointsConditions}
                    onChange={(e) => setAdditionalPointsConditions(e.target.value)}
                    placeholder='[{"condition": "2+ мафии", "points": 0.25}, {"condition": "3 мафии", "points": 0.5}]'
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Введите JSON массив объектов со свойствами "condition" и "points"
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Link href={`/federations/${params.id}`}>
                    <Button variant="outline" type="button">
                      Отмена
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      "Сохранить изменения"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
