"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Clock, 
  Award, 
  Warehouse, 
  Flag, 
  ThumbsUp, 
  Zap,
  Calendar,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { RoleStatsCard } from "./role-stats-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Интерфейсы для данных
interface UserData {
  id: number
  name?: string
  surname?: string
  nickname?: string
  image?: string
  country?: string
  club_name?: string
}

interface GameData {
  id: number
  date: string
  role: string
  result: string
  slot: number
  extra_points: number
  fouls: number
  game_type: string
}

interface RoleStats {
  games_played: number
  games_won: number
  winrate: number
  avg_additional_points: number
  total_fouls: number
}

interface OverallStats {
  total_games: number
  total_wins: number
  overall_winrate: number
  avg_additional_points: number
  total_fouls: number
}

interface PlayerStatsData {
  user: UserData
  stats: {
    overall: OverallStats
    civilian: RoleStats
    mafia: RoleStats
    sheriff: RoleStats
    don: RoleStats
  }
  recentGames: GameData[]
}

export function PlayerStatistics({ playerId }: { playerId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PlayerStatsData | null>(null)

  useEffect(() => {
    async function fetchPlayerStats() {
      try {
        setLoading(true)
        const response = await fetch(`/api/users/players/${playerId}/stats`)
        
        if (!response.ok) {
          throw new Error(`Ошибка при запросе: ${response.status}`)
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error("Ошибка при загрузке статистики:", err)
        setError(err instanceof Error ? err.message : "Неизвестная ошибка")
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlayerStats()
  }, [playerId])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd.MM.yyyy HH:mm', { locale: ru })
    } catch (e) {
      return dateString
    }
  }

  const getUserInitials = (user?: UserData) => {
    if (!user) return ""
    
    const initials = []
    if (user.name && user.name[0]) initials.push(user.name[0])
    if (user.surname && user.surname[0]) initials.push(user.surname[0])
    
    return initials.join("")
  }

  // Получение цвета для результата игры
  const getResultColor = (result: string) => {
    switch (result) {
      case 'civilians_win': 
        return 'text-green-500'
      case 'mafia_win': 
        return 'text-red-500'
      default: 
        return 'text-muted-foreground'
    }
  }

  // Получение текста для результата игры
  const getResultText = (result: string, role: string) => {
    const isWin = 
      (result === 'civilians_win' && (role === 'civilian' || role === 'sheriff')) ||
      (result === 'mafia_win' && (role === 'mafia' || role === 'don'))

    return isWin ? 'WIN' : 'LOSE'
  }

  // Получение иконки для роли в таблице
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'civilian':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-300">Мирный</Badge>
      case 'mafia':
        return <Badge variant="outline" className="bg-black/10 text-zinc-800 border-zinc-300">Мафия</Badge>
      case 'sheriff':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300">Шериф</Badge>
      case 'don':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-300">Дон</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-56 w-full sm:w-1/2" />
          <Skeleton className="h-56 w-full sm:w-1/2" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-56 w-full sm:w-1/2" />
          <Skeleton className="h-56 w-full sm:w-1/2" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-xl font-semibold text-red-600">Ошибка при загрузке статистики</div>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  if (!stats || !stats.user) {
    return (
      <div className="text-center py-8">
        <div className="text-xl font-semibold">Нет данных о статистике игрока</div>
        <p className="text-muted-foreground mt-2">Статистика пока недоступна или игрок не участвовал в играх</p>
      </div>
    )
  }

  const { user, stats: playerStats, recentGames } = stats

  // Получение текста для отображения винрейта в общей статистике
  const getWinrateText = (winrate: number) => {
    if (winrate >= 60) return "Отличный результат!"
    if (winrate >= 50) return "Хороший результат"
    if (winrate >= 40) return "Средний результат"
    return "Нужно больше стараться"
  }

  return (
    <div className="space-y-6">
      {/* Общая статистика - карточка игрока */}
      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-foreground p-4 text-primary-foreground">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground/30">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-xl">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-bold">
                {user.name} {user.surname}
              </h2>
              {user.nickname && (
                <div className="font-semibold text-primary-foreground/80">
                  @{user.nickname}
                </div>
              )}
              <div className="flex gap-3 mt-1">
                {user.country && (
                  <div className="flex items-center text-xs">
                    <Flag className="h-3 w-3 mr-1" />
                    {user.country}
                  </div>
                )}
                {user.club_name && (
                  <div className="flex items-center text-xs">
                    <Warehouse className="h-3 w-3 mr-1" />
                    {user.club_name}
                  </div>
                )}
              </div>
            </div>

            <div className="ml-auto text-right">
              <div className="text-sm opacity-80">ОБЩИЙ ВИНРЕЙТ</div>
              <div className="text-4xl font-bold">{playerStats.overall.overall_winrate || 0}%</div>
              <div className="text-xs">{getWinrateText(playerStats.overall.overall_winrate || 0)}</div>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 rounded-md bg-muted/50">
              <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
              <span className="text-xl font-bold">{playerStats.overall.total_games || 0}</span>
              <span className="text-xs text-muted-foreground">Всего игр</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-md bg-muted/50">
              <Award className="h-6 w-6 text-blue-500 mb-1" />
              <span className="text-xl font-bold">{playerStats.overall.total_wins || 0}</span>
              <span className="text-xs text-muted-foreground">Побед</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-md bg-muted/50">
              <BarChart3 className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-xl font-bold">1380</span>
              <span className="text-xs text-muted-foreground">Средний ELO</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-md bg-muted/50">
              <ThumbsUp className="h-6 w-6 text-pink-500 mb-1" />
              <span className="text-xl font-bold">23%</span>
              <span className="text-xs text-muted-foreground">Лучшие ходы</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика по ролям */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoleStatsCard
          role="civilian"
          winrate={playerStats.civilian.winrate || 0}
          gamesPlayed={playerStats.civilian.games_played || 0}
          gamesWon={playerStats.civilian.games_won || 0}
          avgAdditionalPoints={playerStats.civilian.avg_additional_points || 0}
          bestMovePercentage={15} // Заглушка
          firstBloodPercentage={10} // Заглушка
          roleImpactPercentage={75} // Заглушка
          eloRating={1200} // Заглушка
          totalFouls={playerStats.civilian.total_fouls || 0}
          totalBestMoves={3} // Заглушка
        />
        
        <RoleStatsCard
          role="mafia"
          winrate={playerStats.mafia.winrate || 0}
          gamesPlayed={playerStats.mafia.games_played || 0}
          gamesWon={playerStats.mafia.games_won || 0}
          avgAdditionalPoints={playerStats.mafia.avg_additional_points || 0}
          bestMovePercentage={20} // Заглушка
          firstBloodPercentage={5} // Заглушка
          roleImpactPercentage={65} // Заглушка
          eloRating={1350} // Заглушка
          totalFouls={playerStats.mafia.total_fouls || 0}
          totalBestMoves={2} // Заглушка
        />
        
        <RoleStatsCard
          role="sheriff"
          winrate={playerStats.sheriff.winrate || 0}
          gamesPlayed={playerStats.sheriff.games_played || 0}
          gamesWon={playerStats.sheriff.games_won || 0}
          avgAdditionalPoints={playerStats.sheriff.avg_additional_points || 0}
          bestMovePercentage={25} // Заглушка
          firstBloodPercentage={8} // Заглушка
          roleImpactPercentage={70} // Заглушка
          eloRating={1450} // Заглушка
          totalFouls={playerStats.sheriff.total_fouls || 0}
          totalBestMoves={4} // Заглушка
        />
        
        <RoleStatsCard
          role="don"
          winrate={playerStats.don.winrate || 0}
          gamesPlayed={playerStats.don.games_played || 0}
          gamesWon={playerStats.don.games_won || 0}
          avgAdditionalPoints={playerStats.don.avg_additional_points || 0}
          bestMovePercentage={30} // Заглушка
          firstBloodPercentage={3} // Заглушка
          roleImpactPercentage={80} // Заглушка
          eloRating={1550} // Заглушка
          totalFouls={playerStats.don.total_fouls || 0}
          totalBestMoves={5} // Заглушка
        />
      </div>

      {/* История игр */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            История игр
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentGames && recentGames.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Результат</TableHead>
                    <TableHead>Слот</TableHead>
                    <TableHead className="text-right">Доп. баллы</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentGames.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(game.date)}
                      </TableCell>
                      <TableCell>{game.game_type}</TableCell>
                      <TableCell>{getRoleIcon(game.role)}</TableCell>
                      <TableCell>
                        <Badge variant={getResultText(game.result, game.role) === 'WIN' ? 'default' : 'destructive'}>
                          {getResultText(game.result, game.role)}
                        </Badge>
                        
                      </TableCell>
                      <TableCell>{game.slot}</TableCell>
                      <TableCell className={cn(
                        "text-right",
                        game.extra_points > 0 ? "text-green-600" : 
                        game.extra_points < 0 ? "text-red-600" : ""
                      )}>
                        {game.extra_points > 0 ? '+' : ''}{game.extra_points}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Нет данных о недавних играх
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
