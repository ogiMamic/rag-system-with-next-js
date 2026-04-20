import { NextResponse } from 'next/server'
import { deletePerson, updatePerson } from '@/lib/family-tree/supabase/queries'
import { personSchema } from '@/lib/family-tree/schemas/person'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  try {
    const { personId } = await params
    const body = await request.json()
    const parsed = personSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }
    const person = await updatePerson(personId, parsed.data)
    return NextResponse.json(person)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  try {
    const { personId } = await params
    await deletePerson(personId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
