"use client"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocketData<T>(dataType: string) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Function to initialize socket connection
    const initSocket = async () => {
      try {
        // Get socket URL from the API
        const response = await fetch("/api/socket")
        if (!response.ok) {
          throw new Error("Failed to get socket URL")
        }

        const { socketUrl } = await response.json()

        // Initialize socket connection
        const socket = io(socketUrl)
        socketRef.current = socket

        // Set up event listeners
        socket.on("connect", () => {
          console.log("Socket connected:", socket.id)
          // Subscribe to data type
          socket.emit("subscribe", dataType)
        })

        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err)
          setError(new Error(`Socket connection error: ${err.message}`))
          setIsLoading(false)
        })

        socket.on(`${dataType}:data`, (receivedData) => {
          console.log(`Received ${dataType} data:`, receivedData)
          setData(receivedData)
          setIsLoading(false)
          setError(null)
        })

        socket.on(`${dataType}:update`, () => {
          // When an update is received, request fresh data
          socket.emit("subscribe", dataType)
        })

        socket.on(`${dataType}:error`, (err) => {
          console.error(`Error receiving ${dataType} data:`, err)
          setError(new Error(err.message || `Failed to fetch ${dataType} data`))
          setIsLoading(false)
        })

        // Clean up function
        return () => {
          if (socket) {
            socket.emit("unsubscribe", dataType)
            socket.disconnect()
          }
        }
      } catch (err) {
        console.error("Error initializing socket:", err)
        setError(err instanceof Error ? err : new Error("Failed to initialize socket connection"))
        setIsLoading(false)
      }
    }

    initSocket()

    // Clean up function
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("unsubscribe", dataType)
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [dataType])

  // Function to manually refresh data
  const refreshData = () => {
    if (socketRef.current) {
      setIsLoading(true)
      socketRef.current.emit("subscribe", dataType)
    }
  }

  return { data, isLoading, error, refreshData }
}
