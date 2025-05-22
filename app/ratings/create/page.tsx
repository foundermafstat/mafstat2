"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, CalendarIcon, Search } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { useData } from "@/hooks/use-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultiSelect, OptionType } from "@/components/ui/multi-select"

type Club = {
  id: number
  name: string
}

type Game = {
  id: number
  name: string
  description: string | null
  game_type: string
  result: string | null
  referee_id: number | null
  referee_comments: string | null
  table_number: number | null
  club_id: number | null
  federation_id: number | null
  created_at: string
  updated_at: string
  referee_name: string | null
}

export default function CreateRatingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [clubId, setClubId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])
  const [gameOptions, setGameOptions] = useState<OptionType[]>([])
  const [isLoadingGames, setIsLoadingGames] = useState(false)

  // Загружаем список клубов для выбора
  const { data: clubsData } = useData<{ success: boolean; clubs: Club[] }>("/api/clubs")
  // Загружаем список игр для выбора
  // Хук useData уже извлекает массив из поля data
  const { data: gamesData, isLoading: isLoadingGamesData } = useData<Game[]>("/api/games")

  // Эффект для преобразования данных игр в формат опций для MultiSelect
  useEffect(() => {
    console.log("Games data received directly from API:", gamesData)
    
    if (!gamesData) {
      console.log("No games data available yet")
      return
    }
    
    if (Array.isArray(gamesData)) {
      console.log("Processing games data: ", gamesData.length, "games")
      
      const options = gamesData.map(game => {
        const label = `${game.name || `Игра #${game.id}`} ${game.created_at ? `(${new Date(game.created_at).toLocaleDateString('ru')})` : ''}${game.club_id ? ` - Клуб ${game.club_id}` : ''}`
        return {
          value: String(game.id),
          label
        }
      })
      
      console.log("Game options created:", options)
      setGameOptions(options)
      console.log("Game options set in state, count:", options.length)
    } else {
      console.error("Invalid games data format:", gamesData)
    }
  }, [gamesData])

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

    if (selectedGameIds.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну игру для рейтинга",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Обрабатываем ID клуба - если "none" или undefined, то null
      const finalClubId = clubId && clubId !== "none" ? Number.parseInt(clubId, 10) : null

      // Первый запрос: создание рейтинга
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          club_id: finalClubId,
          start_date: startDate?.toISOString() || null,
          end_date: endDate?.toISOString() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при создании рейтинга")
      }

      const ratingId = data.rating.id

      // Второй запрос: добавление игр к рейтингу
      if (selectedGameIds.length > 0) {
        const gameIdsPayload = selectedGameIds.map(id => Number.parseInt(id, 10))
        
        // Отправляем массив ID игр для добавления в рейтинг
        console.log("Sending game IDs to add to rating:", gameIdsPayload);
        const gamesResponse = await fetch(`/api/ratings/${ratingId}/games`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game_ids: gameIdsPayload
          }),
        })

        const gamesData = await gamesResponse.json()

        if (!gamesResponse.ok) {
          throw new Error(gamesData.error || "Ошибка при добавлении игр в рейтинг")
        }
      }

      toast({
        title: "Рейтинг создан",
        description: "Рейтинг успешно создан со всеми выбранными играми.",
      })

      // Перенаправляем на страницу созданного рейтинга
      router.push(`/ratings/${ratingId}`)
      router.refresh()
    } catch (error: unknown) {
      console.error("Error creating rating:", error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Не удалось создать рейтинг"
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center">
        <Link href="/ratings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку рейтингов
          </Button>
        </Link>
        <h1 className="text-3xl font-heading ml-4">Создание нового рейтинга</h1>
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
                <Select value={clubId || undefined} onValueChange={setClubId}>
                  <SelectTrigger id="club">
                    <SelectValue placeholder="Выберите клуб (необязательно)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без привязки к клубу</SelectItem>
                    {clubsData?.clubs?.map((club) => (
                      <SelectItem key={club.id} value={String(club.id)}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="games">Игры для рейтинга *</Label>
                <div className="relative">
                  <MultiSelect
                    options={gameOptions}
                    selected={selectedGameIds}
                    onChange={setSelectedGameIds}
                    placeholder="Выберите игры для рейтинга"
                    searchPlaceholder="Поиск игр..."
                    emptyMessage="Игры не найдены"
                    disabled={isLoadingGamesData}
                  />
                  {isLoadingGamesData && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <Search className="h-4 w-4 animate-pulse text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedGameIds.length > 0 
                    ? `Выбрано игр: ${selectedGameIds.length}` 
                    : "Выберите игры, результаты которых будут учитываться в рейтинге"}
                </p>
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
            </div>

            <div className="flex justify-end space-x-2">
              <Link href="/ratings">
                <Button variant="outline" type="button">Отмена</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Создание..." : "Создать рейтинг"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
