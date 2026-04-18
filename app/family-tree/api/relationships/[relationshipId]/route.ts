import { NextResponse } from 'next/server'
import { deleteRelationship } from '@/lib/family-tree/supabase/queries'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ relationshipId: string }> },
) {
  try {
    const { relationshipId } = await params
    await deleteRelationship(relationshipId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
