"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useData } from "@/hooks/use-data"
import { toast } from "@/components/ui/use-toast"

export default function EditClubPage() {
  const params = useParams()
  const router = useRouter()
  const { data: club, isLoading: isLoadingClub } = useData<any>(`/api/clubs/${params.id}`)
  const { data: federationsData, isLoading: isLoadingFederations } = useData<any>("/api/federations")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [federationId, setFederationId] = useState("")

  useEffect(() => {
    if (club) {
      setName(club.name || "")
      setDescription(club.description || "")
      setUrl(club.url || "")
      setCountry(club.country || "")
      setCity(club.city || "")
      setFederationId(club.federation_id ? club.federation_id.toString() : "")
    }
  }, [club])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Error",
        description: "Club name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/clubs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          url,
          country,
          city,
          federation_id: federationId ? Number.parseInt(federationId) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update club")
      }

      toast({
        title: "Success",
        description: "Club updated successfully",
      })

      router.push(`/clubs/${params.id}`)
    } catch (error) {
      console.error("Error updating club:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update club",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingClub) {
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

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Club not found</h2>
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
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href={`/clubs/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Club
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Edit Club: {club.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Club Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Club Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter club description"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium">
                    Website URL
                  </label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="federation" className="text-sm font-medium">
                    Federation
                  </label>
                  <Select value={federationId} onValueChange={setFederationId}>
                    <SelectTrigger id="federation">
                      <SelectValue placeholder="Select federation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {!isLoadingFederations &&
                        federationsData &&
                        (Array.isArray(federationsData) ? federationsData : federationsData.rows || []).map(
                          (federation: any) => (
                            <SelectItem key={federation.id} value={federation.id.toString()}>
                              {federation.name}
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium">
                    Country
                  </label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter country"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city" />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Link href={`/clubs/${params.id}`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
