"use client"

import { useEffect, useState } from "react"
import type { Game } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { RefreshCw } from "lucide-react"
import { fetchData } from "@/lib/actions"
import type { Game } from "@/types/game"

// Helper function to safely format date
function formatGameDate(game: Game): string {
  const dateStr = (game as any).created_at || game.createdAt;
  if (!dateStr) return 'Date unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function GamesList() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchGames = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData("games")

      if (result.error) {
        throw new Error(result.error)
      }

      setGames(result.data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching games:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch games"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchGames()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (isLoading) {
    return <div>Loading games...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>Error loading games: {error.message}</div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!games || games.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>No games found</div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Games</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id}>
            <CardHeader className="pb-2">
              <CardTitle>{game.name || `Game #${game.id}`}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {formatGameDate(game)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">{game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Judge:</span>
                  <span className="text-sm">{game.referee_name || "Not assigned"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Result:</span>
                  <span className="text-sm">
                    {game.result
                      ? game.result
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")
                      : "In progress"}
                  </span>
                </div>
                <Button
                  className="w-full mt-2"
                  variant="outline"
                  onClick={() => (window.location.href = `/games/${game.id}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
