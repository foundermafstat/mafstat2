"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const { session, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex items-center space-x-2">
            <h1 className="text-xl font-bold">Mafia Stats</h1>
          </div>
          <MainNav />
        </div>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          ) : session ? (
            <UserNav user={session.user} />
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
