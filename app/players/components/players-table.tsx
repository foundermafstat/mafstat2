"use client"

import { useState, useEffect } from "react"
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
interface PlayerStats {
  id: string
  name?: string
  surname?: string
  nickname?: string
  image?: string
  country?: string
  club_name?: string
  club_id?: number
  total_games: number
  civ_win_rate: string
  mafia_win_rate: string
  sheriff_win_rate: string
  don_win_rate: string
  avg_additional_points: string
  total_fouls: number
}

export function PlayersTable({ initialPlayers }: { initialPlayers: PlayerStats[] }) {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerStats[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof PlayerStats>("total_games")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных при первом рендере
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        const response = await fetch('/api/players/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch player statistics')
        }
        const data = await response.json()
        setPlayers(data)
        setFilteredPlayers(data)
      } catch (error) {
        console.error("Error fetching player stats:", error)
        // Если API недоступен, используем initialPlayers
        setPlayers(initialPlayers)
        setFilteredPlayers(initialPlayers)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayerStats()
  }, [initialPlayers])

  // Функция поиска по имени, фамилии, никнейму или стране
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredPlayers(players)
    } else {
      const filtered = players.filter(player => 
        (player.name?.toLowerCase().includes(query) || false) ||
        (player.surname?.toLowerCase().includes(query) || false) ||
        (player.nickname?.toLowerCase().includes(query) || false) ||
        (player.country?.toLowerCase().includes(query) || false) ||
        (player.club_name?.toLowerCase().includes(query) || false)
      )
      setFilteredPlayers(filtered)
    }
  }

  // Функция сортировки
  const handleSort = (field: keyof PlayerStats) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
    
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
      // Особая обработка для числовых полей
      if (
        field === 'total_games' || 
        field === 'total_fouls'
      ) {
        return newDirection === 'asc' 
          ? Number(a[field]) - Number(b[field])
          : Number(b[field]) - Number(a[field])
      }
      
      // Для процентных значений (строки с числами)
      if (
        field === 'civ_win_rate' || 
        field === 'mafia_win_rate' || 
        field === 'sheriff_win_rate' || 
        field === 'don_win_rate' ||
        field === 'avg_additional_points'
      ) {
        return newDirection === 'asc'
          ? Number.parseFloat(a[field]) - Number.parseFloat(b[field])
          : Number.parseFloat(b[field]) - Number.parseFloat(a[field])
      }
      
      // Для текстовых полей
      const valueA = String(a[field] || '').toLowerCase()
      const valueB = String(b[field] || '').toLowerCase()
      
      return newDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA)
    })
    
    setFilteredPlayers(sortedPlayers)
  }

  // Получение класса для ячейки процента побед
  const getWinRateClass = (rate: string) => {
    const percentage = Number.parseFloat(rate)
    if (percentage >= 60) return "text-green-600 font-semibold"
    if (percentage >= 50) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }
  
  // Загрузка данных
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2">Загрузка статистики игроков...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Поисковая строка */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по имени, фамилии, никнейму, стране или клубу..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="text-center py-10">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Игроки не найдены</h2>
              <p className="text-muted-foreground mb-6">
                По запросу "{searchQuery}" ничего не найдено
              </p>
              <Button onClick={() => {setSearchQuery(""); setFilteredPlayers(players)}}>
                Сбросить поиск
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Игроки не найдены</h2>
              <p className="text-muted-foreground mb-6">В системе пока нет зарегистрированных игроков</p>
              <Link href="/profile">
                <Button>Создать профиль</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="min-w-[220px]">Игрок</TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('club_name')}
                    className="flex items-center p-0 hover:bg-transparent"
                  >
                    Клуб <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('total_games')}
                    className="flex items-center p-0 hover:bg-transparent"
                  >
                    Игр <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('civ_win_rate')}
                    className="flex items-center p-0 hover:bg-transparent w-[90px]"
                  >
                    Мир, % <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('mafia_win_rate')}
                    className="flex items-center p-0 hover:bg-transparent w-[95px]"
                  >
                    Мафия, % <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('sheriff_win_rate')}
                    className="flex items-center p-0 hover:bg-transparent w-[95px]"
                  >
                    Шериф, % <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('don_win_rate')}
                    className="flex items-center p-0 hover:bg-transparent w-[85px]"
                  >
                    Дон, % <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('avg_additional_points')}
                    className="flex items-center p-0 hover:bg-transparent w-[85px]"
                  >
                    Доп. <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('total_fouls')}
                    className="flex items-center p-0 hover:bg-transparent"
                  >
                    Фолы <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player, index) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <Link href={`/players/${player.id}`} className="hover:underline">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {player.name?.[0] || ""}
                            {player.surname?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {player.name} {player.surname}
                          </div>
                          {player.nickname && (
                            <div className="text-xs text-primary">@{player.nickname}</div>
                          )}
                          {player.country && (
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <Flag className="h-3 w-3 mr-1" />
                              {player.country}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {player.club_name ? (
                      <div className="flex items-center space-x-1">
                        <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{player.club_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {player.total_games || 0}
                  </TableCell>
                  <TableCell className={getWinRateClass(player.civ_win_rate)}>
                    {player.civ_win_rate || '0'}%
                  </TableCell>
                  <TableCell className={getWinRateClass(player.mafia_win_rate)}>
                    {player.mafia_win_rate || '0'}%
                  </TableCell>
                  <TableCell className={getWinRateClass(player.sheriff_win_rate)}>
                    {player.sheriff_win_rate || '0'}%
                  </TableCell>
                  <TableCell className={getWinRateClass(player.don_win_rate)}>
                    {player.don_win_rate || '0'}%
                  </TableCell>
                  <TableCell className={Number.parseFloat(player.avg_additional_points) > 0 
                    ? "text-green-600" 
                    : Number.parseFloat(player.avg_additional_points) < 0 
                      ? "text-red-600" 
                      : ""}>
                    {player.avg_additional_points || '0'}
                  </TableCell>
                  <TableCell className={player.total_fouls > 3 ? "text-red-600 font-semibold" : ""}>
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
