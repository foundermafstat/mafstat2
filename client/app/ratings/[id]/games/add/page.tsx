"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Filter, CalendarRange } from "lucide-react"
import { format } from "date-fns"
import { useData } from "@/hooks/use-data"

type Game = {
  id: number
  name?: string
  game_type: string
  referee_name?: string
  result?: string
  created_at: string
}

type Rating = {
  id: number
  name: string
}

export default function AddGamesToRatingPage() {
  const params = useParams()
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGames, setSelectedGames] = useState<number[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [rating, setRating] = useState<Rating | null>(null)

  // Загружаем информацию о рейтинге
  const { data: ratingData, isLoading: isRatingLoading } = useData<{
    success: boolean
    rating: Rating
  }>(`/api/ratings/${params.id}`)

  // Загружаем все доступные игры, которые можно добавить в рейтинг
  const { data: gamesData, isLoading: isGamesLoading } = useData<{
    success: boolean
    games: Game[]
  }>("/api/games")
  
  // Загружаем игры, уже добавленные в рейтинг
  const { data: ratingGamesData, isLoading: isRatingGamesLoading } = useData<{
    success: boolean
    games: Game[]
  }>(`/api/ratings/${params.id}/games`)

  useEffect(() => {
    if (ratingData?.rating) {
      setRating(ratingData.rating)
    }
  }, [ratingData])

  // Фильтруем игры, когда данные загружаются или меняется поисковый запрос
  useEffect(() => {
    if (gamesData?.games && ratingGamesData?.games) {
      // Получаем ID игр, уже добавленных в рейтинг
      const ratingGameIds = new Set(ratingGamesData.games.map(game => game.id))
      
      // Фильтруем игры, исключая те, которые уже в рейтинге
      // и применяя поисковый фильтр, если он есть
      let filtered = gamesData.games.filter(game => !ratingGameIds.has(game.id))
      
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        filtered = filtered.filter(game => {
          return (
            (game.name && game.name.toLowerCase().includes(lowerSearchTerm)) ||
            (game.referee_name && game.referee_name.toLowerCase().includes(lowerSearchTerm)) ||
            (`игра #${game.id}`.toLowerCase().includes(lowerSearchTerm))
          )
        })
      }
      
      // Сортируем по дате создания (от новых к старым)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setFilteredGames(filtered)
    }
  }, [gamesData, ratingGamesData, searchTerm])

  const handleSelectGame = (gameId: number) => {
    setSelectedGames(prevSelected => {
      if (prevSelected.includes(gameId)) {
        return prevSelected.filter(id => id !== gameId)
      } else {
        return [...prevSelected, gameId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedGames.length === filteredGames.length) {
      setSelectedGames([])
    } else {
      setSelectedGames(filteredGames.map(game => game.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedGames.length === 0) {
      toast({
        title: "Внимание",
        description: "Выберите хотя бы одну игру для добавления в рейтинг",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Добавляем каждую выбранную игру в рейтинг
      const results = await Promise.all(
        selectedGames.map(gameId =>
          fetch(`/api/ratings/${params.id}/games`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ game_id: gameId }),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to add game ${gameId}`)
            }
            return response.json()
          })
        )
      )

      toast({
        title: "Игры добавлены",
        description: `Выбранные игры успешно добавлены в рейтинг "${rating?.name}"`,
      })
      
      // Перенаправляем на страницу рейтинга
      router.push(`/ratings/${params.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error adding games to rating:", error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить игры в рейтинг",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = isRatingLoading || isGamesLoading || isRatingGamesLoading

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-12 w-full bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!rating) {
    return (
      <div className="container py-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">Рейтинг не найден</h2>
          <p className="text-red-500 mb-6">
            Не удалось загрузить информацию о рейтинге
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
        <h1 className="text-3xl font-heading ml-4">Добавление игр в рейтинг</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Рейтинг: {rating.name}</CardTitle>
          <CardDescription>
            Выберите игры, которые вы хотите добавить в этот рейтинг
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Панель поиска */}
          <div className="mb-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск игр..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              type="button" 
              onClick={handleSubmit}
              disabled={selectedGames.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Добавление..." : `Добавить ${selectedGames.length} игр в рейтинг`}
            </Button>
          </div>

          {/* Таблица с играми */}
          {filteredGames.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={
                          filteredGames.length > 0 && 
                          selectedGames.length === filteredGames.length
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Выбрать все"
                      />
                    </TableHead>
                    <TableHead className="w-12">ID</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Судья</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Результат</TableHead>
                    <TableHead className="text-right">Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow 
                      key={game.id} 
                      className={selectedGames.includes(game.id) ? "bg-muted/60" : ""}
                      onClick={() => handleSelectGame(game.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedGames.includes(game.id)}
                          onCheckedChange={() => handleSelectGame(game.id)}
                          aria-label={`Выбрать игру ${game.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{game.id}</TableCell>
                      <TableCell>{game.name || `Игра #${game.id}`}</TableCell>
                      <TableCell>{game.referee_name || "Не указан"}</TableCell>
                      <TableCell>
                        {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)}
                      </TableCell>
                      <TableCell>
                        {game.result ? (
                          <Badge variant={game.result === "civilians_win" ? "default" : "destructive"}>
                            {game.result === "civilians_win" ? "Мирные" : "Мафия"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Не завершена</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {format(new Date(game.created_at), "dd.MM.yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarRange className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Нет доступных игр</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? "По вашему запросу не найдено подходящих игр"
                  : "Все доступные игры уже добавлены в этот рейтинг"}
              </p>
              <div className="flex justify-center gap-4">
                <Link href={`/ratings/${params.id}`}>
                  <Button variant="outline">Вернуться к рейтингу</Button>
                </Link>
                <Link href="/games/create">
                  <Button>Создать новую игру</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
