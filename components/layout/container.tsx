import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return <div className={cn("mx-auto max-w-screen-2xl px-6 py-6", className)}>{children}</div>
}
