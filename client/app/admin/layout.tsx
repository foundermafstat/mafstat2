"use client"

import type * as React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Вся логика сайдбара и навигации теперь перенесена в компонент AppSidebar
  return <>{children}</>
}
