"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClubSelect } from "./club-select"
import { PlayerSelect } from "./player-select"
import { FederationSelect } from "./federation-select" // Add this line
import { useData } from "@/hooks/use-data"
import { useAuth } from "@/hooks/use-auth"
import type { GameState, GameType, Federation, Role } from "../types/game"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const TABLES = Array.from({ length: 20 }, (_, i) => i + 1)
const GAME_TYPES: GameType[] = ["classic_10", "classic_8", "tournament", "rating", "custom"]

interface GameSettingsProps {
  gameState: GameState
  updateGameState: (newState: Partial<GameState>) => void
}

export function GameSettings({ gameState, updateGameState }: GameSettingsProps) {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refereeComments, setRefereeComments] = useState("")
  const [gameName, setGameName] = useState(gameState.name || "")
  const [gameDescription, setGameDescription] = useState(gameState.description || "")
  const { data, isLoading } = useData<Federation[]>("/api/federations")
  const [federations, setFederations] = useState<Federation[]>([])
  const { session } = useAuth()

  // Автоматически устанавливаем текущего пользователя как судью при создании новой игры
  useEffect(() => {
    if (session?.user?.id && !gameState.judge) {
      updateGameState({ judge: session.user.id.toString() })
    }
  }, [session, gameState.judge, updateGameState])

  useEffect(() => {
    if (data) {
      // Ensure we have an array of federations
      const federationsArray = Array.isArray(data) ? data : []
      console.log("Federations data in settings:", federationsArray)
      setFederations(federationsArray)
    }
  }, [data])

  // Обновляем стейт при изменении имени и описания
  useEffect(() => {
    updateGameState({
      name: gameName,
      description: gameDescription,
    });
  }, [gameName, gameDescription, updateGameState]);

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Prepare data for saving
      const saveData = {
        ...gameState,
        name: gameName,
        description: gameDescription,
        refereeComments,
        judge: session?.user?.id?.toString() || gameState.judge, // Используем текущего пользователя как судью
      }

      console.log('Saving game data:', saveData);

      // Определяем эндпоинт в зависимости от наличия ID (create или update)
      const endpoint = saveData.id ? `/api/games/${saveData.id}` : "/api/games";
      const method = saveData.id ? "PUT" : "POST";

      // Send data to API
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        throw new Error(`Failed to save game: ${response.status} ${errorText || 'Unknown error'}`)
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Game saved",
          description: `Game #${result.id || saveData.id} has been saved successfully.`,
        })

        // Update the game ID in the state
        if (result.id) {
          updateGameState({ id: result.id })
        }

        // Устанавливаем флаг успешной отправки формы в Zustand
        try {
          const { useGameFormStore } = require("../store/gameFormStore");
          const setFormSubmitted = useGameFormStore.getState().setFormSubmitted;
          setFormSubmitted(true);
        } catch (e) {
          console.error("Failed to set form submitted:", e);
        }

        return result;
      }
      
      throw new Error(result.error || "Unknown error")
    } catch (error) {
      console.error("Error saving game:", error)
      toast({
        title: "Error",
        description: `Failed to save game: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    // Create a new empty state with just one game and default roles
    const resetState = {
      id: undefined,
      gameType: "classic_10" as GameType,
      players: Array.from({ length: 10 }, (_, i) => ({
        id: 0,
        gameId: 0,
        playerId: 0,
        role: "civilian" as Role,
        fouls: 0,
        additionalPoints: 0,
        slotNumber: i + 1,
        createdAt: "",
        updatedAt: "",
      })),
      result: "",
      federation: "",
      club: "",
      table: 1,
      dateTime: new Date().toISOString(),
      judge: "",
      refereeComments: "",
      name: "",
      description: "",
      nightActions: [],
      dayVotes: [],
      bestMove: {
        killedPlayer: "",
        nominatedPlayers: [],
      },
    }
    updateGameState(resetState)
    setGameName("")
    setGameDescription("")
    setRefereeComments("")
    setShowResetConfirmation(false)
  }

  if (isLoading) {
    return <div>Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Game Name
        </label>
        <Input
          id="gameName"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Enter game name"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="gameDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Game Description
        </label>
        <Textarea
          id="gameDescription"
          value={gameDescription}
          onChange={(e) => setGameDescription(e.target.value)}
          placeholder="Enter game description"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="federation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Федерация
        </label>
        <FederationSelect 
          value={gameState.federation} 
          onChange={(value) => updateGameState({ federation: value })} 
        />
      </div>

      <div>
        <label htmlFor="club" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Club
        </label>
        <ClubSelect value={gameState.club} onChange={(value) => updateGameState({ club: value })} />
      </div>

      <div>
        <label htmlFor="table" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Table
        </label>
        <Select
          value={gameState.table.toString()}
          onValueChange={(value) => updateGameState({ table: Number.parseInt(value) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select table" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {TABLES.map((table) => (
              <SelectItem key={table} value={table.toString()}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date and Time
        </label>
        <Input
          type="datetime-local"
          id="dateTime"
          value={gameState.dateTime.slice(0, 16)}
          onChange={(e) => updateGameState({ dateTime: e.target.value })}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="judge" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Судья
        </label>
        <Input
          id="judge"
          value={session?.user?.name ? `${session.user.name} ${session.user.surname || ''}`.trim() : 'Не авторизован'}
          disabled
          className="w-full bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Судья автоматически устанавливается как текущий авторизованный пользователь
        </p>
      </div>

      <div>
        <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Game Type
        </label>
        <Select value={gameState.gameType} onValueChange={(value: GameType) => updateGameState({ gameType: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select game type" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {GAME_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="result" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Результат игры
        </label>
        <Select 
          value={gameState.result || ""} 
          onValueChange={(value) => updateGameState({ result: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите результат" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="mafia">Победа мафии</SelectItem>
            <SelectItem value="civilians">Победа мирных</SelectItem>
            <SelectItem value="draw">Ничья</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="refereeComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Referee Comments
        </label>
        <Textarea
          id="refereeComments"
          value={refereeComments}
          onChange={(e) => setRefereeComments(e.target.value)}
          placeholder="Enter referee comments"
          className="w-full"
        />
      </div>

      <div className="flex justify-between">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Clear</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all entered data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
