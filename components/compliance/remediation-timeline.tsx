import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import type { RemediationEffort } from "@/types"

interface RemediationTimelineProps {
  efforts: RemediationEffort[]
}

export function RemediationTimeline({ efforts }: RemediationTimelineProps) {
  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Remediation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {efforts.map((effort, index) => (
            <div key={effort.vulnerabilityId} className="relative flex gap-4">
              {/* Timeline Line */}
              {index < efforts.length - 1 && <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border/50" />}

              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 flex-shrink-0 relative z-10">
                <CheckCircle className="h-6 w-6" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold text-foreground">{effort.action}</h4>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(effort.takenAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{effort.outcome}</p>
                <code className="text-xs bg-muted/50 px-2 py-1 rounded-lg mt-2 inline-block">
                  {effort.vulnerabilityId}
                </code>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
