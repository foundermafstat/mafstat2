"use client"

import { useState, useEffect } from "react"
import { fetchData } from "@/lib/actions"

export function useServerData<T>(dataType: string, id?: string) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDataFromServer = async () => {
    try {
      setIsLoading(true)
      const result = await fetchData(dataType, id)

      if (result.error) {
        throw new Error(result.error)
      }

      setData(result.data as T)
      setError(null)
    } catch (err) {
      console.error(`Error fetching ${dataType}:`, err)
      setError(err instanceof Error ? err : new Error(`Failed to fetch ${dataType}`))

      // Set data to a safe default value based on the expected type
      setData(Array.isArray({} as T) ? ([] as unknown as T) : null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDataFromServer()
  }, [dataType, id])

  const refreshData = () => {
    fetchDataFromServer()
  }

  return { data, isLoading, error, refreshData }
}
