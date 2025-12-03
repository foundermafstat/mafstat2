"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { setAuthTokenFromSession } from "@/lib/api"

// Хук для автоматической установки токена из сессии NextAuth
export function useApiAuth() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.accessToken) {
      setAuthTokenFromSession(session.user.accessToken as string)
    }
  }, [session])
}

