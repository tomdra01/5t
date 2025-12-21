"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, AlertTriangle, FileText, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sbom", icon: Package, label: "SBOM Portal" },
  { href: "/triage", icon: AlertTriangle, label: "Triage" },
  { href: "/audit", icon: FileText, label: "Audit" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r border-border/40 bg-card/50 backdrop-blur-xl">
      <div className="flex h-full flex-col items-center py-6 gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
            5t
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                  "hover:bg-accent/50 group relative",
                  isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border/50 shadow-lg">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Shield className="h-5 w-5" />
        </div>
      </div>
    </aside>
  )
}
