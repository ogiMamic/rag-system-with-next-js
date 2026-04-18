import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  listing_id: z.string().uuid(),
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
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', parsed.data.listing_id)
    .maybeSingle()

  if (!listing) return NextResponse.json({ error: 'listing not found' }, { status: 404 })
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'cannot contact own listing' }, { status: 400 })
  }
  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'listing not active' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('listing_id', listing.id)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ conversation: existing })

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ conversation: created })
}
