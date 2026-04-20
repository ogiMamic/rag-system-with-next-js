import { NextResponse } from 'next/server'
import { deleteTree, getTree } from '@/lib/family-tree/supabase/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ treeId: string }> },
) {
  try {
    const { treeId } = await params
    const tree = await getTree(treeId)
    if (!tree) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(tree)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ treeId: string }> },
) {
  try {
    const { treeId } = await params
    await deleteTree(treeId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
