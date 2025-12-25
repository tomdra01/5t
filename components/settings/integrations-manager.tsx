"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { getSettings, updateSettings } from "@/app/settings/actions"
import { toast } from "sonner"

export function IntegrationsManager() {
    const [apiKey, setApiKey] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isConfigured, setIsConfigured] = useState(false)

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettings()
                if (settings?.nvd_api_key) {
                    setApiKey(settings.nvd_api_key)
                    setIsConfigured(true)
                }
            } catch (e) {
                console.error("Failed to load settings", e)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateSettings({ nvd_api_key: apiKey })
            setIsConfigured(!!apiKey)
            toast.success("Settings saved successfully")
        } catch (e) {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Database className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Integrations</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* OSV Section */}
                <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">SBOM Scanner API (OSV.dev)</p>
                            <span className="flex items-center text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Primary scanner for initial discovery. No configuration required.
                        </p>
                    </div>
                </div>

                {/* NVD Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Vulnerability Database (NVD)</p>
                                {isLoading ? (
                                    <span className="h-4 w-12 bg-muted animate-pulse rounded" />
                                ) : isConfigured ? (
                                    <span className="flex items-center text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Configured
                                    </span>
                                ) : (
                                    <span className="flex items-center text-xs text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                                        <AlertCircle className="w-3 h-3 mr-1" /> Optional
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Used for "Enrichment" (fetching official scores). API Key recommended for higher rate limits.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="nvd-key" className="sr-only">NVD API Key</Label>
                            <Input
                                id="nvd-key"
                                placeholder="NVD API Key (starts with nvd_...)"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                type="password"
                                className="bg-background"
                            />
                        </div>
                        <Button onClick={handleSave} disabled={isSaving || isLoading} variant="default">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Don't have a key? <a href="https://nvd.nist.gov/developers/request-an-api-key" target="_blank" rel="noreferrer" className="underline hover:text-primary">Request one here</a>.
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}
