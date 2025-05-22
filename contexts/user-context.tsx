"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth } from "@/auth"
import { useRouter } from "next/navigation"

interface UserContextType {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  refreshUser: async () => {},
})

export const useUser = () => useContext(UserContext)

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const session = await auth()
      setUser(session?.user || null)
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const isAuthenticated = !!user
  const isAdmin = isAuthenticated && user?.role === "admin"

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
