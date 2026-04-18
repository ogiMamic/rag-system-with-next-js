import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  type: z.enum(['tourism', 'product']),
  category: z.string().min(1).max(64),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  price_minor: z.number().int().min(0).max(100_000_000),
  currency: z.string().length(3).default('BAM'),
  unit: z.string().max(16).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  location_village: z.string().max(120).nullable().optional(),
  status: z.enum(['draft', 'active', 'paused']).default('draft'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({ ...parsed.data, seller_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ listing: data })
}
