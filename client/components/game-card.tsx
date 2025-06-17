"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Game } from "@/types/game"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

interface GameCardProps {
  game: Game
  onDelete?: () => void
}

export function GameCard({ game, onDelete }: GameCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/games/${game.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete game")
      }

      toast({
        title: "Game deleted",
        description: "The game has been deleted successfully.",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Error deleting game:", error)
      toast({
        title: "Error",
        description: "Failed to delete the game. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>{game.name || `Game #${game.id}`}</span>
            <div className="flex items-center space-x-2">
              <Badge>{game.game_type}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href={`/games/${game.id}/edit`}>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Judge:</span>
              <span className="text-sm">{game.referee_name || "Not assigned"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Result:</span>
              <span className="text-sm">
                {game.result
                  ? game.result
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")
                  : "In progress"}
              </span>
            </div>

            {game.players && game.players.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Players:</div>
                <div className="flex flex-wrap gap-2">
                  {game.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center p-1 rounded border"
                      title={`${player.name} ${player.surname} - ${player.role.charAt(0).toUpperCase() + player.role.slice(1)}`}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={player.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {player.name?.[0]}
                          {player.surname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs">
                        <div className="font-medium">
                          {player.name} {player.surname}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                          </Badge>
                          <span>+{player.additional_points}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href={`/games/${game.id}`}>
              <Button className="w-full mt-2" variant="outline">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the game and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
