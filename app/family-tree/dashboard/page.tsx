import Link from 'next/link'
import { listTrees } from '@/lib/family-tree/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NewTreeDialog } from '@/components/family-tree/ui/NewTreeDialog'
import { t, formatDate } from '@/lib/family-tree/i18n/bcs'
import { TreePine } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const trees = await listTrees()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
        <NewTreeDialog />
      </div>

      {trees.length === 0 ? (
        <div className="border-border bg-muted/30 flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-12 text-center">
          <TreePine className="text-muted-foreground size-12" />
          <p className="text-muted-foreground">{t.dashboard.empty}</p>
          <NewTreeDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <Card key={tree.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="size-4" />
                  {tree.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  {formatDate(tree.updated_at)}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/family-tree/tree/${tree.id}`}>{t.dashboard.open}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
