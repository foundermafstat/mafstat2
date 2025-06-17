"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Trophy, Award, Target, Zap, User, UserRound, ThumbsUp } from "lucide-react"

interface RoleStatsCardProps {
  role: "civilian" | "mafia" | "sheriff" | "don"
  winrate: number
  gamesPlayed: number
  gamesWon: number
  avgAdditionalPoints: number
  bestMovePercentage?: number
  firstBloodPercentage?: number
  roleImpactPercentage?: number
  eloRating?: number
  totalFouls?: number
  totalBestMoves?: number
  className?: string
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "civilian":
      return "from-red-600 to-red-700 border-red-500/50"
    case "mafia":
      return "from-black to-zinc-800 border-zinc-700/50"
    case "sheriff":
      return "from-blue-600 to-blue-700 border-blue-500/50"
    case "don":
      return "from-purple-600 to-purple-700 border-purple-500/50"
    default:
      return "from-gray-600 to-gray-700 border-gray-500/50"
  }
}

export function getRoleName(role: string): string {
  switch (role) {
    case "civilian": return "МИРНЫЙ"
    case "mafia": return "МАФИЯ"
    case "sheriff": return "ШЕРИФ"
    case "don": return "ДОН"
    default: return role.toUpperCase()
  }
}

export function getRoleIcon(role: string) {
  switch (role) {
    case "civilian": return <User className="h-10 w-10" />
    case "mafia": return <UserRound className="h-10 w-10" />
    case "sheriff": return <Badge className="h-10 w-10" />
    case "don": return <Award className="h-10 w-10" />
    default: return <User className="h-10 w-10" />
  }
}

export function RoleStatsCard({
  role,
  winrate,
  gamesPlayed,
  gamesWon,
  avgAdditionalPoints,
  bestMovePercentage = 0,
  firstBloodPercentage = 0,
  roleImpactPercentage = 0,
  eloRating = 0,
  totalFouls = 0,
  totalBestMoves = 0,
  className
}: RoleStatsCardProps) {
  const roleColor = getRoleColor(role)
  const roleName = getRoleName(role)
  const roleIcon = getRoleIcon(role)
  
  // Winrate display with proper formatting
  // Преобразуем winrate к числовому типу для безопасного использования toFixed()
  const numericWinrate = typeof winrate === 'number' ? winrate : Number(winrate);
  const formattedWinrate = Number.isNaN(numericWinrate) ? "0.00" : numericWinrate.toFixed(2)

  return (
    <Card className={cn(
      "overflow-hidden border-2 transition-all relative",
      roleColor,
      className
    )}>
      {/* Header */}
      <div className={cn(
        "bg-gradient-to-r w-full p-4 text-white flex justify-between items-center",
        roleColor
      )}>
        <div className="flex flex-col">
          <span className="text-sm font-semibold opacity-80">{role === "civilian" ? "ГРАЖДАНСКИЙ ВИНРЕЙТ" : `${role.toUpperCase()} ВИНРЕЙТ`}</span>
          <div className="text-4xl font-bold">{formattedWinrate}%</div>
          <span className="text-xs opacity-80">ВСЕ ИГРЫ/ПОБЕДЫ</span>
          <div className="text-sm font-medium">{gamesPlayed}/{gamesWon}</div>
        </div>
        <div className="flex flex-col items-center">
          {roleIcon}
          <span className="font-bold mt-1">{roleName}</span>
        </div>
      </div>

      <CardContent className="p-4 grid gap-2 text-sm bg-card">
        {/* Основные показатели */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <Trophy className="h-5 w-5 text-yellow-500 mb-1" />
            <span className="text-lg font-bold">{gamesPlayed}</span>
            <span className="text-xs text-muted-foreground text-center">Игр</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <Award className="h-5 w-5 text-primary mb-1" />
            <span className="text-lg font-bold">{Number(avgAdditionalPoints).toFixed(2)}</span>
            <span className="text-xs text-muted-foreground text-center">Доп. баллы</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <Target className="h-5 w-5 text-red-500 mb-1" />
            <span className="text-lg font-bold">{firstBloodPercentage}%</span>
            <span className="text-xs text-muted-foreground text-center">Первая кровь</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Дополнительная статистика */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-yellow-400 mb-1" />
            <span className="text-lg font-bold">{roleImpactPercentage}%</span>
            <span className="text-xs text-muted-foreground text-center">Влияние</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <ThumbsUp className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-lg font-bold">{totalBestMoves || 0}</span>
            <span className="text-xs text-muted-foreground text-center">Лучшие ходы</span>
          </div>
          
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <span className="font-bold text-lg mb-1">ELO</span>
            <span className="text-lg font-bold">{Math.round(eloRating)}</span>
            <span className="text-xs text-muted-foreground text-center">Рейтинг</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
