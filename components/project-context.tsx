"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

interface ProjectContextValue {
  projectId: string
  organizationId: string
  setProjectId: (projectId: string) => void
  setOrganizationId: (organizationId: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = useState("")
  const [organizationId, setOrganizationIdState] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    const storedProject = window.localStorage.getItem("selectedProjectId") || ""
    const storedOrg = window.localStorage.getItem("selectedOrganizationId") || ""
    if (storedProject) {
      setProjectIdState(storedProject)
    }
    if (storedOrg) {
      setOrganizationIdState(storedOrg)
    }
  }, [])

  useEffect(() => {
    // Match any route starting with /orgId/projectId/...
    // Excluding special Next.js routes or assets if necessary, but broadly standard for this app
    const match = pathname.match(/^\/([^/]+)\/([^/]+)/)

    if (match) {
      // Ensure we don't pick up "api" or other system routes if they match this pattern 
      // (assuming UUIDs or specific slugs, but generic is fine for now if strict routes used)
      const potentialOrg = match[1]
      const potentialProj = match[2]

      // Simple check to avoid capturing non-ID paths if your generic routes collide
      // For now, trust the routing structure

      if (potentialProj && potentialProj !== "dashboard") {
        // Actually the previous regex was specific to dashboard. 
        // If your routes are /org/project/triage, this works.
        setProjectIdState(potentialProj)
        window.localStorage.setItem("selectedProjectId", potentialProj)
      }

      if (potentialOrg) {
        setOrganizationIdState(potentialOrg)
        window.localStorage.setItem("selectedOrganizationId", potentialOrg)
      }
    }
  }, [pathname])

  const value = useMemo<ProjectContextValue>(() => {
    return {
      projectId,
      organizationId,
      setProjectId: (nextId: string) => {
        setProjectIdState(nextId)
        window.localStorage.setItem("selectedProjectId", nextId)
      },
      setOrganizationId: (nextId: string) => {
        setOrganizationIdState(nextId)
        window.localStorage.setItem("selectedOrganizationId", nextId)
      },
    }
  }, [projectId, organizationId])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider.")
  }
  return context
}
