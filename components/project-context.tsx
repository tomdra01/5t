"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

interface ProjectContextValue {
  projectId: string
  setProjectId: (projectId: string) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = useState("")

  useEffect(() => {
    const stored = window.localStorage.getItem("selectedProjectId") || ""
    if (stored) {
      setProjectIdState(stored)
    }
  }, [])

  const value = useMemo<ProjectContextValue>(() => {
    return {
      projectId,
      setProjectId: (nextId: string) => {
        setProjectIdState(nextId)
        window.localStorage.setItem("selectedProjectId", nextId)
      },
    }
  }, [projectId])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjectContext must be used within ProjectProvider.")
  }
  return context
}
