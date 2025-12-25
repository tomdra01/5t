"use client"

import { Container } from "@/components/layout/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"
import { UserSummary } from "@/components/settings/user-summary"
import { IntegrationsManager } from "@/components/settings/integrations-manager"

export default function SettingsPage() {
  return (
    <Container className="max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your compliance dashboard configuration</p>
        </div>

        {/* Notification Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="critical-alerts" className="text-sm font-medium">
                  Critical Vulnerability Alerts
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Get notified for CVSS ≥9.0 vulnerabilities</p>
              </div>
              <Switch id="critical-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deadline-warnings" className="text-sm font-medium">
                  24-Hour Deadline Warnings
                </Label>
                <p className="text-xs text-muted-foreground mt-1">CRA Article 14 compliance reminders</p>
              </div>
              <Switch id="deadline-warnings" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports" className="text-sm font-medium">
                  Weekly Summary Reports
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Receive email digests every Monday</p>
              </div>
              <Switch id="weekly-reports" />
            </div>
          </CardContent>
        </Card>

        <UserSummary />

        {/* Integration Settings */}
        <IntegrationsManager />
      </div>
    </Container>
  )
}
