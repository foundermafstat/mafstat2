import { Suspense } from "react"
import { getUsersWithStats, getAllClubs } from "@/lib/api-client"
import type { Club } from "@/types/game"
import { PlayersTable } from "./components/players-table"
import { ClubFilter } from "./components/club-filter"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlayersPageClient } from "./components/players-page-client"

// Тип для пользователя со статистикой
export type UserWithStats = {
  id: string
  name: string | null
  surname: string | null
  nickname: string | null
  email: string
  image: string | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  role: string
  country: string | null
  birthday: Date | null
  gender: string | null
  club_id: number | null
  club_name: string | null
  club_city: string | null
  club_country: string | null
  total_games: number
  civ_win_rate: string
  mafia_win_rate: string
  sheriff_win_rate: string
  don_win_rate: string
  avg_additional_points: string
  total_fouls: number
}

// This is a server component that fetches data
async function PlayersPage() {
  // Используем кэширование для уменьшения количества запросов
  const players = await getUsersWithStats()
  const clubs = await getAllClubs()
  
  return (
    <PlayersPageClient 
      initialPlayers={players} 
      clubs={clubs} 
    />
  )
}

// Экспортируем настройки кэширования для Next.js
export const revalidate = 60 // Перевалидировать каждые 60 секунд

export default PlayersPage
