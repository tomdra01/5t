"use server"

import { createClient } from "@/utils/supabase/server"
import type { ComplianceReportRow } from "@/types/db"

export interface ComplianceReport {
    id: string
    reportType: string
    generatedAt: Date
    sentToRegulator: boolean
    generatorEmail: string | null
}

export interface FetchReportsResult {
    reports: ComplianceReport[]
    totalReports: number
    lastReportDate: Date | null
    complianceStatus: "compliant" | "non_compliant" | "unknown"
    error?: string
}

export async function fetchComplianceReports(projectId: string): Promise<FetchReportsResult> {
    const supabase = await createClient()

    if (!projectId) {
        return {
            reports: [],
            totalReports: 0,
            lastReportDate: null,
            complianceStatus: "unknown",
        }
    }

    const { data, error } = await supabase
        .from("compliance_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

    if (error) {
        return {
            reports: [],
            totalReports: 0,
            lastReportDate: null,
            complianceStatus: "unknown",
            error: error.message,
        }
    }

    const reports: ComplianceReport[] = (data as ComplianceReportRow[]).map((row) => ({
        id: row.id,
        reportType: row.report_type || "Unknown",
        generatedAt: new Date(row.created_at),
        sentToRegulator: row.sent_to_regulator || false,
        generatorEmail: "User",
    }))

    const lastReportDate = reports.length > 0 ? reports[0].generatedAt : null
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const isCompliant = lastReportDate ? lastReportDate.getTime() > thirtyDaysAgo : false

    return {
        reports,
        totalReports: reports.length,
        lastReportDate,
        complianceStatus: isCompliant ? "compliant" : "non_compliant",
    }
}
