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
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Pencil,
  Trash2,
  Award,
  ListPlus,
  User,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { useData } from "@/hooks/use-data"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Rating {
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

interface Game {
  id: number
  name?: string
  game_type: string
  created_at: string
  referee_name?: string
  result?: string
}

interface PlayerResult {
  id: number
  player_id: number
  points: number
  games_played: number
  wins: number
  civilian_wins: number
  mafia_wins: number
  don_games: number
  sheriff_games: number
  first_outs: number
  name?: string
  surname?: string
  nickname?: string
  photo_url?: string
  club_name?: string
}

export default function RatingDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [rating, setRating] = useState<Rating | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])

  const { data: responseData, isLoading, error } = useData<{
    success: boolean
    rating: Rating
    games: Game[]
    playerResults: PlayerResult[]
  }>(`/api/ratings/${params.id}`)

  useEffect(() => {
    if (responseData) {
      setRating(responseData.rating)
      setGames(responseData.games || [])
      setPlayerResults(responseData.playerResults || [])
    }
  }, [responseData])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/ratings/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete rating")
      }

      toast({
        title: "Рейтинг удален",
        description: "Рейтинг был успешно удален",
      })
      
      router.push("/ratings")
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting rating:", error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить рейтинг",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
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

  if (error || !rating) {
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
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/ratings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </Link>
          <h1 className="text-3xl font-heading ml-4">{rating.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/ratings/${rating.id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>
      </div>

      {/* Информация о рейтинге */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle>Информация о рейтинге</CardTitle>
                {rating.club_name && (
                  <CardDescription className="flex items-center mt-1">
                    <Building2 className="h-4 w-4 mr-1" />
                    {rating.club_name}
                  </CardDescription>
                )}
              </div>
              <Badge variant={rating.is_active ? "default" : "outline"}>
                {rating.is_active ? "Активный" : "Завершен"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rating.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Описание</h3>
                  <p>{rating.description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {rating.start_date && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Период</div>
                      <div>
                        {format(new Date(rating.start_date), 'dd.MM.yyyy')}
                        {rating.end_date && ` — ${format(new Date(rating.end_date), 'dd.MM.yyyy')}`}
                      </div>
                    </div>
                  </div>
                )}

                {rating.owner_name && (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Владелец</div>
                      <div>{rating.owner_name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Игр в рейтинге:</span>
                <span className="font-medium">{games.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Игроков в рейтинге:</span>
                <span className="font-medium">{playerResults.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Последнее обновление:</span>
                <span className="text-sm">
                  {format(new Date(rating.updated_at), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
              <div className="pt-4">
                <Link href={`/ratings/${rating.id}/games/add`}>
                  <Button className="w-full">
                    <ListPlus className="mr-2 h-4 w-4" />
                    Добавить игры
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Результаты и игры */}
      <Card>
        <CardHeader>
          <CardTitle>Результаты рейтинга</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results">
            <TabsList className="mb-4">
              <TabsTrigger value="results">Таблица результатов</TabsTrigger>
              <TabsTrigger value="games">Игры в рейтинге</TabsTrigger>
            </TabsList>
            
            <TabsContent value="results">
              {playerResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Результаты игроков в текущем рейтинге</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Место</TableHead>
                        <TableHead>Игрок</TableHead>
                        <TableHead className="text-right">Игры</TableHead>
                        <TableHead className="text-right">Победы</TableHead>
                        <TableHead className="text-right">Мирный</TableHead>
                        <TableHead className="text-right">Мафия</TableHead>
                        <TableHead className="text-right">Очки</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerResults.map((player, index) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={player.photo_url || `/api/players/${player.player_id}/avatar`} />
                                <AvatarFallback>
                                  {player.name?.[0]}{player.surname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <Link
                                href={`/players/${player.player_id}`}
                                className="hover:underline"
                              >
                                <span className="font-medium">{player.name} {player.surname}</span>
                                {player.nickname && (
                                  <span className="text-muted-foreground ml-1">@{player.nickname}</span>
                                )}
                                {player.club_name && (
                                  <span className="text-xs text-muted-foreground block">
                                    {player.club_name}
                                  </span>
                                )}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{player.games_played}</TableCell>
                          <TableCell className="text-right">{player.wins}</TableCell>
                          <TableCell className="text-right">{player.civilian_wins}</TableCell>
                          <TableCell className="text-right">{player.mafia_wins}</TableCell>
                          <TableCell className="text-right font-bold">{player.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Нет результатов</h3>
                  <p className="text-muted-foreground mb-6">
                    Добавьте игры в рейтинг, чтобы увидеть результаты игроков
                  </p>
                  <Link href={`/ratings/${rating.id}/games/add`}>
                    <Button>
                      <ListPlus className="mr-2 h-4 w-4" />
                      Добавить игры
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="games">
              {games.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Игры, включенные в текущий рейтинг</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Название игры</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Судья</TableHead>
                        <TableHead>Результат</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {games.map((game, index) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{game.name || `Игра #${game.id}`}</TableCell>
                          <TableCell>
                            {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)}
                          </TableCell>
                          <TableCell>{game.referee_name || "Не указан"}</TableCell>
                          <TableCell>
                            {game.result
                              ? game.result === "civilians_win" 
                                ? "Победа мирных" 
                                : "Победа мафии"
                              : "Не завершена"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(game.created_at), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            <Link href={`/games/${game.id}`}>
                              <Button variant="outline" size="sm">
                                Детали
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-2">Нет игр в рейтинге</h3>
                  <p className="text-muted-foreground mb-6">
                    Добавьте игры, чтобы увидеть их здесь и рассчитать рейтинг игроков
                  </p>
                  <Link href={`/ratings/${rating.id}/games/add`}>
                    <Button>
                      <ListPlus className="mr-2 h-4 w-4" />
                      Добавить игры
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Рейтинг и все связанные с ним данные будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
