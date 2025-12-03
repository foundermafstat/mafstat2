"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { GameState, DayVote } from "../types/game"
import { Plus } from "lucide-react"

interface GameStagesProps {
  gameState: GameState
  updateGameState: (newState: Partial<GameState>) => void
}

const EMPTY_VOTE: DayVote = {
  candidates: Array(10).fill(0),
  votes: Array(10).fill(0),
  revote: Array(10).fill(0),
  results: [],
}

export function GameStages({ gameState, updateGameState }: GameStagesProps) {
  const [currentVote, setCurrentVote] = useState<DayVote>(EMPTY_VOTE)

  const handleInputChange = (index: number, field: keyof Omit<DayVote, "results">, value: string) => {
    setCurrentVote((prev) => ({
      ...prev,
      [field]: prev[field].map((v, i) => (i === index ? Number(value) || 0 : v)),
    }))
  }

  const handleAddVote = () => {
    updateGameState({
      dayVotes: [...(gameState.dayVotes || []), currentVote],
    })
    setCurrentVote(EMPTY_VOTE)
  }

  const handleResultsChange = (slotNumber: number, checked: boolean) => {
    setCurrentVote((prev) => {
      if (checked) {
        // Добавляем номер, если его еще нет
        if (!prev.results.includes(slotNumber)) {
          return {
            ...prev,
            results: [...prev.results, slotNumber],
          }
        }
      } else {
        // Удаляем номер
        return {
          ...prev,
          results: prev.results.filter((num) => num !== slotNumber),
        }
      }
      return prev
    })
  }

  const renderVoteTable = (vote: DayVote, isEditable = false) => (
    <div className="space-y-4 p-4 rounded-lg">
      <h3 className="text-2xl font-bold mb-6">ГОЛОСОВАНИЕ</h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-lg mb-2">Кандидаты</h4>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Select
                key={`candidate-${i}`}
                value={(vote.candidates[i] || 0).toString()}
                onValueChange={(value) => handleInputChange(i, "candidates", value)}
                disabled={!isEditable}
              >
                <SelectTrigger className="w-full h-[60px] bg-transparent border-gray-600">
                  <SelectValue placeholder="0" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((num) => (
                    <SelectItem key={`player-slot-${num}`} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg mb-2">Голоса</h4>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Input
                key={`votes-${i}`}
                type="number"
                value={(vote.votes[i] || 0).toString()}
                onChange={(e) => handleInputChange(i, "votes", e.target.value)}
                className="h-[60px] bg-transparent border-gray-600 text-center"
                disabled={!isEditable}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg mb-2">Повторно</h4>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Input
                key={`revote-${i}`}
                type="number"
                value={(vote.revote[i] || 0).toString()}
                onChange={(e) => handleInputChange(i, "revote", e.target.value)}
                className="h-[60px] bg-transparent border-gray-600 text-center"
                disabled={!isEditable}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        {isEditable && (
          <Button
            onClick={handleAddVote}
            size="lg"
            className="bg-red-500 hover:bg-red-600 text-white rounded-lg w-12 h-12"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
        <div className="flex flex-col gap-2 ml-auto">
          <span className="text-lg">Результат (мультивыбор):</span>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((num) => (
              <div key={`result-checkbox-${num}`} className="flex items-center space-x-2">
                <Checkbox
                  id={`result-${num}`}
                  checked={vote.results.includes(num)}
                  onCheckedChange={(checked) => handleResultsChange(num, checked as boolean)}
                  disabled={!isEditable}
                />
                <label
                  htmlFor={`result-${num}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {num}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {vote.results && vote.results.length > 0 && (
        <div className="mt-2 text-right">Выбраны: {vote.results.sort((a, b) => a - b).join(", ")}</div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {(gameState.dayVotes || []).map((vote, index) => (
        <div key={index}>{renderVoteTable(vote)}</div>
      ))}
      {renderVoteTable(currentVote, true)}
    </div>
  )
}
