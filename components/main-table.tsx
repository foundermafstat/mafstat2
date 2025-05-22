"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayerSelect } from "./player-select"
import type { GameState, GamePlayer, Role, Federation } from "../types/game"
import { cn } from "@/lib/utils"
import React, { useState, useEffect } from "react"
import { useServerData } from "@/hooks/use-server-data"

const ROLES: Role[] = ["civilian", "mafia", "don", "sheriff"]
const FOULS = [0, 1, 2, 3, 4]

interface MainTableProps {
  gameState: GameState
  updatePlayer: (id: number, field: keyof GamePlayer, value: string | number) => void
}

export function MainTable({ gameState, updatePlayer }: MainTableProps) {
  const { data, isLoading } = useServerData<Federation[]>("federations")
  const [currentFederation, setCurrentFederation] = useState<Federation | null>(null)
  const [additionalPoints, setAdditionalPoints] = useState<number[]>([0])

  const federations = React.useMemo(() => data || [], [data])

  useEffect(() => {
    if (federations.length > 0 && gameState.federation) {
      const federation = federations.find((fed) => fed.id.toString() === gameState.federation)
      setCurrentFederation(federation || null)
    }
  }, [federations, gameState.federation])

  useEffect(() => {
    if (currentFederation) {
      try {
        let points: number[] = [0]
        if (typeof currentFederation.additional_points_conditions === "string") {
          // If it's a JSON string, parse it
          const parsed = JSON.parse(currentFederation.additional_points_conditions)
          points = Array.isArray(parsed) ? parsed.map((p: Record<string, number>) => p.points || 0) : [0]
        } else if (Array.isArray(currentFederation.additional_points_conditions)) {
          // If it's already an array
          points = currentFederation.additional_points_conditions.map((p: Record<string, number>) => p.points || 0)
        }
        setAdditionalPoints(points)
      } catch (error) {
        console.error("Error parsing additional points:", error)
        setAdditionalPoints([0])
      }
    }
  }, [currentFederation])

  if (isLoading) {
    return <div>Загрузка таблицы игроков...</div>
  }

  // Определим заголовки таблицы с ключами
  const tableHeaders = [
    { id: "slot", label: "#" },
    { id: "player", label: "Игрок" },
    { id: "role", label: "Роль" },
    { id: "fouls", label: "Фолы" },
    { id: "points", label: "Доп. очки" },
  ];

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 mb-6">
        {tableHeaders.map(header => (
          <div key={header.id} className="font-medium">{header.label}</div>
        ))}

        {gameState.players.map((player, index) => (
          <React.Fragment key={`player-${index}-${player.slotNumber}-${player.id || 'new'}`}>
            {/* Номер стола игрока от 1 до 10 */}
            <div className={cn("flex items-center justify-center font-medium", player.fouls >= 3 && "text-red-500")}>
              {player.slotNumber}
            </div>

            <div className={cn("w-full", player.fouls >= 3 && "text-red-500")}>
              <PlayerSelect
                value={player.playerId ? player.playerId.toString() : ""}
                onChange={(value) => {
                  updatePlayer(player.slotNumber, "playerId", Number(value))
                }}
                label="Выберите игрока..."
                placeholder="Поиск игрока..."
                slotNumber={player.slotNumber} // Явно передаем slotNumber
              />
            </div>

            <Select 
              value={player.role} 
              onValueChange={(value) => {
                console.log(`Updating role for slot ${player.slotNumber} to ${value}`)
                updatePlayer(player.slotNumber, "role", value)
              }}
            >
              <SelectTrigger className={cn("w-[120px]", player.fouls >= 3 && "text-red-500 border-red-500")}>
                <SelectValue placeholder="Роль" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={player.fouls.toString()}
              onValueChange={(value) => {
                console.log(`Updating fouls for slot ${player.slotNumber} to ${value}`)
                updatePlayer(player.slotNumber, "fouls", Number.parseInt(value, 10))
              }}
            >
              <SelectTrigger className={cn("w-[80px]", player.fouls >= 3 && "text-red-500 border-red-500")}>
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {FOULS.map((foul) => (
                  <SelectItem key={foul} value={foul.toString()}>
                    {foul}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={player.additionalPoints?.toString() || "0"}
              onValueChange={(value) => updatePlayer(player.slotNumber, "additionalPoints", Number.parseFloat(value))}
            >
              <SelectTrigger className={cn("w-[120px]", player.fouls >= 3 && "text-red-500 border-red-500")}>
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {additionalPoints.map((point: number) => (
                  <SelectItem key={point} value={point.toString()}>
                    {point}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
