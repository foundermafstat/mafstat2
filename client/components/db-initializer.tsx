"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export function DbInitializer() {
  const [status, setStatus] = useState<"checking" | "ready" | "initializing" | "initialized" | "error">("checking")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const checkStatus = async () => {
    try {
      setStatus("checking")

      const response = await fetch("/api/db-status")
      const data = await response.json()

      if (response.ok) {
        // Check if we have tables and data
        const hasTables = data.tables > 0
        const hasData = Object.values(data.counts || {}).some((count) => count > 0)

        if (hasTables && hasData) {
          setStatus("initialized")
        } else if (hasTables) {
          setStatus("ready")
        } else {
          setStatus("ready")
        }
      } else {
        setStatus("error")
        setError(data.error || "Failed to check database status")
      }
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus("error")
      setError(error.message || "Failed to check database status")
    }
  }

  const initializeDatabase = async () => {
    try {
      setStatus("initializing")
      setProgress(10)

      // Step 1: Initialize database schema
      setProgress(30)
      const response = await fetch("/api/db-status", {
        method: "POST",
      })

      const data = await response.json()
      setProgress(70)

      if (response.ok && data.status === "success") {
        setProgress(100)
        setStatus("initialized")

        toast({
          title: "Success",
          description: "Database initialized successfully",
        })
      } else {
        setStatus("error")
        setError(data.message || "Failed to initialize database")

        toast({
          title: "Error",
          description: data.message || "Failed to initialize database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      setStatus("error")
      setError(error.message || "Failed to initialize database")

      toast({
        title: "Error",
        description: error.message || "Failed to initialize database",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (status === "checking") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking Database Status</CardTitle>
          <CardDescription>Please wait while we check your database connection...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Database Connection Error
          </CardTitle>
          <CardDescription>
            We encountered an issue connecting to your database. Please check your connection settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md text-red-800 text-sm">{error || "Unknown database error"}</div>
        </CardContent>
        <CardFooter>
          <Button onClick={checkStatus} variant="outline" className="mr-2">
            Retry Connection
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (status === "initializing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initializing Database</CardTitle>
          <CardDescription>Setting up your database schema and initial data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-center text-sm text-muted-foreground">
            {progress < 30 && "Creating database tables..."}
            {progress >= 30 && progress < 70 && "Setting up schema..."}
            {progress >= 70 && "Seeding initial data..."}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === "ready" || status === "initialized") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database {status === "initialized" ? "Initialized" : "Ready"}</CardTitle>
          <CardDescription>
            {status === "initialized"
              ? "Your database is set up and ready to use."
              : "Your database is connected but needs initialization."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "ready" && (
            <div className="bg-amber-50 p-4 rounded-md text-amber-800 text-sm mb-4">
              Your database needs to be initialized before you can use the application. This will create the necessary
              tables and seed initial data.
            </div>
          )}
          {status === "initialized" && (
            <div className="bg-green-50 p-4 rounded-md text-green-800 text-sm">
              <p>Your database is properly set up with all required tables and initial data.</p>
              <p className="mt-2">You can now use all features of the application.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {status === "ready" && (
            <Button onClick={initializeDatabase} className="gap-2">
              <Database className="h-4 w-4" />
              Initialize Database
            </Button>
          )}
          {status === "initialized" && (
            <Button onClick={checkStatus} variant="outline" className="gap-2">
              <Database className="h-4 w-4" />
              Check Status
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return null
}
