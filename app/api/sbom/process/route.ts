import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { processSbomUpload } from "@/lib/services/scanner"
import type { SBOMComponent } from "@/types"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    projectId?: string
    components?: SBOMComponent[]
  }

  if (!body.projectId) {
    return NextResponse.json({ success: false, message: "Missing projectId." }, { status: 400 })
  }

  if (!Array.isArray(body.components)) {
    return NextResponse.json({ success: false, message: "Missing SBOM components." }, { status: 400 })
  }

  const supabase = await createClient()
  const result = await processSbomUpload(body.projectId, { components: body.components }, supabase)

  return NextResponse.json(result)
}
