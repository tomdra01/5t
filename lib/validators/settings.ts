import { z } from "zod"

export const updateSettingsSchema = z.object({
  nvd_api_key: z.string().optional(),
  hybrid_scanning_enabled: z.boolean().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
