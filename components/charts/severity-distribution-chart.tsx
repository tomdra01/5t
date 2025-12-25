"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SeverityDistributionChartProps {
    vulnerabilities: Array<{
        severity: string | null
    }>
}

export function SeverityDistributionChart({ vulnerabilities }: SeverityDistributionChartProps) {
    // Count vulnerabilities by severity
    const severityCounts = {
        Critical: vulnerabilities.filter((v) => v.severity === "Critical").length,
        High: vulnerabilities.filter((v) => v.severity === "High").length,
        Medium: vulnerabilities.filter((v) => v.severity === "Medium").length,
        Low: vulnerabilities.filter((v) => v.severity === "Low").length,
    }

    const data = [
        { name: "Critical", count: severityCounts.Critical, color: "hsl(0 84% 60%)" },
        { name: "High", count: severityCounts.High, color: "hsl(24 95% 53%)" },
        { name: "Medium", count: severityCounts.Medium, color: "hsl(45 93% 47%)" },
        { name: "Low", count: severityCounts.Low, color: "hsl(142 76% 36%)" },
    ]

    return (
        <Card className="border-border/60 bg-card/70">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Severity Distribution</CardTitle>
                <CardDescription>Breakdown of vulnerabilities by severity level</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="name"
                            className="text-xs text-muted-foreground"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                            className="text-xs text-muted-foreground"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.count}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
