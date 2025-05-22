"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { GameState } from "../types/game"

interface BestMoveProps {
  gameState: GameState
  updateGameState: (newState: Partial<GameState>) => void
}

export function BestMove({ gameState, updateGameState }: BestMoveProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  const handlePlayerSelect = (index: number, value: string) => {
    const newSelectedPlayers = [...selectedPlayers]
    newSelectedPlayers[index] = value
    setSelectedPlayers(newSelectedPlayers)
  }

  const handleSubmit = () => {
    const mafiaOrDonCount = selectedPlayers.filter((player) => {
      const playerData = gameState.players.find((p) => p.player === player)
      return playerData && (playerData.role === "mafia" || playerData.role === "don")
    }).length

    let additionalPoints = 0
    if (mafiaOrDonCount >= 2) {
      additionalPoints = 0.25
    }

    if (mafiaOrDonCount === 3) {
      additionalPoints = 0.5
    }

    const killedPlayer = gameState.players.find((p) => p.player === gameState.bestMove.killedPlayer)
    if (killedPlayer) {
      updateGameState({
        players: gameState.players.map((p) =>
          p.id === killedPlayer.id ? { ...p, additional: p.additional + additionalPoints } : p,
        ),
        bestMove: {
          killedPlayer: gameState.bestMove.killedPlayer,
          nominatedPlayers: selectedPlayers,
        },
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Best Move</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Killed Player</label>
        <Select
          value={gameState.bestMove.killedPlayer}
          onValueChange={(value) => updateGameState({ bestMove: { ...gameState.bestMove, killedPlayer: value } })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select killed player" />
          </SelectTrigger>
          <SelectContent>
            {gameState.players.map((player) => (
              <SelectItem key={player.id} value={player.player}>
                {player.player}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nominated Players</label>
        {[0, 1, 2].map((index) => (
          <Select
            key={index}
            value={selectedPlayers[index] || ""}
            onValueChange={(value) => handlePlayerSelect(index, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select player ${index + 1}`} />
            </SelectTrigger>
            <SelectContent>
              {gameState.players.map((player) => (
                <SelectItem key={player.id} value={player.player}>
                  {player.player}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      <Button onClick={handleSubmit}>Submit Best Move</Button>
    </div>
  )
}
