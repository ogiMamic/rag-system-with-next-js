import { z } from 'zod'

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === '' || v == null ? null : v))

export const personSchema = z.object({
  first_name: z.string().trim().min(1, 'Ime je obavezno'),
  last_name: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v)),
  maiden_name: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v)),
  birth_date: optionalDate,
  death_date: optionalDate,
  gender: z.enum(['m', 'f', 'o']).optional().nullable(),
  bio: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v)),
  photo_url: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v)),
})

export type PersonInput = z.infer<typeof personSchema>

export const treeSchema = z.object({
  name: z.string().trim().min(1, 'Naziv stabla je obavezan').max(80),
})

export type TreeInput = z.infer<typeof treeSchema>

export const relationshipSchema = z.object({
  person_a_id: z.string().uuid(),
  person_b_id: z.string().uuid(),
  type: z.enum(['parent', 'spouse']),
})

export type RelationshipInput = z.infer<typeof relationshipSchema>
