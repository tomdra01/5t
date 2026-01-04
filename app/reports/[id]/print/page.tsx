"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import type { ProjectRow, VulnerabilityRow, SbomComponentRow, OrganizationRow } from "@/types/db"
import { ArrowLeft, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReportPrintPage() {
    const params = useParams()
    const reportId = params.id as string
    const [report, setReport] = useState<any>(null)
    const [project, setProject] = useState<ProjectRow | null>(null)
    const [organization, setOrganization] = useState<OrganizationRow | null>(null)
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

                if (projectData?.organization_id) {
                    const { data: orgData } = await supabase
                        .from("organizations")
                        .select("*")
                        .eq("id", projectData.organization_id)
                        .single()
                    setOrganization(orgData)
                }

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
    const patchedCount = vulnerabilities.filter((v) => v.status === "Patched").length
    const openCount = vulnerabilities.filter((v) => v.status !== "Patched").length

    const upgradedComponents = components.filter((c) => c.previous_version && c.previous_version !== c.version)

    // Compliance calculations
    const article14Pass = overdueCount === 0 // No overdue vulnerabilities
    const article15Pass = vulnerabilities.every((v) => v.assigned_to !== null) // All assigned

    // Remediation roadmap data
    const openVulnerabilities = vulnerabilities.filter((v) => v.status !== "Patched")
    const sortedByDeadline = [...openVulnerabilities].sort(
        (a, b) => new Date(a.reporting_deadline).getTime() - new Date(b.reporting_deadline).getTime()
    )

    return (
        <div>
            {/* Print/Download Controls - Hidden on print */}
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50 print:hidden">
                <Button variant="outline" onClick={() => window.close()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Close
                </Button>
                <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
            </div>

            {/* Report Document */}
            <div className="report-container max-w-[210mm] mx-auto p-[20mm] bg-white">
                {/* Header */}
                <div className="text-center mb-12 pb-8 border-b-4 border-gray-900">
                    <div className="mb-4">
                        <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight uppercase">
                            CRA Compliance Report
                        </h1>
                        <p className="text-xl text-gray-700 font-semibold tracking-wide">
                            European Union Cyber Resilience Act
                        </p>
                        <p className="text-lg text-gray-600 font-medium mt-1">
                            Annex I Documentation
                        </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-300">
                        <p className="text-sm text-gray-600 uppercase tracking-wider">
                            Confidential Regulatory Compliance Documentation
                        </p>
                    </div>
                </div>

                {/* Report Metadata */}
                <div className="mb-12 p-6 bg-gray-50 border border-gray-300">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="border-b border-gray-300 pb-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Project Name</p>
                            <p className="text-lg font-bold text-gray-900">{project.name}</p>
                        </div>
                        <div className="border-b border-gray-300 pb-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Report Date</p>
                            <p className="text-lg font-bold text-gray-900">
                                {new Date(report.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                        <div className="border-b border-gray-300 pb-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Report Type</p>
                            <p className="text-lg font-bold text-gray-900">{report.report_type || "Annex I Summary"}</p>
                        </div>
                        <div className="border-b border-gray-300 pb-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Organization</p>
                            <p className="text-lg font-bold text-gray-900">{organization?.name || "Independent"}</p>
                        </div>
                    </div>
                </div>

                {/* Compliance Scorecard */}
                <section className="mb-10 p-6 bg-white border-2 border-gray-900">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-300">Compliance Assessment</h2>
                    <div className="space-y-4">
                        <div className="flex items-start justify-between p-4 bg-gray-50 border-l-4 border-gray-900">
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg mb-1">Article 14: Vulnerability Reporting to ENISA</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Manufacturers must report actively exploited vulnerabilities to the European Union Agency for Cybersecurity (ENISA) within 24 hours of awareness, including detailed technical information and potential impact assessment.
                                </p>
                                <p className="text-sm font-semibold mt-2 text-gray-900">
                                    Status: {article14Pass ? (
                                        <span className="text-green-700">COMPLIANT - All reporting deadlines met</span>
                                    ) : (
                                        <span className="text-red-700">NON-COMPLIANT - Overdue reports identified</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start justify-between p-4 bg-gray-50 border-l-4 border-gray-900">
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg mb-1">Article 15: Coordinated Vulnerability Disclosure</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    Manufacturers must handle vulnerabilities in accordance with coordinated disclosure practices, ensuring appropriate ownership assignment, severity classification, and timely remediation of identified security issues.
                                </p>
                                <p className="text-sm font-semibold mt-2 text-gray-900">
                                    Status: {article15Pass ? (
                                        <span className="text-green-700">COMPLIANT - All vulnerabilities assigned</span>
                                    ) : (
                                        <span className="text-red-700">NON-COMPLIANT - Unassigned vulnerabilities exist</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 bg-gray-100 border border-gray-400">
                        <p className="text-sm font-bold text-gray-900 mb-1">Overall Compliance Status</p>
                        <p className="text-sm text-gray-700">
                            {article14Pass && article15Pass ? (
                                <>The organization has achieved full compliance with CRA Articles 14 and 15 as of the date of this report. All regulatory requirements for vulnerability reporting and coordinated disclosure have been met.</>
                            ) : (
                                <>The organization is actively working to achieve full compliance with CRA requirements. Immediate action is required to address identified deficiencies and ensure regulatory conformity.</>
                            )}
                        </p>
                    </div>
                </section>

                {/* Executive Summary */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        Executive Summary
                    </h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed text-justify">
                        <p>
                            This compliance report provides a comprehensive assessment of {project.name}'s adherence to the European Union Cyber Resilience Act (CRA) requirements, specifically addressing Annex I documentation standards for products with digital elements. The assessment encompasses vulnerability management practices, coordinated disclosure procedures, and continuous security monitoring capabilities as mandated by the regulation.
                        </p>
                        <p>
                            The current security posture indicates that {components.length} software components are actively monitored within the project scope, with {vulnerabilities.length} total vulnerabilities identified through systematic scanning processes. Of these vulnerabilities, {patchedCount} have been successfully remediated and {openCount} remain under active investigation and resolution. All identified vulnerabilities have been classified according to severity levels and assigned appropriate reporting deadlines in accordance with Article 14 requirements.
                        </p>
                        <p>
                            {article14Pass && article15Pass ? (
                                <>The organization has achieved full compliance with CRA Articles 14 and 15. All actively exploited vulnerabilities have been reported to ENISA within the mandated 24-hour timeframe, and coordinated vulnerability disclosure practices have been properly implemented with appropriate ownership assignments for all security issues.</>
                            ) : (
                                <>The organization is actively working toward full compliance with CRA requirements. {!article14Pass ? "Current efforts are focused on addressing vulnerabilities that have exceeded the 24-hour reporting deadline as specified in Article 14." : ""} {!article14Pass && !article15Pass ? "Additionally, " : ""}{!article15Pass ? "The organization is in the process of ensuring all vulnerabilities are assigned to designated security personnel in accordance with Article 15 coordinated disclosure practices." : ""}</>
                            )}
                        </p>
                    </div>
                </section>

                {/* Executive Summary Stats */}
                <div className="mb-10 grid grid-cols-3 gap-6">
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

                {/* Remediation Roadmap */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        Remediation Roadmap
                    </h2>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed text-justify">
                        The following remediation schedule outlines target resolution dates for all outstanding vulnerabilities, prioritized by severity level and regulatory reporting deadlines. Each vulnerability has been assigned to qualified security personnel responsible for investigation, remediation, and verification of fixes.
                    </p>
                    {sortedByDeadline.length === 0 ? (
                        <div className="p-6 bg-gray-50 border-2 border-gray-300 rounded">
                            <p className="font-semibold text-gray-900 mb-2">Current Status: All Vulnerabilities Resolved</p>
                            <p className="text-sm text-gray-700">As of the date of this report, no outstanding security vulnerabilities require remediation. All previously identified issues have been successfully addressed and verified through appropriate testing procedures.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedByDeadline.slice(0, 10).map((vuln, index) => {
                                const deadline = new Date(vuln.reporting_deadline)
                                const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                const isOverdue = daysUntil < 0
                                const isUrgent = daysUntil <= 1

                                return (
                                    <div key={vuln.id} className={`flex items-center justify-between p-3 border rounded ${isOverdue ? "bg-red-50 border-red-200" :
                                            isUrgent ? "bg-orange-50 border-orange-200" :
                                                "bg-gray-50 border-gray-200"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono text-gray-700">{index + 1}.</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{vuln.cve_id}</p>
                                                <p className="text-xs text-gray-600">
                                                    {vuln.severity} severity • Assigned to: {vuln.assigned_to?.slice(0, 8) || "Unassigned"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${isOverdue ? "text-red-700" :
                                                    isUrgent ? "text-orange-700" :
                                                        "text-gray-900"
                                                }`}>
                                                {deadline.toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {isOverdue ? `${Math.abs(daysUntil)}d overdue` :
                                                    isUrgent ? `${daysUntil}d remaining` :
                                                        `${daysUntil}d remaining`}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            {sortedByDeadline.length > 10 && (
                                <p className="text-sm text-gray-600 text-center pt-2">
                                    Showing 10 of {sortedByDeadline.length} open vulnerabilities
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Vulnerability Breakdown */}
                <section className="mb-10 page-break">
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
                <section className="mb-10">
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

                {/* Component Version Upgrades */}
                {upgradedComponents.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                            Component Version Upgrades
                        </h2>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed text-justify">
                            The following table documents software component version upgrades performed as part of vulnerability remediation activities. These upgrades represent proactive security measures taken to address known vulnerabilities and maintain the security posture of the product throughout its lifecycle.
                        </p>
                        <table className="w-full border-collapse border border-gray-200 text-sm">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                    <th className="text-left p-2 font-semibold text-gray-900">Component</th>
                                    <th className="text-left p-2 font-semibold text-gray-900">Previous Version</th>
                                    <th className="text-left p-2 font-semibold text-gray-900">Current Version</th>
                                    <th className="text-left p-2 font-semibold text-gray-900">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upgradedComponents.map((comp) => (
                                    <tr key={comp.id} className="border-b border-gray-200">
                                        <td className="p-2 font-semibold text-gray-900">{comp.name}</td>
                                        <td className="p-2 text-gray-600">{comp.previous_version}</td>
                                        <td className="p-2 text-green-700 font-semibold">{comp.version}</td>
                                        <td className="p-2 text-gray-700 text-xs">
                                            {new Date(comp.added_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* Compliance Statement */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-900">
                        CRA Compliance Statement
                    </h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed text-justify">
                        <p>
                            <strong className="text-gray-900">Article 14 (Vulnerability Reporting):</strong> The organization maintains comprehensive documentation of all identified vulnerabilities in accordance with ENISA reporting requirements. All actively exploited vulnerabilities affecting products with digital elements are documented with appropriate technical details, affected component information, and potential impact assessments. The vulnerability management system ensures timely notification to ENISA within the mandated 24-hour timeframe for critical and high-severity vulnerabilities that are being actively exploited in the wild.
                        </p>
                        <p>
                            <strong className="text-gray-900">Article 15 (Coordinated Vulnerability Disclosure):</strong> The organization has implemented coordinated vulnerability disclosure practices in compliance with regulatory requirements. All identified vulnerabilities are tracked with assigned ownership to qualified security personnel, appropriate severity classifications, and deadline-driven remediation schedules. The vulnerability management process includes mechanisms for receiving vulnerability reports from external security researchers, coordinating with affected parties, and managing public disclosure timelines in a responsible manner.
                        </p>
                        <p>
                            <strong className="text-gray-900">Annex I (Documentation Requirements):</strong> This report serves as evidence of the organization's continuous vulnerability management capabilities and systematic approach to cybersecurity throughout the product lifecycle. The documented processes demonstrate compliance with Annex I requirements for maintaining up-to-date security documentation, implementing systematic vulnerability assessment procedures, and ensuring appropriate security measures are maintained for products with digital elements placed on the European market.
                        </p>
                    </div>
                </section>

                {/* Sign-Off Block */}
                <section className="mb-10 p-6 border-2 border-gray-900 rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Officer Sign-Off</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                    Officer Name
                                </label>
                                <div className="border-b-2 border-gray-300 pb-2 h-10"></div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                    Title/Role
                                </label>
                                <div className="border-b-2 border-gray-300 pb-2 h-10"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                    Signature
                                </label>
                                <div className="border-b-2 border-gray-300 pb-2 h-16"></div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                    Date
                                </label>
                                <div className="border-b-2 border-gray-300 pb-2 h-10"></div>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                            <p className="text-xs text-gray-600">
                                <strong>Declaration:</strong> This report accurately reflects vulnerability management for {project.name}.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-4 border-gray-900">
                    <div className="text-center space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Document Authentication</p>
                        <p className="text-sm font-semibold text-gray-900">Generated by 5teen.app CRA Compliance Platform</p>
                        <p className="text-xs text-gray-600 font-mono">
                            Report Reference: {report.id.slice(0, 24)}
                        </p>
                        <p className="text-xs text-gray-600">
                            Generation Date: {new Date(report.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })} at {new Date(report.created_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZoneName: "short"
                            })}
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            This document contains confidential information prepared for regulatory compliance purposes.
                            Unauthorized distribution or disclosure is prohibited.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          .no-print,
          aside,
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }

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

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `}</style>
        </div>
    )
}
