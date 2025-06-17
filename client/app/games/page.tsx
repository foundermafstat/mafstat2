import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllGames } from "@/actions/games"
import { PlusCircle } from "lucide-react"
import { SearchForm } from "./components/search-form"

export default async function GamesPage() {
  const result = await getAllGames()
  const games = result.data || []
  
  // Статистика игр
  const totalGames = games.length
  const completedGames = games.filter(game => game.result).length
  const pendingGames = totalGames - completedGames
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-8">
        {/* Заголовок и краткая статистика */}
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold font-heading">Games and tournaments</h1>
              <p className="text-muted-foreground">
                Total games: {totalGames} | Completed: {completedGames} | In progress: {pendingGames}
              </p>
            </div>
            <Link href="/games/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Новая игра
              </Button>
            </Link>
          </div>
          
          {/* Разделитель */}
          <div className="h-px bg-border mt-4" />
        </div>

        {/* Форма поиска и список игр */}
        <div className="space-y-6">
          <SearchForm initialGames={games} />
        </div>
      </main>
    </div>
  )
}
