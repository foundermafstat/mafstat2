"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { GameState, NightAction } from "../types/game"

interface NightActionsProps {
  gameState: GameState
  updateGameState: (newState: Partial<GameState>) => void
}

export function NightActions({ gameState, updateGameState }: NightActionsProps) {
  const [currentNight, setCurrentNight] = useState<NightAction>({
    mafiaShot: null,
    donCheck: null,
    sheriffCheck: null,
  })

  const handleNightActionChange = (field: keyof NightAction, value: string) => {
    setCurrentNight((prev) => ({
      ...prev,
      [field]: value === "miss" ? null : Number(value),
    }))
  }

  const handleAddNight = () => {
    updateGameState({
      nightActions: [...gameState.nightActions, currentNight],
    })
    setCurrentNight({
      mafiaShot: null,
      donCheck: null,
      sheriffCheck: null,
    })
  }

  const renderNightAction = (night: NightAction, index?: number) => (
    <div className="p-4 border rounded-md space-y-4 bg-card">
      {index !== undefined && <h3 className="text-lg font-semibold mb-2">Night {index + 1}</h3>}

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Mafia Shot (Slot Number)</label>
          <Select
            value={night.mafiaShot?.toString() ?? "miss"}
            onValueChange={(value) => handleNightActionChange("mafiaShot", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select slot number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="miss">Miss</SelectItem>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((num) => (
                <SelectItem key={`mafia-slot-${num}`} value={num.toString()}>
                  Slot {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Don Check (Slot Number)</label>
          <Select
            value={night.donCheck?.toString() ?? ""}
            onValueChange={(value) => handleNightActionChange("donCheck", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select slot number" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((num) => (
                <SelectItem key={`don-slot-${num}`} value={num.toString()}>
                  Slot {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Sheriff Check (Slot Number)</label>
          <Select
            value={night.sheriffCheck?.toString() ?? ""}
            onValueChange={(value) => handleNightActionChange("sheriffCheck", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select slot number" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((num) => (
                <SelectItem key={`sheriff-slot-${num}`} value={num.toString()}>
                  Slot {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Night Actions</h2>

      {gameState.nightActions.map((night, index) => (
        <div key={index}>{renderNightAction(night, index)}</div>
      ))}

      {renderNightAction(currentNight)}

      <Button onClick={handleAddNight} className="mt-4">
        <Plus className="h-4 w-4 mr-2" />
        Add Night
      </Button>
    </div>
  )
}
