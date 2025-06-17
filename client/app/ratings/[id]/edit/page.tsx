"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { useData } from "@/hooks/use-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Club = {
  id: number
  name: string
}

type Rating = {
  id: number
  name: string
  description?: string
  owner_id: number
  club_id?: number
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
  owner_name?: string
  club_name?: string
}

export default function EditRatingPage() {
  const params = useParams()
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [clubId, setClubId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isActive, setIsActive] = useState(true)

  // Загружаем список клубов для выбора
  const { data: clubsData } = useData<{ success: boolean; clubs: Club[] }>("/api/clubs")
  
  // Загружаем данные рейтинга
  const { data: ratingData, isLoading, error } = useData<{
    success: boolean
    rating: Rating
  }>(`/api/ratings/${params.id}`)

  useEffect(() => {
    if (ratingData?.rating) {
      const rating = ratingData.rating
      
      setName(rating.name)
      setDescription(rating.description || "")
      setClubId(rating.club_id ? String(rating.club_id) : null)
      setIsActive(rating.is_active)
      
      if (rating.start_date) {
        setStartDate(new Date(rating.start_date))
      }
      
      if (rating.end_date) {
        setEndDate(new Date(rating.end_date))
      }
    }
  }, [ratingData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Название рейтинга обязательно для заполнения",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/ratings/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          club_id: clubId ? parseInt(clubId, 10) : null,
          start_date: startDate?.toISOString() || null,
          end_date: endDate?.toISOString() || null,
          is_active: isActive
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обновлении рейтинга")
      }

      toast({
        title: "Рейтинг обновлен",
        description: "Информация о рейтинге успешно обновлена",
      })

      // Перенаправляем на страницу рейтинга
      router.push(`/ratings/${params.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating rating:", error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить рейтинг",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !ratingData?.rating) {
    return (
      <div className="container py-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">Ошибка загрузки рейтинга</h2>
          <p className="text-red-500 mb-6">
            {error?.message || "Рейтинг не найден"}
          </p>
          <Link href="/ratings">
            <Button>Вернуться к списку рейтингов</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center">
        <Link href={`/ratings/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к рейтингу
          </Button>
        </Link>
        <h1 className="text-3xl font-heading ml-4">Редактирование рейтинга</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о рейтинге</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название рейтинга *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Введите название рейтинга"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите рейтинг, его правила и особенности"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="club">Клуб</Label>
                <Select value={clubId || ""} onValueChange={setClubId}>
                  <SelectTrigger id="club">
                    <SelectValue placeholder="Выберите клуб (необязательно)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без привязки к клубу</SelectItem>
                    {clubsData?.clubs?.map((club) => (
                      <SelectItem key={club.id} value={String(club.id)}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Дата начала</Label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Выберите дату начала"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Дата окончания</Label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Выберите дату окончания"
                    disabled={!startDate}
                    fromDate={startDate || undefined}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="is-active" 
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is-active">Рейтинг активен</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Link href={`/ratings/${params.id}`}>
                <Button variant="outline" type="button">Отмена</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
