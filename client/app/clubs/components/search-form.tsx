"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { Club } from "@/types/game"
import { Building2, PlusCircle, Globe, Users, GamepadIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SearchForm({ initialClubs }: { initialClubs: Club[] }) {
  const [clubs] = useState<Club[]>(initialClubs)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFederation, setSelectedFederation] = useState<string>("all")

  // Получаем список уникальных федераций
  const federations = useMemo(() => {
    const fedSet = new Set<string>()
    clubs.forEach(club => {
      if (club.federation_name) {
        fedSet.add(club.federation_name)
      }
    })
    return Array.from(fedSet).sort()
  }, [clubs])

  // Фильтрация клубов
  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      const matchesSearch = !searchQuery || 
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFederation = selectedFederation === "all" || 
        club.federation_name === selectedFederation
      return matchesSearch && matchesFederation
    })
  }, [clubs, searchQuery, selectedFederation])

  // Функция поиска по названию клуба
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Функция фильтрации по федерации
  const handleFederationFilter = (value: string) => {
    setSelectedFederation(value)
  }

  return (
    <>
      {/* Фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Поисковая строка */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по названию клуба..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Фильтр по федерации */}
        <Select value={selectedFederation} onValueChange={handleFederationFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Все федерации" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все федерации</SelectItem>
            {federations.map((federation) => (
              <SelectItem key={federation} value={federation}>
                {federation}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredClubs.length === 0 ? (
        <div className="text-center py-10">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Клубы не найдены</h2>
              <p className="text-muted-foreground mb-6">
                По запросу "{searchQuery}" ничего не найдено
              </p>
              <Button onClick={() => {setSearchQuery(""); setSelectedFederation("all")}}>
                Сбросить фильтры
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Нет клубов</h2>
              <p className="text-muted-foreground mb-6">Начните с создания вашего первого клуба</p>
              <Link href="/clubs/create">
                <Button>Создать клуб</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            Найдено клубов: {filteredClubs.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <Card key={club.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  {club.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Globe className="mr-1 h-4 w-4" />
                  <span className="font-medium">
                    {club.federation_name || "Нет федерации"}
                  </span>
                </div>
                {(club.country || club.city) && (
                  <div className="text-xs text-muted-foreground">
                    {[club.city, club.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{club.player_count || 0} игроков</span>
                    </div>
                    <div className="flex items-center">
                      <GamepadIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{club.game_count || 0} игр</span>
                    </div>
                  </div>

                  {club.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
                  )}

                  {/* Список игроков */}
                  {club.players && club.players.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Игроки:</h4>
                      <div className="space-y-1">
                        {club.players.slice(0, 3).map((player) => (
                          <div key={player.id} className="text-xs text-muted-foreground">
                            {player.name} {player.surname}
                            {player.nickname && ` (${player.nickname})`}
                          </div>
                        ))}
                        {club.players.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            и еще {club.players.length - 3} игроков...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Link href={`/clubs/${club.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Просмотр
                      </Button>
                    </Link>
                    <Link href={`/clubs/${club.id}/edit`}>
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
        </>
      )}
    </>
  )
}
