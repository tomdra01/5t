"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import type { ProjectRow, VulnerabilityRow, SbomComponentRow } from "@/types/db"
import { ArrowLeft, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReportPrintPage() {
    const params = useParams()
    const router = useRouter()
    const reportId = params.id as string
    const [report, setReport] = useState<any>(null)
    const [project, setProject] = useState<ProjectRow | null>(null)
    const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRow[]>([])
    const [components, setComponents] = useState<SbomComponentRow[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadReport = async () => {
            const supabase = createClient()

            const { data: reportData } = await supabase
                .from("compliance_reports")
                .select("*")
                .eq("id", reportId)
                .single()

            if (reportData) {
                setReport(reportData)

                const { data: projectData } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", reportData.project_id)
                    .single()
                setProject(projectData)

                const { data: componentsData } = await supabase
                    .from("sbom_components")
                    .select("*")
                    .eq("project_id", reportData.project_id)

                setComponents(componentsData || [])

                if (componentsData && componentsData.length > 0) {
                    const componentIds = componentsData.map((c: any) => c.id)
                    const { data: vulnsData } = await supabase
                        .from("vulnerabilities")
                        .select("*")
                        .in("component_id", componentIds)
                    setVulnerabilities(vulnsData || [])
                }
            }

            setIsLoading(false)
        }

        loadReport()
    }, [reportId])

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-gray-600">Loading report...</p>
            </div>
        )
    }

    if (!report || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-red-600">Report not found</p>
            </div>
        )
    }

    const criticalCount = vulnerabilities.filter((v) => v.severity === "Critical").length
    const highCount = vulnerabilities.filter((v) => v.severity === "High").length
    const mediumCount = vulnerabilities.filter((v) => v.severity === "Medium").length
    const lowCount = vulnerabilities.filter((v) => v.severity === "Low").length
    const overdueCount = vulnerabilities.filter(
        (v) => new Date(v.reporting_deadline) < new Date()
    ).length

    return (
        <div>
            {/* Print/Download Controls - Hidden on print */}
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50 print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
            </div>

            {/* Report Document */}
            <div className="report-container max-w-[210mm] mx-auto p-[20mm] bg-white">
                {/* Header */}
                <div className="text-center mb-12 pb-6 border-b-2 border-gray-900">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        CRA Compliance Report
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">
                        EU Cyber Resilience Act - Annex I Documentation
                    </p>
                </div>

                {/* Report Metadata */}
                <div className="mb-10 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Project Name</p>
                        <p className="text-xl font-semibold text-gray-900">{project.name}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Report Date</p>
                        <p className="text-xl font-semibold text-gray-900">
                            {new Date(report.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Report Type</p>
                        <p className="text-xl font-semibold text-gray-900">{report.report_type || "CRA Compliance"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Project ID</p>
                        <p className="text-xl font-mono text-gray-700">{project.id.slice(0, 16)}...</p>
                    </div>
                </div>

                {/* Executive Summary */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        Executive Summary
                    </h2>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-4xl font-bold text-gray-900 mb-1">{components.length}</p>
                            <p className="text-sm text-gray-600 font-medium">Total Components</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-4xl font-bold text-gray-900 mb-1">{vulnerabilities.length}</p>
                            <p className="text-sm text-gray-600 font-medium">Vulnerabilities</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-4xl font-bold text-red-600 mb-1">{overdueCount}</p>
                            <p className="text-sm text-gray-600 font-medium">Overdue (24h)</p>
                        </div>
                    </div>
                </section>

                {/* Vulnerability Breakdown */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        Vulnerability Analysis
                    </h2>
                    <table className="w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="text-left p-3 font-semibold text-gray-900 text-sm">Severity</th>
                                <th className="text-center p-3 font-semibold text-gray-900 text-sm">Count</th>
                                <th className="text-left p-3 font-semibold text-gray-900 text-sm">CRA Article 15 Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="p-3">
                                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded font-semibold text-sm">
                                        Critical
                                    </span>
                                </td>
                                <td className="text-center p-3 font-semibold text-gray-900">{criticalCount}</td>
                                <td className="p-3 text-sm text-gray-700">Immediate notification required</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3">
                                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded font-semibold text-sm">
                                        High
                                    </span>
                                </td>
                                <td className="text-center p-3 font-semibold text-gray-900">{highCount}</td>
                                <td className="p-3 text-sm text-gray-700">24-hour reporting deadline</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3">
                                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold text-sm">
                                        Medium
                                    </span>
                                </td>
                                <td className="text-center p-3 font-semibold text-gray-900">{mediumCount}</td>
                                <td className="p-3 text-sm text-gray-700">Standard disclosure practices</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="p-3">
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded font-semibold text-sm">
                                        Low
                                    </span>
                                </td>
                                <td className="text-center p-3 font-semibold text-gray-900">{lowCount}</td>
                                <td className="p-3 text-sm text-gray-700">Routine maintenance</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Detailed Vulnerability List */}
                <section className="mb-10 page-break">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        Detailed Vulnerability Inventory
                    </h2>
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="text-left p-2 font-semibold text-gray-900">CVE ID</th>
                                <th className="text-left p-2 font-semibold text-gray-900">Severity</th>
                                <th className="text-left p-2 font-semibold text-gray-900">Status</th>
                                <th className="text-left p-2 font-semibold text-gray-900">Deadline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vulnerabilities.slice(0, 50).map((vuln) => (
                                <tr key={vuln.id} className="border-b border-gray-200">
                                    <td className="p-2 font-mono text-xs">{vuln.cve_id}</td>
                                    <td className="p-2">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${vuln.severity === "Critical" ? "bg-red-100 text-red-800" :
                                                vuln.severity === "High" ? "bg-orange-100 text-orange-800" :
                                                    vuln.severity === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-green-100 text-green-800"
                                            }`}>
                                            {vuln.severity}
                                        </span>
                                    </td>
                                    <td className="p-2 text-gray-700">{vuln.status}</td>
                                    <td className="p-2 text-gray-700 text-xs">
                                        {new Date(vuln.reporting_deadline).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {vulnerabilities.length > 50 && (
                        <p className="text-sm text-gray-600 mt-2">
                            Showing 50 of {vulnerabilities.length} vulnerabilities
                        </p>
                    )}
                </section>

                {/* Compliance Statement */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        CRA Compliance Statement
                    </h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                        <p>
                            <strong className="text-gray-900">Article 14:</strong> This report documents all actively exploited vulnerabilities
                            discovered in our product with digital elements, as required for manufacturer reporting to ENISA.
                        </p>
                        <p>
                            <strong className="text-gray-900">Article 15:</strong> All vulnerabilities are tracked with 24-hour reporting deadlines,
                            demonstrated ownership, and remediation milestones aligned with coordinated vulnerability
                            disclosure practices.
                        </p>
                        <p>
                            <strong className="text-gray-900">Annex I:</strong> This documentation serves as evidence of continuous vulnerability
                            management and demonstrates our compliance with essential cybersecurity requirements.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 border-gray-900 text-center text-sm text-gray-600">
                    <p className="font-medium">Generated by 5teen.app CRA Compliance Platform</p>
                    <p className="mt-1">
                        Report ID: {report.id.slice(0, 16)}... | {new Date().toISOString().split("T")[0]}
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          /* Hide sidebar, navigation, and controls */
          .no-print,
          aside,
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }

          /* Remove app padding */
          main {
            padding: 0 !important;
          }

          .report-container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .page-break {
            page-break-before: always;
          }

          body {
            background: white !important;
          }

          @page {
            margin: 15mm;
            size: A4;
          }
        }

        /* Ensure colors print correctly */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `}</style>
        </div>
    )
}
