"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, RefreshCw, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

export function DbStatus() {
  const [status, setStatus] = useState<"connected" | "disconnected" | "checking" | "error">("checking")
  const [details, setDetails] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [open, setOpen] = useState(false)

  const checkStatus = async () => {
    try {
      setStatus("checking")
      setIsRefreshing(true)

      const response = await fetch("/api/db-status")
      const data = await response.json()

      if (response.ok) {
        setStatus(data.status === "connected" ? "connected" : "disconnected")
        setDetails(data)
      } else {
        setStatus("error")
        setDetails({ error: data.error || "Unknown error" })
      }
    } catch (error) {
      console.error("Error checking database status:", error)
      setStatus("error")
      setDetails({ error: error.message || "Failed to check database status" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      setIsInitializing(true)

      const response = await fetch("/api/db-status", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.status === "success") {
        toast({
          title: "Success",
          description: "Database initialized successfully",
        })

        // Refresh status after initialization
        await checkStatus()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to initialize database",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initialize database",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    checkStatus()

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )
      case "disconnected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Checking
          </Badge>
        )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Database className="h-4 w-4" />
            {getStatusBadge()}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Database Status</DialogTitle>
            <DialogDescription>Connection details and table information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span>{getStatusBadge()}</span>
            </div>

            {details && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database:</span>
                  <span>{details.database || "Unknown"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Last checked:</span>
                  <span>{details.timestamp ? new Date(details.timestamp).toLocaleTimeString() : "Unknown"}</span>
                </div>

                {details.tables && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tables:</span>
                    <span>{details.tables}</span>
                  </div>
                )}

                {details.counts && (
                  <Card className="mt-4">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Row Counts</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(details.counts).map(([table, count]) => (
                          <div key={table} className="flex items-center justify-between">
                            <span className="text-sm">{table}:</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {details.error && (
                  <div className="text-red-500 mt-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {details.error}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={checkStatus} disabled={isRefreshing} className="gap-1">
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>

            <Button onClick={initializeDatabase} disabled={isInitializing || status === "checking"} className="gap-1">
              {isInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Initialize Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
