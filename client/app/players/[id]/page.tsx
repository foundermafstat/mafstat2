"use client"

import { useParams, useRouter } from "next/navigation"
import { useData } from "@/hooks/use-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Calendar, 
  MapPin, 
  Award, 
  Shield, 
  Mail, 
  Clock, 
  Cake,
  User2,
  UserRound,
  Globe,
  ChartBar
} from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { PlayerStatistics } from "./components/player-statistics"

// Интерфейс пользователя
interface UserData {
  id: string
  name?: string
  email?: string
  image?: string
  surname?: string
  nickname?: string
  country?: string
  bio?: string
  gender?: string
  birthday?: string | Date
  isTournamentJudge?: boolean
  isSideJudge?: boolean
  clubId?: number
  clubName?: string
  createdAt?: string
  updatedAt?: string
  role?: string
}

interface GameStats {
  totalGames?: number
  wins?: number
  losses?: number
  draws?: number
}

interface ApiResponse {
  user: UserData
  gamesStats: GameStats
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data, isLoading, error } = useData<ApiResponse>(`/api/users/players/${params.id}`)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      // Переход на профиль после диалога (фактическое удаление не реализовано)
      toast({
        title: "Действие не поддерживается",
        description: "Удаление профилей пользователей в данный момент не поддерживается.",
        variant: "destructive",
      })
      
      // Закрываем диалог
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Ошибка при попытке удаления пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить действие с профилем пользователя.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Форматирование даты в российском формате
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Не указано"
    
    try {
      const date = new Date(dateString)
      return format(date, 'dd MMMM yyyy', { locale: ru })
    } catch (e) {
      return "Некорректная дата"
    }
  }

  // Получение инициалов пользователя для аватара
  const getUserInitials = (user?: UserData) => {
    if (!user) return ""
    
    const initials = []
    if (user?.name && user.name[0]) initials.push(user.name[0])
    if (user?.surname && user.surname[0]) initials.push(user.surname[0])
    
    return initials.join("")
  }

  // Отображение гендера пользователя
  const getGenderDisplay = (gender?: string) => {
    switch (gender) {
      case "male": return "Мужской"
      case "female": return "Женский"
      case "other": return "Другой"
      default: return "Не указан"
    }
  }

  // Иконка пола в зависимости от гендера
  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case "male": return <User2 className="h-4 w-4 mr-2" />
      case "female": return <User className="h-4 w-4 mr-2" />
      default: return <UserRound className="h-4 w-4 mr-2" />
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-5">
          <div className="h-12 bg-muted rounded w-52"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Ошибка при загрузке данных</h2>
          <p className="text-muted-foreground">Не удалось загрузить профиль пользователя</p>
          <p className="text-destructive max-w-md mx-auto">{error}</p>
          <Button asChild>
            <Link href="/players">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку игроков
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!data || !data.user) {
    return (
      <div className="container py-10">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Пользователь не найден</h2>
          <p className="text-muted-foreground">Запрашиваемый профиль игрока не существует или был удален</p>
          <Button asChild>
            <Link href="/players">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку игроков
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const { user } = data
  const gamesStats = data.gamesStats

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        {/* Навигация и заголовок */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/players">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к списку игроков
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Профиль игрока</h1>
          </div>
        </div>

        {/* Содержимое профиля */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Карточка с основной информацией */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name} {user.surname}</CardTitle>
                {user.nickname && (
                  <CardDescription className="text-primary">
                    @{user.nickname}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.country && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.country}</span>
                  </div>
                )}
                {user.clubName && (
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{user.clubName}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  {getGenderIcon(user.gender)}
                  <span>{getGenderDisplay(user.gender)}</span>
                </div>
                {user.birthday && (
                  <div className="flex items-center text-sm">
                    <Cake className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatDate(user.birthday)}</span>
                  </div>
                )}
                {user.createdAt && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>В системе с {formatDate(user.createdAt)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                {user.isTournamentJudge && (
                  <Badge variant="secondary" className="w-full justify-start">
                    <Award className="h-3.5 w-3.5 mr-1.5" />
                    Судья турнира
                  </Badge>
                )}
                {user.isSideJudge && (
                  <Badge variant="outline" className="w-full justify-start">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    Боковой судья
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Вкладки с дополнительной информацией */}
          <div className="md:col-span-2">
            <Tabs defaultValue="games" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="games">
                  <ChartBar className="h-4 w-4 mr-2" />
                  Статистика
                </TabsTrigger>
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  Профиль
                </TabsTrigger>
                <TabsTrigger value="history">
                  <Clock className="h-4 w-4 mr-2" />
                  История игр
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>О игроке</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.bio ? (
                      <div className="whitespace-pre-line">{user.bio}</div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Пользователь пока не добавил информацию о себе
                      </div>
                    )}
                    
                    <div className="space-y-4 pt-4">
                      <h3 className="text-lg font-semibold">Достижения</h3>
                      {(user.isTournamentJudge || user.isSideJudge) ? (
                        <div className="space-y-3">
                          {user.isTournamentJudge && (
                            <div className="flex items-center p-2 bg-secondary/20 rounded-md">
                              <Award className="h-5 w-5 mr-2 text-secondary-foreground" />
                              <div>
                                <span className="font-medium">Судья турнира</span>
                                <p className="text-sm text-muted-foreground">
                                  Этот игрок имеет полномочия судьи турнира
                                </p>
                              </div>
                            </div>
                          )}
                          {user.isSideJudge && (
                            <div className="flex items-center p-2 bg-muted rounded-md">
                              <Shield className="h-5 w-5 mr-2" />
                              <div>
                                <span className="font-medium">Боковой судья</span>
                                <p className="text-sm text-muted-foreground">
                                  Этот игрок может выступать в качестве бокового судьи
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          У игрока пока нет особых достижений
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="games" className="mt-6">
                <PlayerStatistics playerId={params.id as string} />
              </TabsContent>
              
              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>История игр</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gamesStats?.totalGames ? (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          Всего сыграно игр: <span className="font-bold">{gamesStats.totalGames}</span>
                        </div>
                        <div className="text-center py-6">
                          <Link href="/games">
                            <Button>
                              <Globe className="mr-2 h-4 w-4" />
                              Перейти к истории игр
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        Нет данных о сыгранных играх
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Оно навсегда удалит профиль пользователя и всю связанную информацию.
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
