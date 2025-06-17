"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { Club } from "@/types/game"
import { Building2, PlusCircle, Globe, Users, GamepadIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchForm({ initialClubs }: { initialClubs: Club[] }) {
  const [clubs] = useState<Club[]>(initialClubs)
  const [filteredClubs, setFilteredClubs] = useState<Club[]>(initialClubs)
  const [searchQuery, setSearchQuery] = useState("")

  // Функция поиска по названию клуба
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredClubs(clubs)
    } else {
      const filtered = clubs.filter(club => 
        club.name.toLowerCase().includes(query)
      )
      setFilteredClubs(filtered)
    }
  }

  return (
    <>
      {/* Поисковая строка */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по названию клуба..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {filteredClubs.length === 0 ? (
        <div className="text-center py-10">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Клубы не найдены</h2>
              <p className="text-muted-foreground mb-6">
                По запросу "{searchQuery}" ничего не найдено
              </p>
              <Button onClick={() => {setSearchQuery(""); setFilteredClubs(clubs)}}>
                Сбросить поиск
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
                  {club.federation_name || "Нет федерации"}
                </div>
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
      )}
    </>
  )
}
