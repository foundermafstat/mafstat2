"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Game } from "@/types/game"

// Helper function to safely format date
function formatGameDate(game: Game): string {
  const dateStr = (game as any).created_at || game.createdAt;
  if (!dateStr) return 'Date unknown';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Invalid date';
  return formatDistanceToNow(date, { addSuffix: true });
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw } from "lucide-react"
import { getRecentGames } from "@/lib/actions"

export function RecentGames() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchGames = async () => {
    try {
      setIsLoading(true)
      const result = await getRecentGames()

      if (result.error) {
        throw new Error(result.error)
      }

      setGames(result.data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching recent games:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch recent games"))
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
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Games</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 w-2/3 bg-muted rounded"></div>
                <div className="h-4 w-1/3 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-2/3 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Games</h2>
          <Link href="/games/create">
            <Button>Create Game</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
            <p className="mb-4 text-muted-foreground">Error loading recent games: {error.message}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!games || games.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Games</h2>
          <Link href="/games/create">
            <Button>Create Game</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="mb-4 text-muted-foreground">No games found</p>
            <Link href="/games/create">
              <Button>Create Your First Game</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Games</h2>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/games">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>{game.name || `Game #${game.id}`}</span>
                <Badge>{game.game_type}</Badge>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {formatGameDate(game)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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

                {game.players && game.players.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Players:</div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {game.players.slice(0, 5).map((player) => (
                        <Avatar key={player.id} className="border-2 border-background">
                          <AvatarImage src={player.photo_url || undefined} />
                          <AvatarFallback>
                            {player.name?.[0]}
                            {player.surname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {game.players.length > 5 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                          +{game.players.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Link href={`/games/${game.id}`}>
                  <Button className="w-full mt-2" variant="outline">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
