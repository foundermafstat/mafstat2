"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PlusCircle, Calendar, Users, Search, Trophy, ThumbsDown, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Интерфейс игрока
interface GamePlayer {
  id: number
  name: string
  surname: string
  nickname?: string
  image?: string
  role: string
  slot: number
  fouls: number
  additional_points: number
}

interface Game {
  id: string
  name?: string            // Название игры
  date: string
  time?: string
  location?: string
  table_count?: number
  player_count?: number
  judge_name?: string
  description?: string
  club_name?: string
  created_at?: string
  updated_at?: string
  game_type?: string      // Тип игры
  result?: string         // Результат игры
  mafia_count?: number    // Количество мафии
  civilian_count?: number // Количество мирных
  players?: GamePlayer[]  // Игроки в игре
}

export function SearchForm({ initialGames }: { initialGames: Game[] }) {
  const [games] = useState<Game[]>(initialGames)
  const [filteredGames, setFilteredGames] = useState<Game[]>(initialGames)
  const [searchQuery, setSearchQuery] = useState("")

  // Функция поиска игр
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredGames(games)
    } else {
      const filtered = games.filter(game => 
        (game.location?.toLowerCase().includes(query) || false) ||
        (game.club_name?.toLowerCase().includes(query) || false) ||
        (game.judge_name?.toLowerCase().includes(query) || false) ||
        (game.description?.toLowerCase().includes(query) || false)
      )
      setFilteredGames(filtered)
    }
  }

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU')
    } catch {
      return dateString
    }
  }

  return (
    <>
      {/* Поисковая строка */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по месту, клубу, судье или описанию..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-10">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Игры не найдены</h2>
              <p className="text-muted-foreground mb-6">
                По запросу "{searchQuery}" ничего не найдено
              </p>
              <Button onClick={() => {setSearchQuery(""); setFilteredGames(games)}}>
                Сбросить поиск
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Нет игр</h2>
              <p className="text-muted-foreground mb-6">Начните с создания вашей первой игры</p>
              <Link href="/games/create">
                <Button>Создать игру</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <Card key={game.id} className="overflow-hidden hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-col">
                  {/* Показываем название игры или стандартное название */}
                  <span className="font-bold text-lg">
                    {game.name || `Игра #${game.id}`}
                  </span>
                  <div className="flex items-center mt-1 text-sm font-normal">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatDate(game.date)}
                    {game.time && `, ${game.time}`}
                  </div>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {game.location || "Место не указано"}
                </div>
              </CardHeader>
              
              {/* Добавляем цветную полосу для типа игры */}
              {game.game_type && (
                <div className="px-6 py-1 bg-slate-100 text-xs font-medium uppercase tracking-wider">
                  {game.game_type}
                </div>
              )}
              
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Информация об игроках */}
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {game.player_count || 0} игроков
                          {game.players && game.players.length > 0 && (
                            <span className="text-xs ml-1 text-muted-foreground">
                              ({game.mafia_count || 0} мафия / {game.civilian_count || 0} мирные)
                            </span>
                          )}
                        </span>
                      </div>
                      {/* Клуб */}
                      {game.club_name && (
                        <div className="text-sm text-muted-foreground">
                          Клуб: {game.club_name}
                        </div>
                      )}
                    </div>
                    
                    {/* Структурированный список игроков, если они есть */}
                    {game.players && game.players.length > 0 && game.result && (
                      <div className="rounded-md bg-muted/30 overflow-hidden">
                        {/* Заголовок с результатом игры */}
                        <div className="px-3 py-2 text-xs font-medium bg-muted/50 flex justify-between">
                          <span>Игроки ({game.players.length})</span>
                        </div>
                        
                        {/* Определяем победителей и проигравших */}
                        {(() => {
                          // Фильтруем игроков по командам
                          const winners = game.result === 'civilians_win' 
                            ? game.players.filter(p => p.role === 'civilian' || p.role === 'sheriff')
                            : game.result === 'mafia_win'
                              ? game.players.filter(p => p.role === 'mafia' || p.role === 'don')
                              : [];
                              
                          const losers = game.result === 'civilians_win' 
                            ? game.players.filter(p => p.role === 'mafia' || p.role === 'don')
                            : game.result === 'mafia_win'
                              ? game.players.filter(p => p.role === 'civilian' || p.role === 'sheriff')
                              : [];
                          
                          return (
                            <div className="p-2 space-y-2">
                              {/* Команда победителей */}
                              {winners.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-green-600">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    <span>Победители</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {winners.map((player) => (
                                      <Link 
                                        href={`/players/${player.id}`} 
                                        key={`${game.id}-win-${player.id}`}
                                        className="group"
                                      >
                                        <div className="flex flex-col items-center space-y-1">
                                          <Avatar className="h-8 w-8 border-2 border-green-100 group-hover:border-green-300 transition-all">
                                            <AvatarImage 
                                              src={player.image || `/api/players/${player.id}/avatar`} 
                                              alt={player.name} 
                                            />
                                            <AvatarFallback className="text-[10px] bg-green-50">
                                              {player.name.substring(0, 1)}{player.surname?.substring(0, 1)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px]">
                                            {player.role === 'sheriff' ? 'ШЕР' : 
                                             player.role === 'don' ? 'ДОН' : 
                                             player.role === 'mafia' ? 'МАФ' : 'МИР'}
                                          </Badge>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {winners.length > 0 && losers.length > 0 && (
                                <Separator className="my-1" />
                              )}
                              
                              {/* Команда проигравших */}
                              {losers.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs font-medium text-red-500">
                                    <ThumbsDown className="h-3 w-3 mr-1" />
                                    <span>Проигравшие</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {losers.map((player) => (
                                      <Link 
                                        href={`/players/${player.id}`} 
                                        key={`${game.id}-lose-${player.id}`}
                                        className="group"
                                      >
                                        <div className="flex flex-col items-center space-y-1">
                                          <Avatar className="h-8 w-8 border-2 border-red-100 group-hover:border-red-300 transition-all">
                                            <AvatarImage 
                                              src={player.image || `/api/players/${player.id}/avatar`} 
                                              alt={player.name} 
                                            />
                                            <AvatarFallback className="text-[10px] bg-red-50">
                                              {player.name.substring(0, 1)}{player.surname?.substring(0, 1)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px]">
                                            {player.role === 'sheriff' ? 'ШЕР' : 
                                             player.role === 'don' ? 'ДОН' : 
                                             player.role === 'mafia' ? 'МАФ' : 'МИР'}
                                          </Badge>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()} 
                      </div>
                    )}
                    
                    {/* Отображаем игроков для игр без результата */}
                    {game.players && game.players.length > 0 && !game.result && (
                      <div className="bg-muted/40 rounded-md p-2 text-xs">
                        <div className="flex items-center text-xs font-medium mb-1">
                          <User className="h-3 w-3 mr-1" />
                          <span>Участники</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {game.players
                            .sort((a, b) => a.slot - b.slot)
                            .slice(0, 8)
                            .map((player) => (
                              <span 
                                key={`${game.id}-${player.id}`} 
                                className={`inline-flex items-center rounded-full p-1 pr-2 ${player.role === 'mafia' || player.role === 'don' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}
                              >
                                <span className="rounded-full bg-white w-4 h-4 flex items-center justify-center mr-1 text-[10px] font-bold">
                                  {player.slot}
                                </span>
                                {player.nickname || `${player.name.substring(0, 1)}. ${player.surname}`}
                              </span>
                          ))}
                          {game.players.length > 8 && (
                            <span className="italic">+{game.players.length - 8} еще</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Добавляем результат игры */}
                  {game.result && (
                    <div className={`text-sm font-medium p-2 rounded-md 
                      ${game.result === 'civilians_win' ? 'bg-blue-50 text-blue-700' : 
                        game.result === 'mafia_win' ? 'bg-red-50 text-red-700' : 
                        'bg-gray-50 text-gray-600'}`}>
                      Результат: {game.result === 'civilians_win' ? 'Победа мирных' : 
                               game.result === 'mafia_win' ? 'Победа мафии' : 
                               game.result === 'draw' ? 'Ничья' : game.result}
                    </div>
                  )}

                  {game.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{game.description}</p>
                  )}

                  <div className="flex space-x-2 pt-1">
                    <Link href={`/games/${game.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Просмотр
                      </Button>
                    </Link>
                    <Link href={`/games/${game.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
