"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/hooks/use-data"
import type { Federation, Club, Player } from "@/types/game"
import { DatePickerWithRange } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Search, X } from "lucide-react"

export function GamesFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [federation, setFederation] = useState(searchParams.get("federation") || "")
  const [club, setClub] = useState(searchParams.get("club") || "")
  const [player, setPlayer] = useState(searchParams.get("player") || "")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    if (from && to) {
      return {
        from: new Date(from),
        to: new Date(to),
      }
    }
    return undefined
  })

  const { data: federationsData } = useData<any>("/api/federations")
  const { data: clubsData } = useData<any>("/api/clubs")
  const { data: playersData } = useData<any>("/api/players")

  const [federations, setFederations] = useState<Federation[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (federationsData) {
      const federationsArray = Array.isArray(federationsData) ? federationsData : federationsData.rows || []
      setFederations(federationsArray)
    }
  }, [federationsData])

  useEffect(() => {
    if (clubsData) {
      const clubsArray = Array.isArray(clubsData) ? clubsData : clubsData.rows || []
      setClubs(clubsArray)
    }
  }, [clubsData])

  useEffect(() => {
    if (playersData) {
      const playersArray = Array.isArray(playersData) ? playersData : playersData.rows || []
      setPlayers(playersArray)
    }
  }, [playersData])

  const handleFilter = () => {
    const params = new URLSearchParams()

    if (search) params.set("search", search)
    if (federation) params.set("federation", federation)
    if (club) params.set("club", club)
    if (player) params.set("player", player)
    if (dateRange?.from) params.set("from", format(dateRange.from, "yyyy-MM-dd"))
    if (dateRange?.to) params.set("to", format(dateRange.to, "yyyy-MM-dd"))

    router.push(`/games?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch("")
    setFederation("")
    setClub("")
    setPlayer("")
    setDateRange(undefined)
    router.push("/games")
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-lg font-medium">Filter Games</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="flex">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-r-none"
            />
            <Button variant="secondary" className="rounded-l-none" onClick={handleFilter}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Federation</label>
          <Select value={federation} onValueChange={setFederation}>
            <SelectTrigger>
              <SelectValue placeholder="All federations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All federations</SelectItem>
              {federations.map((fed) => (
                <SelectItem key={fed.id} value={fed.id.toString()}>
                  {fed.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Club</label>
          <Select value={club} onValueChange={setClub}>
            <SelectTrigger>
              <SelectValue placeholder="All clubs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clubs</SelectItem>
              {clubs.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Player</label>
          <Select value={player} onValueChange={setPlayer}>
            <SelectTrigger>
              <SelectValue placeholder="All players" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All players</SelectItem>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name} {p.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Date Range</label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleFilter}>Apply Filters</Button>
      </div>
    </div>
  )
}
