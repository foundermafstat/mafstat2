"use client"

import { useParams, useRouter } from "next/navigation"
import { useData } from "@/hooks/use-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Globe, MapPin, LinkIcon, Building2, Users, Pencil, Trash2, Clock, UserIcon, Trophy } from "lucide-react"
import { useState } from "react"
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
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Интерфейс федерации
interface Federation {
  id: number
  name: string
  description?: string
  url?: string
  country?: string
  city?: string
  additional_points_conditions?: Array<{condition?: string, points: number}>
  created_at?: string
  updated_at?: string
  clubs?: Array<Club>
}

// Интерфейс клуба
interface Club {
  id: number
  name: string
  description?: string
  player_count?: number
  game_count?: number
  federation_id?: number
}

// Интерфейс игрока с дополнительной статистикой
interface FederationPlayer {
  id: number
  name: string
  surname: string
  nickname?: string
  club_id?: number
  club_name?: string
  country?: string
  photo_url?: string
  is_tournament_judge: boolean
  is_side_judge: boolean
  created_at: string
  updated_at: string
  stats?: {
    total_games: number
    total_wins: number
    overall_winrate: number
  }
  // Дополнительные поля для совместимости с ответом API
  total_games?: number
  total_wins?: number
  overall_winrate?: number
}

export default function FederationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: federation, isLoading, error } = useData<Federation>(`/api/federations/${params.id}`)
  const { data: players, isLoading: isPlayersLoading, error: playersError } = useData<FederationPlayer[]>(`/api/federations/${params.id}/players`)
  
  // Отладка для проверки результатов запроса игроков
  console.log('Players loading:', isPlayersLoading)
  console.log('Players error:', playersError)
  console.log('Players data:', players)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Функция для форматирования даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Не указано"
    
    try {
      const date = new Date(dateString)
      return format(date, 'dd MMMM yyyy', { locale: ru })
    } catch (e) {
      return "Некорректная дата"
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/federations/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить федерацию")
      }

      toast({
        title: "Федерация удалена",
        description: "Федерация была успешно удалена.",
      })

      router.push("/federations")
    } catch (error) {
      console.error("Ошибка при удалении федерации:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить федерацию. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !federation) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Ошибка загрузки федерации</h2>
            <p className="text-red-500 mb-6">{error?.message || "Федерация не найдена"}</p>
            <Link href="/federations">
              <Button>Вернуться к списку федераций</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/federations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к федерациям
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-4">{federation.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/federations/${federation.id}/edit`}>
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

        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Информация о федерации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Название</div>
                    <div>{federation.name}</div>
                  </div>
                </div>

                {(federation.country || federation.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Расположение</div>
                      <div>
                        {federation.country && federation.city
                          ? `${federation.city}, ${federation.country}`
                          : federation.city || federation.country || "Не указано"}
                      </div>
                    </div>
                  </div>
                )}

                {federation.url && (
                  <div className="flex items-start space-x-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Веб-сайт</div>
                      <a 
                        href={federation.url.startsWith('http') ? federation.url : `https://${federation.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {federation.url}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Дата создания</div>
                    <div>{formatDate(federation.created_at)}</div>
                  </div>
                </div>
              </div>

              {federation.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Описание</h3>
                  <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                    {federation.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="players">
                <UserIcon className="mr-2 h-4 w-4" />
                Игроки
              </TabsTrigger>
              <TabsTrigger value="clubs">
                <Users className="mr-2 h-4 w-4" />
                Клубы
              </TabsTrigger>
              <TabsTrigger value="points">
                <Trophy className="mr-2 h-4 w-4" />
                Доп. очки
              </TabsTrigger>
            </TabsList>

            {/* Вкладка с игроками федерации */}
            <TabsContent value="players" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Игроки федерации</CardTitle>
                  <CardDescription>
                    {isPlayersLoading 
                      ? "Загрузка игроков..." 
                      : players && players.length > 0 
                        ? `Всего игроков: ${players.length}` 
                        : "В федерации пока нет игроков"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isPlayersLoading ? (
                    <div className="space-y-4">
                      {/* Используем UUID вместо индексов для ключей */}
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={`skeleton-${index}-${Date.now()}-${Math.random()}`} className="flex justify-between items-center p-4 border rounded-md animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-muted" />
                            <div className="space-y-2">
                              <div className="h-4 w-40 bg-muted rounded" />
                              <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                          </div>
                          <div className="h-8 w-16 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : players && players.length > 0 ? (
                    <div className="space-y-4">
                      {players.map((player) => (
                        <div 
                          key={player.id} 
                          className="flex justify-between items-center p-4 border rounded-md hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage 
                                src={player.photo_url || `/api/players/${player.id}/avatar`} 
                                alt={`${player.name} ${player.surname}`} 
                              />
                              <AvatarFallback>{`${player.name.charAt(0)}${player.surname.charAt(0)}`}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{player.name} {player.surname}</div>
                              {player.nickname && <div className="text-sm text-muted-foreground">@{player.nickname}</div>}
                              {player.club_name && <div className="text-xs text-muted-foreground">{player.club_name}</div>}
                              <div className="flex space-x-2 mt-1 text-xs text-muted-foreground">
                                <span>Игры: {player.stats?.total_games || player.total_games || 0}</span>
                                <span>Победы: {player.stats?.total_wins || player.total_wins || 0}</span>
                                <span>Винрейт: {player.stats?.overall_winrate || player.overall_winrate || 0}%</span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/players/${player.id}`}>
                            <Button variant="outline" size="sm">
                              Просмотр
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      В этой федерации пока нет игроков
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка с клубами федерации */}
            <TabsContent value="clubs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Клубы федерации</CardTitle>
                  <CardDescription>
                    {federation.clubs && federation.clubs.length > 0 
                      ? `Всего клубов: ${federation.clubs.length}` 
                      : "В федерации пока нет клубов"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {federation.clubs && federation.clubs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {federation.clubs.map((club) => (
                        <Card key={club.id} className="hover:bg-muted/30 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{club.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {club.description && (
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {club.description}
                                </div>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>{club.player_count || 0} игроков</span>
                                </div>
                                {club.game_count !== undefined && (
                                  <div className="flex items-center">
                                    <Trophy className="h-4 w-4 mr-1 text-muted-foreground" />
                                    <span>{club.game_count} игр</span>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2">
                                <Link href={`/clubs/${club.id}`}>
                                  <Button variant="outline" size="sm" className="w-full">
                                    Подробнее
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      В этой федерации пока нет клубов
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка с системой дополнительных очков */}
            <TabsContent value="points" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Система дополнительных очков</CardTitle>
                </CardHeader>
                <CardContent>
                  {federation.additional_points_conditions && federation.additional_points_conditions.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Федерация использует следующую систему дополнительных очков:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Условие</th>
                              <th className="text-right py-2 px-4">Очки</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(federation.additional_points_conditions) ? (
                              federation.additional_points_conditions.map((condition, index) => (
                                <tr key={`condition-${index}-${condition.points}`} className="border-b">
                                  <td className="py-2 px-4">{condition.condition || "Не указано"}</td>
                                  <td className="text-right py-2 px-4">{condition.points}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="border-b">
                                <td colSpan={2} className="py-2 px-4 text-center text-muted-foreground">
                                  Некорректный формат данных
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Система дополнительных очков не определена
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Федерация будет удалена, и ее связь со всеми клубами будет разорвана.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
