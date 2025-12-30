"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { uploadSbomSchema } from "@/lib/validators/sbom"
import { SbomService } from "@/lib/services/sbom.service"
import { handleError, AuthenticationError, ValidationError } from "@/lib/errors"
import type { SbomUploadResult } from "@/lib/models/sbom"

export async function uploadSbomAction(input: {
  projectId: string
  fileContent: string
}): Promise<SbomUploadResult> {
  try {
    const validated = uploadSbomSchema.parse(input)

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new AuthenticationError("You must be signed in to upload an SBOM")
    }

    const sbomService = new SbomService(supabase)
    const result = await sbomService.uploadAndScan(
      validated.projectId,
      userData.user.id,
      validated.fileContent
    )

    if (result.success) {
      revalidatePath(`/`)
      revalidatePath(`/${validated.projectId}`)
    }

    if (result.componentsUpgraded && result.componentsUpgraded > 0) {
      await import("@/app/sbom/enrichment-actions").then(
        ({ enrichVulnerabilitiesAction }) => {
          enrichVulnerabilitiesAction(validated.projectId).catch(() => {})
        }
      )
    }

    return result
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
        componentsInserted: 0,
        vulnerabilitiesInserted: 0,
      }
    }
    return handleError(error) as SbomUploadResult
  }
}
