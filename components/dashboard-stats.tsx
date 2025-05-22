"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GamepadIcon, Users, Building2, Globe, Award, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboardStats } from "@/lib/actions"

export function DashboardStats() {
  const [stats, setStats] = useState({
    games: 0,
    players: 0,
    clubs: 0,
    federations: 0,
    judges: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const result = await getDashboardStats()

      if (result.error) {
        throw new Error(result.error)
      }

      setStats(
        result.data?.[0] || {
          games: 0,
          players: 0,
          clubs: 0,
          federations: 0,
          judges: 0,
        },
      )
      setError(null)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch dashboard stats"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStats()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const statsItems = [
    {
      title: "Total Games",
      value: stats.games,
      icon: GamepadIcon,
    },
    {
      title: "Players",
      value: stats.players,
      icon: Users,
    },
    {
      title: "Clubs",
      value: stats.clubs,
      icon: Building2,
    },
    {
      title: "Federations",
      value: stats.federations,
      icon: Globe,
    },
    {
      title: "Judges",
      value: stats.judges,
      icon: Award,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 rounded-full bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {statsItems.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsItems.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
