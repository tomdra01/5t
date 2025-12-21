"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  pulse?: boolean
}

export function StatCard({ title, value, icon, description, trend, className, pulse }: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-4xl font-bold text-foreground tracking-tight", pulse && "animate-pulse-amber")}>
                {value}
              </h3>
              {trend && (
                <span className={cn("text-sm font-medium", trend.isPositive ? "text-green-600" : "text-destructive")}>
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              pulse ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
