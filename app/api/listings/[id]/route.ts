import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  type: z.enum(['tourism', 'product']).optional(),
  category: z.string().min(1).max(64).optional(),
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(10).max(4000).optional(),
  price_minor: z.number().int().min(0).max(100_000_000).optional(),
  currency: z.string().length(3).optional(),
  unit: z.string().max(16).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  location_village: z.string().max(120).nullable().optional(),
  status: z.enum(['draft', 'active', 'paused', 'removed']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'not found or forbidden' }, { status: 404 })
  return NextResponse.json({ listing: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
