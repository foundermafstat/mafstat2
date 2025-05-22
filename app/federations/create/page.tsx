"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function CreateFederationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [additionalPointsConditions, setAdditionalPointsConditions] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Error",
        description: "Federation name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      let parsedConditions = null
      if (additionalPointsConditions) {
        try {
          parsedConditions = JSON.parse(additionalPointsConditions)
        } catch (parseError) {
          toast({
            title: "Error",
            description: "Additional points conditions must be valid JSON",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      const response = await fetch("/api/federations/create", {
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
          additional_points_conditions: parsedConditions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create federation")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Federation created successfully",
      })

      router.push(`/federations/${data.id}`)
    } catch (error) {
      console.error("Error creating federation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create federation",
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
          <Link href="/federations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Federations
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Create New Federation</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Federation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Federation Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter federation name"
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
                  placeholder="Enter federation description"
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

              <div className="space-y-2">
                <label htmlFor="additionalPointsConditions" className="text-sm font-medium">
                  Additional Points Conditions (JSON)
                </label>
                <Textarea
                  id="additionalPointsConditions"
                  value={additionalPointsConditions}
                  onChange={(e) => setAdditionalPointsConditions(e.target.value)}
                  placeholder='[{"condition": "2+ mafia", "points": 0.25}, {"condition": "3 mafia", "points": 0.5}]'
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a JSON array of objects with "condition" and "points" properties
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Link href="/federations">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Federation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
