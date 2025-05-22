import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllUsers } from "@/actions/users"
import { PlusCircle, TableIcon, LayoutGrid } from "lucide-react"
import { PlayersTable } from "./components/players-table"
import { SearchForm } from "./components/search-form"
import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function PlayersPage() {
  const result = await getAllUsers()
  
  // Преобразуем данные из snake_case в camelCase
  const players = (result.data || []).map(player => ({
    id: player.id,
    name: player.name,
    surname: player.surname,
    nickname: player.nickname,
    email: player.email,
    image: player.image,
    country: player.country,
    birthday: player.birthday,
    gender: player.gender,
    isTournamentJudge: player.is_tournament_judge,
    isSideJudge: player.is_side_judge,
    clubName: player.club_name,
    club_name: player.club_name,
    club_id: player.club_id
  }))
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Игроки</h1>
          <Link href="/profile">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Профиль игрока
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">
              <TableIcon className="h-4 w-4 mr-2" />
              Таблица статистики
            </TabsTrigger>
            <TabsTrigger value="cards">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Карточки
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="mt-0">
            <Suspense fallback={<div className="text-center py-6">Загрузка статистики...</div>}>
              <PlayersTable initialPlayers={players} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="cards" className="mt-0">
            <SearchForm initialPlayers={players} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
