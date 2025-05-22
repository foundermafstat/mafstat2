"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Club } from "@/types/game"
import { Building2, AlertCircle, RefreshCw } from "lucide-react"
import { getTopClubs } from "@/lib/actions"

export function TopClubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchClubs = async () => {
    try {
      setIsLoading(true)
      const result = await getTopClubs()

      if (result.error) {
        throw new Error(result.error)
      }

      setClubs(result.data || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching top clubs:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch top clubs"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchClubs()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Top Clubs</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 w-2/3 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
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
          <h2 className="text-2xl font-bold">Top Clubs</h2>
          <Link href="/clubs/create">
            <Button>Create Club</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
            <p className="mb-4 text-muted-foreground">Error loading clubs: {error.message}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Top Clubs</h2>
          <Link href="/clubs/create">
            <Button>Create Club</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="mb-4 text-muted-foreground">No clubs found</p>
            <Link href="/clubs/create">
              <Button>Create Your First Club</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Top Clubs</h2>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/clubs">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <Card key={club.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                {club.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{club.federation_name}</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Players:</span>
                  <span className="text-sm">{club.player_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Games:</span>
                  <span className="text-sm">{club.game_count || 0}</span>
                </div>
                <Link href={`/clubs/${club.id}`}>
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
