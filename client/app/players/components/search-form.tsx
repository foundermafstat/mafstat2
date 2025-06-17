"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { PlusCircle, Award, Search, Shield, Flag, Warehouse } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { PlayerStats } from "./players-table"

export function SearchForm({ initialPlayers }: { initialPlayers: PlayerStats[] }) {
  const [players] = useState<PlayerStats[]>(initialPlayers)
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerStats[]>(initialPlayers)
  const [searchQuery, setSearchQuery] = useState("")

  // Функция поиска по имени, фамилии или никнейму
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
        (player.country?.toLowerCase().includes(query) || false)
      )
      setFilteredPlayers(filtered)
    }
  }

  // Функция для форматирования даты
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Не указано"
    
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "Некорректная дата"
    
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <>
      {/* Поисковая строка */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по имени, фамилии, никнейму или стране..."
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={player.image || undefined} />
                    <AvatarFallback className="text-lg">
                      {player.name?.[0] || ""}
                      {player.surname?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-bold text-lg">
                        {player.name} {player.surname}
                      </h3>
                      {player.nickname && (
                        <p className="text-sm font-medium text-primary">@{player.nickname}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {player.isTournamentJudge && (
                        <Badge variant="secondary" className="hover:bg-secondary/80">
                          <Award className="h-3 w-3 mr-1" />
                          Судья турнира
                        </Badge>
                      )}
                      {player.isSideJudge && (
                        <Badge variant="outline" className="hover:bg-muted">
                          <Shield className="h-3 w-3 mr-1" />
                          Боковой судья
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      {player.country && (
                        <div className="flex items-center">
                          <Flag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>{player.country}</span>
                        </div>
                      )}
                      {player.clubName && (
                        <div className="flex items-center">
                          <Warehouse className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>{player.clubName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-1">
                      <Link href={`/players/${player.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Просмотр
                        </Button>
                      </Link>
                    </div>
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
