import { NextResponse } from 'next/server'
import { createTree, listTrees } from '@/lib/family-tree/supabase/queries'
import { treeSchema } from '@/lib/family-tree/schemas/person'

export async function GET() {
  try {
    const trees = await listTrees()
    return NextResponse.json(trees)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = treeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }
    const tree = await createTree(parsed.data)
    return NextResponse.json(tree, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
