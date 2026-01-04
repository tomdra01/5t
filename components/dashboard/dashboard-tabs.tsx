"use client"

import type { ReactNode } from "react"
import { useId, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DashboardTab {
  id: string
  label: string
  content: ReactNode
}

interface DashboardTabsProps {
  tabs: DashboardTab[]
  initialTabId?: string
  className?: string
}

export function DashboardTabs({ tabs, initialTabId, className }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTabId || tabs[0]?.id)
  const tabListId = useId()
  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  if (!active) {
    return null
  }

  return (
    <div className={cn("space-y-8", className)}>
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-card/60 p-2"
        id={tabListId}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tabListId}-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative rounded-2xl px-4 py-2 text-sm font-medium transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="dashboard-tab-pill"
                  className="absolute inset-0 rounded-2xl bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          id={`${tabListId}-${active.id}`}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {active.content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
