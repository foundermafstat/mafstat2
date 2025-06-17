"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Trophy, User } from "lucide-react"
import type { Player } from "@/types/game"

interface FederationPlayerCardProps {
  player: Player & {
    stats?: {
      total_games?: number
      total_wins?: number
      overall_winrate?: number
    }
  }
}

export function FederationPlayerCard({ player }: FederationPlayerCardProps) {
  // Helper for avatar fallback text
  const getInitials = (name: string, surname: string) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase()
  }

  // Winrate color
  const getWinrateColor = (winrate?: number) => {
    if (!winrate) return "text-gray-500"
    if (winrate >= 70) return "text-green-600"
    if (winrate >= 50) return "text-blue-600"
    if (winrate >= 30) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <Link href={`/players/${player.id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarImage 
              src={player.photo_url || `/api/players/${player.id}/avatar`} 
              alt={`${player.name} ${player.surname}`} 
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(player.name, player.surname)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="font-medium truncate">{player.name} {player.surname}</div>
            {player.nickname && (
              <div className="text-sm text-muted-foreground truncate">
                {player.nickname}
              </div>
            )}
            {player.club_name && (
              <div className="text-xs text-muted-foreground truncate">
                {player.club_name}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground">Игры</div>
              <div className="font-medium">{player.stats?.total_games || 0}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground">Победы</div>
              <div className="font-medium">{player.stats?.total_wins || 0}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs text-muted-foreground">Винрейт</div>
              <div className={`font-medium ${getWinrateColor(player.stats?.overall_winrate)}`}>
                {player.stats?.overall_winrate ? `${player.stats.overall_winrate}%` : "–"}
              </div>
            </div>
          </div>
          {player.is_tournament_judge && (
            <Badge variant="outline" className="mt-2 w-full justify-center">
              <Trophy className="h-3 w-3 mr-1" /> Судья
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
