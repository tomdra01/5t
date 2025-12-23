"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, CheckCircle, XCircle } from "lucide-react"
import type { ComplianceReport } from "@/app/audit/actions"
import { format } from "date-fns"

interface ComplianceReportListProps {
    reports: ComplianceReport[]
}

export function ComplianceReportList({ reports }: ComplianceReportListProps) {
    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center border rounded-3xl bg-muted/10 border-dashed">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No Reports Yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Generate your first CRA compliance report from the Triage page to see it listed here.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>Report Type</TableHead>
                        <TableHead>Generated Date</TableHead>
                        <TableHead>Generator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {report.reportType.replace(/_/g, " ")}
                                </div>
                            </TableCell>
                            <TableCell suppressHydrationWarning>
                                {format(report.generatedAt, "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{report.generatorEmail}</TableCell>
                            <TableCell>
                                {report.sentToRegulator ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                                        <CheckCircle className="h-3 w-3" /> Sent
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
                                        <XCircle className="h-3 w-3" /> Pending
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="gap-2 h-8">
                                    <Download className="h-3.5 w-3.5" />
                                    Download
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
