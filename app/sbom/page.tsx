"use client"

import type React from "react"

import { useState } from "react"
import { Container } from "@/components/layout/container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Package, AlertTriangle, Search, Filter } from "lucide-react"

export default function SBOMPage() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      console.log("[v0] SBOM file dropped:", files[0].name)
    }
  }

  return (
    <Container>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">SBOM Portal</h1>
          <p className="text-muted-foreground text-lg">
            Software Bill of Materials management and vulnerability tracking
          </p>
        </div>

        {/* Upload Zone */}
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-card",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Upload SBOM File</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Drag and drop your SBOM file here, or click to browse. Supports SPDX and CycloneDX formats (JSON, XML).
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </Card>

        {/* Quick Stats - Empty State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Components</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Vulnerable Components</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Vulnerabilities</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Component Table - Empty State */}
        <Card className="border-border bg-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Component Inventory</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search components..." className="pl-9 w-64" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Component</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Version</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">License</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vulnerabilities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No components uploaded yet. Upload an SBOM file to get started.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
