"use client"

import { useParams, useRouter } from "next/navigation"
import { useData } from "@/hooks/use-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Building2, Globe, MapPin, LinkIcon, Users, GamepadIcon, Pencil, Trash2 } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClubDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: club, isLoading, error } = useData<any>(`/api/clubs/${params.id}`)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch(`/api/clubs/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete club")
      }

      toast({
        title: "Club deleted",
        description: "The club has been deleted successfully.",
      })

      router.push("/clubs")
    } catch (error) {
      console.error("Error deleting club:", error)
      toast({
        title: "Error",
        description: "Failed to delete the club. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded-lg"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Error loading club</h2>
            <p className="text-red-500 mb-6">{error?.message || "Club not found"}</p>
            <Link href="/clubs">
              <Button>Back to Clubs</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/clubs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clubs
              </Button>
            </Link>
            <h1 className="text-3xl font-bold ml-4">{club.name}</h1>
          </div>
          <div className="flex space-x-2">
            <Link href={`/clubs/${club.id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Club Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Name</div>
                    <div>{club.name}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Federation</div>
                    <div>{club.federation_name || "None"}</div>
                  </div>
                </div>

                {(club.country || club.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div>{[club.city, club.country].filter(Boolean).join(", ")}</div>
                    </div>
                  </div>
                )}

                {club.url && (
                  <div className="flex items-start space-x-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Website</div>
                      <a
                        href={club.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {club.url}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Players</div>
                    <div>{club.players?.length || 0}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <GamepadIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Games</div>
                    <div>{club.games?.length || 0}</div>
                  </div>
                </div>
              </div>

              {club.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{club.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Players:</span>
                  <span>{club.players?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Games:</span>
                  <span>{club.games?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Judges:</span>
                  <span>{club.players?.filter((p: any) => p.is_tournament_judge).length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Win Rate:</span>
                  <span>{club.win_rate ? `${club.win_rate}%` : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="players">
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Players</CardTitle>
              </CardHeader>
              <CardContent>
                {club.players && club.players.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {club.players.map((player: any) => (
                      <div key={player.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarImage src={player.photo_url || undefined} />
                          <AvatarFallback>
                            {player.name?.[0]}
                            {player.surname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {player.name} {player.surname}
                          </div>
                          {player.nickname && <div className="text-sm text-muted-foreground">@{player.nickname}</div>}
                        </div>
                        <Link href={`/players/${player.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No players in this club</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Games</CardTitle>
              </CardHeader>
              <CardContent>
                {club.games && club.games.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {club.games.map((game: any) => (
                      <Card key={game.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{game.name || `Game #${game.id}`}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span>{new Date(game.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span>{game.game_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Result:</span>
                              <span>
                                {game.result
                                  ? game.result
                                      .split("_")
                                      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(" ")
                                  : "In progress"}
                              </span>
                            </div>
                            <Link href={`/games/${game.id}`}>
                              <Button variant="outline" size="sm" className="w-full mt-2">
                                View Game
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No games for this club</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the club and remove its association from all
              players.
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
    </div>
  )
}
