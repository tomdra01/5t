import type { SBOMComponent } from "@/types"

interface ParsedSBOM {
  components: SBOMComponent[]
  raw: UnknownRecord
}

type UnknownRecord = Record<string, unknown>

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function toComponentType(value: unknown): SBOMComponent["type"] {
  const type = asString(value)?.toLowerCase()
  switch (type) {
    case "library":
      return "library"
    case "framework":
      return "framework"
    case "application":
      return "application"
    case "operating-system":
    case "os":
      return "os"
    default:
      return "other"
  }
}

function parseDate(value: unknown): Date {
  const date = typeof value === "string" ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

function extractCycloneDxLicense(component: UnknownRecord): string | undefined {
  const licenses = asArray<UnknownRecord>(component.licenses)
  const license = licenses[0]?.license as UnknownRecord | undefined
  return (
    asString(license?.name) ||
    asString(license?.id) ||
    asString((component.license as UnknownRecord | undefined)?.name) ||
    asString((component.license as UnknownRecord | undefined)?.id)
  )
}

// Helper for server-side actions
export function extractLicense(component: any): string | null {
  if (!component) return null

  // Handle CycloneDX format
  if (component.licenses && Array.isArray(component.licenses)) {
    const license = component.licenses[0]?.license
    return license?.name || license?.id || null
  }

  // Handle SPDX format
  if (component.licenseConcluded) return component.licenseConcluded
  if (component.licenseDeclared) return component.licenseDeclared

  // Handle simple license object
  if (component.license) {
    if (typeof component.license === "string") return component.license
    if (component.license.id) return component.license.id
    if (component.license.name) return component.license.name
  }

  return null
}

function parseCycloneDX(data: UnknownRecord): ParsedSBOM {
  const vulnerabilityCounts = new Map<string, number>()
  const vulnerabilities = asArray<UnknownRecord>(data.vulnerabilities)

  for (const vuln of vulnerabilities) {
    const affects = asArray<UnknownRecord>(vuln.affects)
    for (const affect of affects) {
      const ref = asString(affect.ref)
      if (ref) {
        vulnerabilityCounts.set(ref, (vulnerabilityCounts.get(ref) ?? 0) + 1)
      }
    }
  }

  const components = asArray<UnknownRecord>(data.components).map((component, index) => {
    const bomRef =
      asString(component["bom-ref"]) || asString(component["bomRef"]) || asString(component.ref) || `component-${index}`
    return {
      id: bomRef,
      name: asString(component.name) || "Unknown",
      version: asString(component.version) || "Unknown",
      type: toComponentType(component.type),
      license: extractCycloneDxLicense(component),
      purl: asString(component.purl),
      author: asString(component.author),
      vulnerabilities: vulnerabilityCounts.get(bomRef) ?? 0,
      lastUpdated: parseDate((data.metadata as UnknownRecord | undefined)?.timestamp),
    }
  })

  return { components, raw: data }
}

function extractSpdxPurl(pkg: UnknownRecord): string | undefined {
  const refs = asArray<UnknownRecord>(pkg.externalRefs)
  for (const ref of refs) {
    const refType = asString(ref.referenceType)?.toLowerCase()
    if (refType === "purl" || refType === "package-url") {
      const locator = asString(ref.referenceLocator)
      if (locator) {
        return locator
      }
    }
  }
  return undefined
}

function parseSpdx(data: UnknownRecord): ParsedSBOM {
  const createdAt = parseDate((data.creationInfo as UnknownRecord | undefined)?.created)
  const packages = asArray<UnknownRecord>(data.packages)

  const components = packages.map((pkg, index) => {
    const id = asString(pkg.SPDXID) || `package-${index}`
    return {
      id,
      name: asString(pkg.name) || "Unknown",
      version: asString(pkg.versionInfo) || "Unknown",
      type: "library" as const,
      license: asString(pkg.licenseConcluded) || asString(pkg.licenseDeclared),
      vulnerabilities: 0,
      lastUpdated: createdAt,
    }
  })

  const normalizedComponents = packages.map((pkg) => {
    const license = asString(pkg.licenseConcluded) || asString(pkg.licenseDeclared)
    return {
      name: asString(pkg.name) || "Unknown",
      version: asString(pkg.versionInfo) || "Unknown",
      purl: extractSpdxPurl(pkg),
      author: asString(pkg.supplier) || asString(pkg.originator),
      license: license ? { id: license } : undefined,
    }
  })

  return { components, raw: { components: normalizedComponents } }
}

// Server-side SBOM parsing from string content
export function parseSbom(content: string): any[] {
  const data = JSON.parse(content) as UnknownRecord

  let parsed: ParsedSBOM

  if (typeof data.bomFormat === "string" && data.bomFormat.toLowerCase() === "cyclonedx") {
    parsed = parseCycloneDX(data)
  } else if (typeof data.spdxVersion === "string") {
    parsed = parseSpdx(data)
  } else {
    const components = asArray<UnknownRecord>(data.components)
    if (components.length > 0) {
      parsed = parseCycloneDX(data)
    } else {
      const spdxPackages = asArray<UnknownRecord>(data.packages)
      if (spdxPackages.length > 0) {
        parsed = parseSpdx(data)
      } else {
        throw new Error("Unsupported SBOM format. Please upload a CycloneDX or SPDX JSON file.")
      }
    }
  }

  // Return raw components for server actions
  return asArray(parsed.raw.components || data.components || data.packages)
}

// Client-side file parsing
export async function parseSbomFile(file: File): Promise<ParsedSBOM> {
  const contents = await file.text()
  const data = JSON.parse(contents) as UnknownRecord

  if (typeof data.bomFormat === "string" && data.bomFormat.toLowerCase() === "cyclonedx") {
    return parseCycloneDX(data)
  }

  if (typeof data.spdxVersion === "string") {
    return parseSpdx(data)
  }

  const components = asArray<UnknownRecord>(data.components)
  if (components.length > 0) {
    return parseCycloneDX(data)
  }

  const spdxPackages = asArray<UnknownRecord>(data.packages)
  if (spdxPackages.length > 0) {
    return parseSpdx(data)
  }

  throw new Error("Unsupported SBOM format. Please upload a CycloneDX or SPDX JSON file.")
}
