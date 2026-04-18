import { notFound } from 'next/navigation'
import { getTree, getTreeGraph } from '@/lib/family-tree/supabase/queries'
import { TreeView } from '@/components/family-tree/TreeView'

export const dynamic = 'force-dynamic'

export default async function TreePage({
  params,
}: {
  params: Promise<{ treeId: string }>
}) {
  const { treeId } = await params
  const tree = await getTree(treeId)
  if (!tree) notFound()

  const graph = await getTreeGraph(treeId)

  return (
    <TreeView
      treeId={tree.id}
      treeName={tree.name}
      persons={graph.persons}
      relationships={graph.relationships}
    />
  )
}
