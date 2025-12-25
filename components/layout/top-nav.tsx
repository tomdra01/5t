"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserMenu } from "@/components/layout/user-menu"

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vulnerabilities, components..."
              className="pl-9 rounded-2xl border-border/50 bg-muted/30 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-2xl relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-amber" />
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
