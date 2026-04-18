import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  storage_path: z.string().min(1).max(512),
  alt_text: z.string().max(200).nullable().optional(),
  position: z.number().int().min(0).max(99).default(0),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: listingId } = await params
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
    .from('listing_images')
    .insert({ ...parsed.data, listing_id: listingId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ image: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: listingId } = await params
  const url = new URL(request.url)
  const imageId = url.searchParams.get('image_id')
  if (!imageId) return NextResponse.json({ error: 'image_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: img } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('listing_id', listingId)
    .maybeSingle()

  const { error } = await supabase
    .from('listing_images')
    .delete()
    .eq('id', imageId)
    .eq('listing_id', listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (img?.storage_path) {
    await supabase.storage.from('listing-images').remove([img.storage_path])
  }

  return NextResponse.json({ ok: true })
}
