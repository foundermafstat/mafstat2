"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastPing, setLastPing] = useState<Date | null>(null)

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/socket")
        if (response.ok) {
          setIsConnected(true)
          setLastPing(new Date())
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Connection check failed:", error)
        setIsConnected(false)
      }
    }

    // Initial check
    checkConnection()

    // Set up interval to check connection
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Disconnected</span>
          </>
        )}
      </Badge>
      {lastPing && (
        <span className="text-xs text-muted-foreground ml-2">Last ping: {lastPing.toLocaleTimeString()}</span>
      )}
    </div>
  )
}
