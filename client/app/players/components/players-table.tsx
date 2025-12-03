"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  ArrowUpDown,
  Warehouse,
  Flag
} from "lucide-react"
import Link from "next/link"

// Интерфейс для данных статистики игрока
export interface PlayerStats {
  id: string
  name: string | null
  surname: string | null
  nickname: string | null
  email: string
  image: string | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  role: string
  country: string | null
  birthday: Date | null
  gender: string | null
  club_id: number | null
  club_name: string | null
  club_city: string | null
  club_country: string | null
  total_games: number
  civ_win_rate: string
  mafia_win_rate: string
  sheriff_win_rate: string
  don_win_rate: string
  avg_additional_points: string
  total_fouls: number
}

interface PlayersTableProps {
  initialPlayers: PlayerStats[]
  clubId?: number | null
}

export function PlayersTable({ initialPlayers, clubId }: PlayersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof PlayerStats>("name")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Фильтрация игроков на основе поискового запроса
  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return initialPlayers;
    
    const term = searchTerm.toLowerCase()
    return initialPlayers.filter(player => {
      const fullName = `${player.name || ''} ${player.surname || ''}`.toLowerCase()
      const nickname = player.nickname?.toLowerCase() || ''
      return (
        fullName.includes(term) ||
        nickname.includes(term) ||
        player.email?.toLowerCase().includes(term) ||
        (player.club_name?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [initialPlayers, searchTerm])
  
  // Сортируем игроков
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredPlayers, sortField, sortDirection])
  
  // Функция для сортировки по колонке
  const handleSort = (field: keyof PlayerStats) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Находим информацию о выбранном клубе
  const selectedClub = useMemo(() => {
    if (!clubId) return null;
    const player = initialPlayers.find(p => p.club_id === clubId);
    if (!player) return null;
    
    return {
      id: clubId,
      name: player.club_name || '',
      city: player.club_city,
      country: player.club_country
    };
  }, [clubId, initialPlayers]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по имени, фамилии, никнейму или email..."
            className="w-full bg-background pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {selectedClub && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{selectedClub.name}</span>
            {selectedClub.city && (
              <span className="text-muted-foreground">({selectedClub.city})</span>
            )}
          </div>
        )}
      </div>

      {sortedPlayers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'Игроки не найдены' : 'Нет данных об игроках'}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    Игрок
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('club_name')}>
                  <div className="flex items-center">
                    Клуб
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Страна</TableHead>
                <TableHead className="text-right">Игр</TableHead>
                <TableHead className="text-right">Гор. мирных</TableHead>
                <TableHead className="text-right">Гор. мафии</TableHead>
                <TableHead className="text-right">Гор. шерифа</TableHead>
                <TableHead className="text-right">Гор. дона</TableHead>
                <TableHead className="text-right">Ср. доп. очки</TableHead>
                <TableHead className="text-right">Фолов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.image || ''} alt={`${player.name} ${player.surname}`} />
                        <AvatarFallback>
                          {player.name?.[0]}{player.surname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {player.name} {player.surname}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {player.nickname}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {player.club_name || (
                      <span className="text-muted-foreground">Без клуба</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.country && (
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-1" />
                        {player.country}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.total_games || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.civ_win_rate || '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.mafia_win_rate || '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.sheriff_win_rate || '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.don_win_rate || '0%'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.avg_additional_points || '0'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.total_fouls || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
