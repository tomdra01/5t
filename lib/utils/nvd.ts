interface NvdCveResponse {
    vulnerabilities: Array<{
        cve: {
            id: string
            metrics?: {
                cvssMetricV31?: Array<{
                    cvssData: {
                        baseScore: number
                        baseSeverity: string
                    }
                }>
                cvssMetricV2?: Array<{
                    cvssData: {
                        baseScore: number
                    }
                    baseSeverity: string
                }>
            }
        }
    }>
}

export async function fetchNvdData(cveId: string, apiKey?: string | null) {
    const headers: HeadersInit = {}
    if (apiKey) {
        headers["apiKey"] = apiKey
    }

    try {
        const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`, {
            method: "GET",
            headers,
            next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!response.ok) {
            // Handle 403/404/503
            console.warn(`NVD API Error for ${cveId}: ${response.status}`)
            return null
        }

        const data = (await response.json()) as NvdCveResponse
        const item = data.vulnerabilities?.[0]?.cve

        if (!item) return null

        // Prefer V3.1
        const v31 = item.metrics?.cvssMetricV31?.[0]
        if (v31) {
            return {
                nvd_score: v31.cvssData.baseScore,
                nvd_severity: v31.cvssData.baseSeverity,
                source: "NVD Verified",
            }
        }

        // Fallback V2
        const v2 = item.metrics?.cvssMetricV2?.[0]
        if (v2) {
            return {
                nvd_score: v2.cvssData.baseScore,
                nvd_severity: v2.baseSeverity,
                source: "NVD (V2)",
            }
        }

        return null
    } catch (error) {
        console.error(`NVD Fetch failed for ${cveId}`, error)
        return null
    }
}
