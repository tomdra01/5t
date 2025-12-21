"use client"

import { format } from "date-fns"
import { FileText, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "sbom" | "report"
  createdAt: string
  label: string
}

interface RecentActivityProps {
  items: ActivityItem[]
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity for this project.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3"
        >
          <div
            className={cn(
              "h-9 w-9 rounded-2xl flex items-center justify-center",
              item.type === "sbom" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
            )}
          >
            {item.type === "sbom" ? <Package className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "PPp")}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
