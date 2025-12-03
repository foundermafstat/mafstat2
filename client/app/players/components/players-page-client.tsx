"use client"

import { Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { Club } from "@/types/game"
import { PlayersTable } from "./players-table"
import { ClubFilter } from "./club-filter"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { UserWithStats } from "../page"

// This is a client component that will handle the interactive parts
export function PlayersPageClient({
  initialPlayers,
  clubs,
  initialClubId = null
}: {
  initialPlayers: UserWithStats[]
  clubs: Club[]
  initialClubId?: number | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get clubId from URL params or initial prop
  const clubId = searchParams.get('clubId')
    ? Number(searchParams.get('clubId'))
    : initialClubId

  // Filter players by club if clubId is provided
  const filteredPlayers = clubId
    ? initialPlayers.filter(player => player.club_id === clubId)
    : initialPlayers

  const handleClubSelect = useCallback((selectedClubId: number | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (selectedClubId) {
      params.set('clubId', selectedClubId.toString())
    } else {
      params.delete('clubId')
    }
    
    router.push(`/players?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold">Игроки</h1>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-[300px]">
              <ClubFilter 
                clubs={clubs} 
                selectedClubId={clubId}
                onSelect={handleClubSelect}
              />
            </div>
            <Link href="/profile" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Мой профиль
              </Button>
            </Link>
          </div>
        </div>
        
        <Suspense fallback={<div>Загрузка игроков...</div>}>
          <PlayersTable 
            initialPlayers={filteredPlayers} 
            clubId={clubId} 
          />
        </Suspense>
      </main>
    </div>
  )
}

