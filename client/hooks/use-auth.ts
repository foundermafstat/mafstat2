"use client"
import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  return { session, isLoading }
}
