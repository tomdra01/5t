"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 pl-16">
        <TopNav />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
