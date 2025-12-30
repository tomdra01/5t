"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, AlertTriangle, FileText, Settings, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/sbom", icon: Package, label: "SBOM Portal" },
  { href: "/triage", icon: AlertTriangle, label: "Triage" },
  { href: "/audit", icon: FileText, label: "Audit" },
  { href: "/organizations", icon: Building2, label: "Organizations" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r border-border bg-card">
      <div className="flex h-full flex-col items-center py-6 gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-border/40 overflow-hidden p-2.5">
            <img src="/logo.png" alt="5teen" className="h-full w-full object-contain" />
          </div>
        </Link>



        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                  "hover:bg-accent group relative",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border shadow-lg">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
