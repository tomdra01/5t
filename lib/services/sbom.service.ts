import type { SupabaseClient } from "@supabase/supabase-js"
import { SbomRepository } from "../repositories/sbom.repository"
import { ComponentRepository } from "../repositories/component.repository"
import { VulnerabilityRepository } from "../repositories/vulnerability.repository"
import { VulnerabilityScanner } from "./vulnerability-scanner.service"
import { parseSbom, extractLicense, type ParsedComponent } from "../utils/sbom"
import { NotificationService } from "./notification.service"
import type { SbomUploadResult } from "../models/sbom"
import type { ComponentComparison } from "../models/component"

export class SbomService {
  private sbomRepo: SbomRepository
  private componentRepo: ComponentRepository
  private vulnerabilityRepo: VulnerabilityRepository
  private scanner: VulnerabilityScanner

  constructor(private supabase: SupabaseClient) {
    this.sbomRepo = new SbomRepository(supabase)
    this.componentRepo = new ComponentRepository(supabase)
    this.vulnerabilityRepo = new VulnerabilityRepository(supabase)
    this.scanner = new VulnerabilityScanner(supabase)
  }

  async uploadAndScan(
    projectId: string,
    userId: string,
    fileContent: string
  ): Promise<SbomUploadResult> {
    const components = parseSbom(fileContent)

    if (components.length === 0) {
      return {
        success: false,
        message: "No components found in SBOM",
        componentsInserted: 0,
        vulnerabilitiesInserted: 0,
      }
    }

    const latestVersionNumber = await this.sbomRepo.getLatestVersion(projectId)
    const newVersionNumber = latestVersionNumber + 1

    const sbomVersion = await this.sbomRepo.createVersion(
      projectId,
      newVersionNumber,
      userId,
      components.length
    )

    if (!sbomVersion) {
      return {
        success: false,
        message: "Failed to create SBOM version",
        componentsInserted: 0,
        vulnerabilitiesInserted: 0,
      }
    }

    const previousComponents = await this.loadPreviousComponents(projectId)
    const comparisons = this.compareComponents(components, previousComponents)

    let componentsInserted = 0
    let vulnerabilitiesInserted = 0
    let vulnerabilitiesAutoResolved = 0

    const componentsToInsert = components.map((comp: ParsedComponent) => ({
      project_id: projectId,
      sbom_version_id: sbomVersion.id,
      name: comp.name,
      version: comp.version,
      purl: this.generatePurl(comp) || null,
      license: extractLicense(comp) || null,
      author: comp.author || null,
    }))

    const insertedComponents = await this.componentRepo.createMany(componentsToInsert)
    componentsInserted = insertedComponents.length

    const upgradedComponents = comparisons.filter((c) => c.status === "upgraded")
    for (const upgrade of upgradedComponents) {
      if (upgrade.oldComponentId) {
        const resolved = await this.vulnerabilityRepo.patchVulnerabilitiesForComponent(
          upgrade.oldComponentId
        )
        vulnerabilitiesAutoResolved += resolved
      }
    }

    const scanQueue: Array<{ componentId: string; purl: string }> = []
    for (const component of insertedComponents) {
      if (component.purl) {
        scanQueue.push({ componentId: component.id, purl: component.purl })
      }
    }

    if (scanQueue.length > 0) {
      const purls = scanQueue.map((item) => item.purl)
      const scanResults = await this.scanner.scanMultipleComponents(purls)

      for (const item of scanQueue) {
        const result = scanResults.get(item.purl)
        if (result?.vulns && result.vulns.length > 0) {
          const count = await this.scanner.scanComponent(item.componentId, item.purl)
          vulnerabilitiesInserted += count
        }
      }
    }

    return {
      success: true,
      message: `Successfully scanned ${componentsInserted} components. Found ${vulnerabilitiesInserted} new vulnerabilities.`,
      componentsInserted,
      vulnerabilitiesInserted,
      componentsUpgraded: upgradedComponents.length,
      vulnerabilitiesAutoResolved,
    }
  }

  private async loadPreviousComponents(
    projectId: string
  ): Promise<Map<string, { id: string; version: string }>> {
    const latestVersion = await this.sbomRepo.getLatestVersion(projectId)
    const map = new Map<string, { id: string; version: string }>()

    if (latestVersion === 0) return map

    const components = await this.componentRepo.findByProjectId(projectId)
    for (const comp of components) {
      map.set(comp.name, { id: comp.id, version: comp.version })
    }

    return map
  }

  private compareComponents(
    newComponents: ParsedComponent[],
    previousComponents: Map<string, { id: string; version: string }>
  ): ComponentComparison[] {
    return newComponents.map((comp) => {
      const prev = previousComponents.get(comp.name)

      if (!prev) {
        return {
          name: comp.name,
          oldVersion: null,
          newVersion: comp.version,
          status: "new" as const,
        }
      }

      const comparison = this.compareVersions(prev.version, comp.version)

      if (comparison < 0) {
        return {
          name: comp.name,
          oldVersion: prev.version,
          newVersion: comp.version,
          status: "upgraded" as const,
          oldComponentId: prev.id,
        }
      }

      if (comparison > 0) {
        return {
          name: comp.name,
          oldVersion: prev.version,
          newVersion: comp.version,
          status: "downgraded" as const,
          oldComponentId: prev.id,
        }
      }

      return {
        name: comp.name,
        oldVersion: prev.version,
        newVersion: comp.version,
        status: "unchanged" as const,
        oldComponentId: prev.id,
      }
    })
  }

  private compareVersions(v1: string, v2: string): number {
    const clean = (v: string) =>
      v
        .replace(/^[v=]/i, "")
        .split(/[.-]/)
        .map((p) => parseInt(p) || 0)

    const parts1 = clean(v1)
    const parts2 = clean(v2)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }
    return 0
  }

  private generatePurl(component: ParsedComponent): string | undefined {
    if (component.purl) return component.purl

    const name = component.name.toLowerCase()
    if (name.startsWith("@") || !name.includes("/")) {
      return `pkg:npm/${component.name}@${component.version}`
    }

    return undefined
  }
}
