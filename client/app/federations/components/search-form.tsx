"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { Federation } from "@/types/game"
import { Globe, PlusCircle, Building2, Users, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchForm({ initialFederations }: { initialFederations: Federation[] }) {
  const [federations] = useState<Federation[]>(initialFederations)
  const [filteredFederations, setFilteredFederations] = useState<Federation[]>(initialFederations)
  const [searchQuery, setSearchQuery] = useState("")

  // Функция поиска по названию федерации
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredFederations(federations)
    } else {
      const filtered = federations.filter(federation => 
        federation.name.toLowerCase().includes(query)
      )
      setFilteredFederations(filtered)
    }
  }

  return (
    <>
      {/* Поисковая строка */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск по названию федерации..."
          className="pl-8"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {filteredFederations.length === 0 ? (
        <div className="text-center py-10">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">Федерации не найдены</h2>
              <p className="text-muted-foreground mb-6">
                По запросу "{searchQuery}" ничего не найдено
              </p>
              <Button onClick={() => {setSearchQuery(""); setFilteredFederations(federations)}}>
                Сбросить поиск
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-2">Нет федераций</h2>
              <p className="text-muted-foreground mb-6">Начните с создания вашей первой федерации</p>
              <Link href="/federations/create">
                <Button>Создать федерацию</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFederations.map((federation) => (
            <Card key={federation.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  {federation.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {federation.country && federation.city
                    ? `${federation.city}, ${federation.country}`
                    : federation.country || federation.city || "Международная"}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{federation.club_count || 0} клубов</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{federation.player_count || 0} игроков</span>
                    </div>
                  </div>

                  {federation.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{federation.description}</p>
                  )}

                  <div className="flex space-x-2">
                    <Link href={`/federations/${federation.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Просмотр
                      </Button>
                    </Link>
                    <Link href={`/federations/${federation.id}/edit`}>
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
