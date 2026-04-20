'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pencil, Trash2 } from 'lucide-react'
import type { Person } from '@/lib/family-tree/types'
import { formatBirthDeath, t } from '@/lib/family-tree/i18n/bcs'
import { PersonFormDialog } from './PersonFormDialog'

type Props = {
  treeId: string
  person: Person | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonSheet({ treeId, person, open, onOpenChange }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    if (!person) return
    if (!confirm(t.person.confirmDelete)) return
    setDeleting(true)
    try {
      const res = await fetch(`/family-tree/api/persons/${person.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success(t.person.saveSuccess)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error(t.person.saveError, {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setDeleting(false)
    }
  }

  const initials = person
    ? (person.first_name[0] ?? '?') + (person.last_name?.[0] ?? '')
    : ''

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {person ? (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-14">
                    {person.photo_url ? (
                      <AvatarImage src={person.photo_url} alt={person.first_name} />
                    ) : null}
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <SheetTitle>
                      {person.first_name}
                      {person.last_name ? ` ${person.last_name}` : ''}
                    </SheetTitle>
                    {person.maiden_name ? (
                      <SheetDescription className="text-xs">
                        ({person.maiden_name})
                      </SheetDescription>
                    ) : null}
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <dl className="grid gap-3 text-sm">
                  {(person.birth_date || person.death_date) && (
                    <div className="grid gap-1">
                      <dt className="text-muted-foreground text-xs uppercase">
                        {t.person.born} / {t.person.died}
                      </dt>
                      <dd>{formatBirthDeath(person.birth_date, person.death_date)}</dd>
                    </div>
                  )}
                  {person.bio && (
                    <div className="grid gap-1">
                      <dt className="text-muted-foreground text-xs uppercase">
                        {t.person.bio}
                      </dt>
                      <dd className="whitespace-pre-wrap">{person.bio}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="flex gap-2 border-t p-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil /> {t.person.edit}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  <Trash2 /> {t.person.delete}
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {person && (
        <PersonFormDialog
          treeId={treeId}
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={person}
        />
      )}
    </>
  )
}
