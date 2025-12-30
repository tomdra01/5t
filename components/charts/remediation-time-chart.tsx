"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays } from "date-fns"

interface RemediationTimeChartProps {
    vulnerabilities: Array<{
        status: string | null
        discovered_at: string
        updated_at: string | null
    }>
}

export function RemediationTimeChart({ vulnerabilities }: RemediationTimeChartProps) {
    const generateTrendData = () => {
        const days = 30
        const data = []
        const now = new Date()

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i)
            const dateStr = format(date, "yyyy-MM-dd")

            // Get vulnerabilities patched on this day
            const dailyPatched = vulnerabilities.filter((v) => {
                if (!v.updated_at || !["Patched", "resolved"].includes(v.status || "")) return false
                const updated = new Date(v.updated_at)
                return format(updated, "yyyy-MM-dd") === dateStr
            })

            // Calculate average remediation time for this day (in hours)
            let avgHours = 0
            if (dailyPatched.length > 0) {
                const totalHours = dailyPatched.reduce((sum, v) => {
                    const discovered = new Date(v.discovered_at)
                    const updated = new Date(v.updated_at!)
                    return sum + (updated.getTime() - discovered.getTime()) / 3600000
                }, 0)
                avgHours = Math.round(totalHours / dailyPatched.length)
            }

            data.push({
                date: format(date, "MMM dd"),
                avgHours: avgHours,
            })
        }

        return data
    }

    const data = generateTrendData()

    return (
        <Card className="border-border/60 bg-card/70">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Remediation Speed</CardTitle>
                <CardDescription>Average hours to patch per day (Last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs text-muted-foreground"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                            className="text-xs text-muted-foreground"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="avgHours"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                            name="Avg Patch Time (h)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
