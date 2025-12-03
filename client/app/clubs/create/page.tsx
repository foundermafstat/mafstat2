"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useData } from "@/hooks/use-data"
import { toast } from "@/components/ui/use-toast"

export default function CreateClubPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [federationIds, setFederationIds] = useState<string[]>([])

  const { data: federationsData, isLoading } = useData<any>("/api/federations")

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

      const response = await fetch("/api/clubs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          url,
          country,
          city,
          federation_ids: federationIds.map((id) => Number.parseInt(id)),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create club")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Club created successfully",
      })

      router.push(`/clubs/${data.id}`)
    } catch (error) {
      console.error("Error creating club:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create club",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        <div className="flex items-center mb-6">
          <Link href="/clubs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clubs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Create New Club</h1>
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
                  <label htmlFor="federations" className="text-sm font-medium">
                    Federations
                  </label>
                  <MultiSelect
                    options={
                      !isLoading && federationsData
                        ? (Array.isArray(federationsData) ? federationsData : federationsData.rows || []).map(
                            (federation: any) => ({
                              value: federation.id.toString(),
                              label: federation.name,
                            }),
                          )
                        : []
                    }
                    selected={federationIds}
                    onChange={setFederationIds}
                    placeholder="Select federations"
                    searchPlaceholder="Search federations..."
                    emptyMessage="No federations found"
                  />
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
                <Link href="/clubs">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Club"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
