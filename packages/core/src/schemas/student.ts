import { z } from 'zod'

export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

export const Branding = z.object({
  appName: z.string(),
  brandColor: HexColor,
})
export type Branding = z.infer<typeof Branding>

export const Me = z.object({
  id: z.string(),
  firstName: z.string(),
  fullName: z.string(),
  branding: Branding,
})
export type Me = z.infer<typeof Me>
