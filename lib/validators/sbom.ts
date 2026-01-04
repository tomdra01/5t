import { z } from "zod"

export const uploadSbomSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  fileContent: z.string().min(1, "SBOM file cannot be empty"),
})

export type UploadSbomInput = z.infer<typeof uploadSbomSchema>
