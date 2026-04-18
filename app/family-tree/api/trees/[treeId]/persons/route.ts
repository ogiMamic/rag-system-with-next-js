import { NextResponse } from 'next/server'
import { createPerson } from '@/lib/family-tree/supabase/queries'
import { personSchema } from '@/lib/family-tree/schemas/person'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ treeId: string }> },
) {
  try {
    const { treeId } = await params
    const body = await request.json()
    const parsed = personSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }
    const person = await createPerson(treeId, parsed.data)
    return NextResponse.json(person, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
