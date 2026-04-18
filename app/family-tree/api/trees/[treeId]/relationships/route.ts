import { NextResponse } from 'next/server'
import { createRelationship } from '@/lib/family-tree/supabase/queries'
import { relationshipSchema } from '@/lib/family-tree/schemas/person'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ treeId: string }> },
) {
  try {
    const { treeId } = await params
    const body = await request.json()
    const parsed = relationshipSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }
    const rel = await createRelationship(treeId, parsed.data)
    return NextResponse.json(rel, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
