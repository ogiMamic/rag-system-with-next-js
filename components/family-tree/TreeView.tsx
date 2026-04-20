'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Person, Relationship } from '@/lib/family-tree/types'
import { TreeCanvas } from '@/components/family-tree/canvas/TreeCanvas'
import { PersonSheet } from '@/components/family-tree/ui/PersonSheet'
import { PersonFormDialog } from '@/components/family-tree/ui/PersonFormDialog'
import { TopNav } from '@/components/family-tree/ui/TopNav'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/family-tree/i18n/bcs'

type Props = {
  treeId: string
  treeName: string
  persons: Person[]
  relationships: Relationship[]
}

export function TreeView({ treeId, treeName, persons, relationships }: Props) {
  const [selected, setSelected] = useState<Person | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  function onSelect(person: Person) {
    setSelected(person)
    setSheetOpen(true)
  }

  return (
    <div className="flex h-dvh flex-col">
      <TopNav
        extra={
          <>
            <span className="text-muted-foreground hidden text-sm sm:inline">{treeName}</span>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus /> {t.nav.addPerson}
            </Button>
          </>
        }
      />

      <main className="relative flex-1 overflow-hidden">
        {persons.length === 0 ? (
          <div className="bg-background/60 absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
            <p className="text-muted-foreground text-center">{t.tree.empty}</p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> {t.nav.addPerson}
            </Button>
          </div>
        ) : null}

        <TreeCanvas
          persons={persons}
          relationships={relationships}
          selectedId={selected?.id ?? null}
          onSelect={onSelect}
        />
      </main>

      <PersonSheet
        treeId={treeId}
        person={selected}
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o)
          if (!o) setSelected(null)
        }}
      />

      <PersonFormDialog treeId={treeId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
