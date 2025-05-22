"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { MainTable } from "@/components/main-table"
import { GameSettings } from "@/components/game-settings"
import { GameStages } from "@/components/game-stages"
import { GameTimer } from "@/components/game-timer"
import { BottomNav } from "@/components/bottom-nav"
import { NightActions } from "@/components/night-actions"
import { BestMove } from "@/components/best-move"
import type { GameState } from "./types/game"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Info } from "lucide-react"
import { useGameFormStore, useFetchFederations, useGameFormPath } from "./store/gameFormStore"

export default function GameForm({ initialData }: { initialData?: Partial<GameState> }) {
  const [activeTab, setActiveTab] = useState("main-table")
  
  // Используем Zustand для управления состоянием
  const gameState = useGameFormStore((state) => state.gameState)
  const updateGameState = useGameFormStore((state) => state.updateGameState)
  const updatePlayer = useGameFormStore((state) => state.updatePlayer)
  const setFormSubmitted = useGameFormStore((state) => state.setFormSubmitted)
  const formType = useGameFormStore((state) => state.formType)
  const isFormSubmitted = useGameFormStore((state) => state.isFormSubmitted)
  
  // Используем хук для определения типа формы на основе URL
  const { pathname } = useGameFormPath()
  
  // Используем хук для загрузки федераций
  useFetchFederations()
  
  // Отладочная информация
  console.log("GameForm mounted, formType:", formType, "path:", pathname)
  if (initialData) {
    console.log("Initial data provided:", initialData)
  }

  // Инициализируем состояние хранилища с начальными данными если они есть и мы в режиме редактирования
  useEffect(() => {
    if (initialData && formType === 'edit') {
      console.log("Initializing edit form with data:", initialData)
      updateGameState(initialData)
    }
  }, [initialData, updateGameState, formType])

  // Отображаем информацию о состоянии формы (только в режиме разработки)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const toggleDebugInfo = () => setShowDebugInfo(!showDebugInfo)

  // Обработчик отправки формы
  const handleSubmit = () => {
    // Здесь будет логика отправки формы
    console.log("Submitting form with data:", gameState)
    setFormSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-16">
      <Card className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {formType === 'create' ? 'Создание новой игры' : 'Редактирование игры'}
          </h1>
          
          {!isFormSubmitted && (
            <div className="text-sm text-muted-foreground flex items-center">
              <Info className="h-4 w-4 mr-1" />
              <span>Форма сохраняется автоматически</span>
            </div>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4">
            <button 
              type="button"
              onClick={toggleDebugInfo}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 rounded"
            >
              {showDebugInfo ? 'Скрыть' : 'Показать'} отладочную информацию
            </button>
            
            {showDebugInfo && (
              <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono overflow-auto max-h-40">
                <div><strong>Form Type:</strong> {formType}</div>
                <div><strong>Path:</strong> {pathname}</div>
                <div><strong>Is Submitted:</strong> {isFormSubmitted ? 'Yes' : 'No'}</div>
                <div><strong>Game ID:</strong> {gameState.gameId || 'New'}</div>
              </div>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="main-table">
            <MainTable gameState={gameState} updatePlayer={updatePlayer} />
          </TabsContent>
          <TabsContent value="game-settings">
            <GameSettings 
              gameState={gameState} 
              updateGameState={updateGameState}
            />
          </TabsContent>
          <TabsContent value="game-stages">
            <GameStages gameState={gameState} updateGameState={updateGameState} />
          </TabsContent>
          <TabsContent value="game-timer">
            <GameTimer />
          </TabsContent>
          <TabsContent value="night-actions">
            <NightActions gameState={gameState} updateGameState={updateGameState} />
          </TabsContent>
          <TabsContent value="best-move">
            <BestMove gameState={gameState} updateGameState={updateGameState} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Добавляем кнопки для отправки формы */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex space-x-2">
            <button
              type="button"
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
              onClick={handleSubmit}
            >
              {formType === 'create' ? 'Создать игру' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
