"use client"

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RadialComplianceChartProps {
    totalVulnerabilities: number
    overdueDeadlines: number
}

export function RadialComplianceChart({ totalVulnerabilities, overdueDeadlines }: RadialComplianceChartProps) {
    // Calculate compliance score (100% - % of overdue)
    const score = totalVulnerabilities === 0 ? 100 : Math.max(0, Math.round(100 - (overdueDeadlines / totalVulnerabilities) * 100))

    const data = [
        {
            name: "Compliance",
            value: score,
            fill: score >= 80 ? "hsl(var(--primary))" : score >= 50 ? "hsl(45 93% 47%)" : "hsl(0 84% 60%)",
        },
    ]

    return (
        <Card className="border-border/60 bg-card/70">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Compliance Health Score</CardTitle>
                <CardDescription>Based on overdue deadlines</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center">
                    <div className="relative">
                        <ResponsiveContainer width={200} height={200}>
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="100%"
                                data={data}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                    fill="hsl(var(--primary))"
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-foreground">{score}%</span>
                            <span className="text-sm text-muted-foreground">
                                {score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Action Needed"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Vulnerabilities:</span>
                        <span className="font-medium">{totalVulnerabilities}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Overdue Deadlines:</span>
                        <span className="font-medium text-destructive">{overdueDeadlines}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
