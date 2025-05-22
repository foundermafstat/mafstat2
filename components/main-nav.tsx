"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, Building2, Globe, GamepadIcon, PlusCircle, Trophy } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/games",
      label: "Games",
      icon: GamepadIcon,
      active: pathname === "/games" || pathname.startsWith("/games/"),
    },
    {
      href: "/ratings",
      label: "Ratings",
      icon: Trophy,
      active: pathname === "/ratings" || pathname.startsWith("/ratings/"),
    },
    {
      href: "/clubs",
      label: "Clubs",
      icon: Building2,
      active: pathname === "/clubs" || pathname.startsWith("/clubs/"),
    },
    {
      href: "/federations",
      label: "Federations",
      icon: Globe,
      active: pathname === "/federations" || pathname.startsWith("/federations/"),
    },
    {
      href: "/players",
      label: "Players",
      icon: Users,
      active: pathname === "/players" || pathname.startsWith("/players/"),
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-black dark:text-white" : "text-muted-foreground",
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
      <div className="ml-auto flex items-center space-x-4">
        <Link href="/games/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </Link>
      </div>
    </nav>
  )
}
