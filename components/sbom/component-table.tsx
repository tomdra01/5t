"use client"

import { useState } from "react"
import { Search, Package, AlertTriangle, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SBOMComponent } from "@/types"
import { cn } from "@/lib/utils"

interface ComponentTableProps {
  components: SBOMComponent[]
}

export function ComponentTable({ components }: ComponentTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredComponents = components.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTypeIcon = (type: SBOMComponent["type"]) => {
    switch (type) {
      case "library":
        return <Package className="h-4 w-4" />
      case "framework":
        return <Shield className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: SBOMComponent["type"]) => {
    switch (type) {
      case "library":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "framework":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "application":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getVulnColor = (count: number) => {
    if (count === 0) return "text-green-600"
    if (count <= 2) return "text-primary"
    return "text-destructive"
  }

  return (
    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold">Component Inventory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-2xl border-border/50 bg-muted/30"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Component</TableHead>
                <TableHead className="font-semibold">Version</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">License</TableHead>
                <TableHead className="font-semibold text-right">Vulnerabilities</TableHead>
                <TableHead className="font-semibold text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponents.map((component) => (
                <TableRow key={component.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded-lg">{component.version}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("rounded-xl gap-1.5", getTypeColor(component.type))}>
                      {getTypeIcon(component.type)}
                      <span className="capitalize">{component.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{component.license || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {component.vulnerabilities > 0 && <AlertTriangle className="h-4 w-4 text-primary" />}
                      <span className={cn("font-semibold", getVulnColor(component.vulnerabilities))}>
                        {component.vulnerabilities}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(component.lastUpdated).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredComponents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No components found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
