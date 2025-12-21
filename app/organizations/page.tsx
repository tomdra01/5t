"use client"

import { Container } from "@/components/layout/container"
import { OrgProjectManager } from "@/components/settings/org-project-manager"

export default function OrganizationsPage() {
  return (
    <Container className="max-w-5xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-lg">Create organizations, invite members, and manage projects.</p>
      </div>
      <OrgProjectManager />
    </Container>
  )
}
