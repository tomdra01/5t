import { Container } from "@/components/layout/container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, User, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <Container className="max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance">Settings</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Manage your compliance dashboard configuration</p>
        </div>

        {/* Notification Settings */}
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
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

        {/* User Profile */}
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-semibold">User Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input id="name" placeholder="John Doe" className="mt-2 rounded-2xl" />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input id="email" type="email" placeholder="john@example.com" className="mt-2 rounded-2xl" />
            </div>
            <div>
              <Label htmlFor="role" className="text-sm font-medium">
                Role
              </Label>
              <Input id="role" placeholder="Security Engineer" className="mt-2 rounded-2xl" />
            </div>
            <Button className="rounded-2xl">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
                <Database className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-semibold">Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
              <div>
                <p className="text-sm font-medium">SBOM Scanner API</p>
                <p className="text-xs text-muted-foreground mt-1">Connected</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
              <div>
                <p className="text-sm font-medium">Vulnerability Database</p>
                <p className="text-xs text-muted-foreground mt-1">Synced 2 hours ago</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
              <div>
                <p className="text-sm font-medium">Email Service</p>
                <p className="text-xs text-muted-foreground mt-1">Active</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
