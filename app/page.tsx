"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { RecentGames } from "@/components/recent-games"
import { TopClubs } from "@/components/top-clubs"
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  
  return (
    <main className="container py-6 space-y-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentGames />
        <TopClubs />
      </div>
    </main>
  )
}
