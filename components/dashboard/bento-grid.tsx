"use client"

import { AlertTriangle, Package, Shield } from "lucide-react"
import { StatCard } from "./stat-card"
import { ComplianceChart } from "./compliance-chart"
import type { DashboardStats } from "@/types"

interface BentoGridProps {
  stats: DashboardStats
}

export function BentoGrid({ stats }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Critical 24h Reports - Spans 1 column */}
      <StatCard
        title="Critical 24h Reports"
        value={stats.critical24hReports}
        icon={<AlertTriangle className="h-6 w-6" />}
        description="Require immediate Early Warning"
        pulse={stats.critical24hReports > 0}
        className="lg:col-span-1"
      />

      {/* Vulnerability Health Score - Spans 1 column */}
      <div className="lg:col-span-1">
        <ComplianceChart score={stats.vulnerabilityHealthScore} />
      </div>

      {/* SBOM Status - Spans 1 column */}
      <StatCard
        title="SBOM Component Status"
        value={`${stats.vulnerableComponents}/${stats.totalComponents}`}
        icon={<Package className="h-6 w-6" />}
        description="Components with vulnerabilities"
        trend={{
          value: 12,
          isPositive: false,
        }}
        className="lg:col-span-1"
      />

      {/* Compliance Overview - Spans full width */}
      <div className="lg:col-span-3">
        <StatCard
          title="Overall Compliance Status"
          value={stats.complianceStatus.toUpperCase()}
          icon={<Shield className="h-6 w-6" />}
          description="Meeting CRA Article 14 & 15 requirements for continuous vulnerability management"
          className={
            stats.complianceStatus === "critical"
              ? "border-destructive/50 bg-destructive/5"
              : stats.complianceStatus === "warning"
                ? "border-primary/50 bg-primary/5"
                : ""
          }
        />
      </div>
    </div>
  )
}
