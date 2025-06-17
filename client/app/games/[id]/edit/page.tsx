"use client"

import { useParams, useRouter } from "next/navigation"
import { useData } from "@/hooks/use-data"
import { useEffect, useState } from "react"
import GameForm from "@/game-form"
import { Skeleton } from "@/components/ui/skeleton"

interface GamePlayer {
  id: number;
  game_id?: number;
  gameId?: number;
  player_id?: number;
  playerId?: number;
  role: string;
  fouls: number;
  additional_points?: number;
  additionalPoints?: number;
  slot_number?: number;
  slotNumber?: number;
  name?: string;
  surname?: string;
  nickname?: string;
  photo_url?: string;
  club_name?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface GameResponseData {
  success?: boolean;
  error?: string;
  message?: string;
  players?: GamePlayer[];
  stages?: Record<string, unknown>[];
  id: number;
  name?: string;
  description?: string;
  // Поля из API могут приходить в формате snake_case или camelCase
  game_type?: string;
  gameType?: string;
  referee_id?: number;
  refereeId?: number;
  referee_comments?: string;
  refereeComments?: string;
  federation_id?: number;
  federationId?: number;
  club_id?: number;
  clubId?: number;
  table_number?: number;
  tableNumber?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export default function EditGamePage() {
  const params = useParams()
  const router = useRouter()
  const { data: responseData, isLoading, error } = useData<GameResponseData>(`/api/games/${params.id}`)
  const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null)
  
  // Обработка ответа API и подготовка initialData для GameForm
  useEffect(() => {
    if (responseData) {
      console.log("Game response data for edit:", responseData)
      
      try {
        // Преобразуем данные в формат, понятный для GameForm (с учетом camelCase)
        const gameInitialData = {
          id: responseData.id,
          name: responseData.name || "",
          description: responseData.description || "",
          players: responseData.players?.map((player: GamePlayer) => ({
            id: player.id,
            gameId: player.gameId || player.game_id,
            playerId: player.playerId || player.player_id,
            role: player.role,
            fouls: player.fouls || 0,
            additionalPoints: player.additionalPoints || player.additional_points || 0,
            slotNumber: player.slotNumber || player.slot_number || 0,
            name: player.name,
            surname: player.surname,
            nickname: player.nickname,
            photo_url: player.photo_url,
            club_name: player.club_name
          })) || [],
          federation: (responseData.federationId || responseData.federation_id)?.toString() || "",
          club: (responseData.clubId || responseData.club_id)?.toString() || "",
          table: responseData.tableNumber || responseData.table_number || 1,
          dateTime: responseData.createdAt || responseData.created_at || new Date().toISOString(),
          judge: (responseData.refereeId || responseData.referee_id)?.toString() || "",
          refereeComments: responseData.refereeComments || responseData.referee_comments || "",
          gameType: responseData.gameType || responseData.game_type || "classic_10",
          result: responseData.result || "",
        }
        
        console.log("Prepared initial data for GameForm:", gameInitialData)
        
        // Устанавливаем initialData для передачи в GameForm
        setInitialData(gameInitialData)
        
        // Для совместимости с существующей логикой компонента
        // Но GameForm теперь не зависит от localStorage критически
        localStorage.removeItem("gameState") // Очищаем предыдущее состояние
      } catch (error) {
        console.error("Error preparing game data:", error)
      }
    }
  }, [responseData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !responseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Ошибка загрузки игры</h2>
          <p className="mb-4">{error?.message || (responseData?.error ? responseData.error : "Игра не найдена")}</p>
          <button 
            type="button"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={() => router.push("/games")}
          >
            Вернуться к списку игр
          </button>
        </div>
      </div>
    )
  }

  // Если данные загружены, отображаем форму редактирования с начальными данными
  return <GameForm initialData={initialData || undefined} />
}
