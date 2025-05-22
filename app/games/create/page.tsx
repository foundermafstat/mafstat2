"use client"

import GameForm from "@/game-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CreateGamePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4">
        <div className="flex items-center mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          <h1 className="text-2xl font-bold ml-4">Create New Game</h1>
        </div>
      </div>
      <GameForm />
    </div>
  )
}
