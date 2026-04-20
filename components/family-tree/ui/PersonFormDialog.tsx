'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Person } from '@/lib/family-tree/types'
import type { PersonInput } from '@/lib/family-tree/schemas/person'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/lib/family-tree/i18n/bcs'

type Props = {
  treeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Person
}

export function PersonFormDialog({ treeId, open, onOpenChange, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<PersonInput>(emptyForm())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              first_name: initial.first_name,
              last_name: initial.last_name ?? '',
              maiden_name: initial.maiden_name ?? '',
              birth_date: initial.birth_date ?? '',
              death_date: initial.death_date ?? '',
              gender: initial.gender ?? null,
              bio: initial.bio ?? '',
              photo_url: initial.photo_url ?? '',
            }
          : emptyForm(),
      )
    }
  }, [open, initial])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim()) {
      toast.error(t.person.firstNameRequired)
      return
    }
    setLoading(true)
    try {
      const url = initial
        ? `/family-tree/api/persons/${initial.id}`
        : `/family-tree/api/trees/${treeId}/persons`
      const method = initial ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Greška')
      }
      toast.success(t.person.saveSuccess)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error(t.person.saveError, {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? t.person.editTitle : t.person.addTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="first_name">{t.person.firstName} *</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="last_name">{t.person.lastName}</Label>
              <Input
                id="last_name"
                value={form.last_name ?? ''}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maiden_name">{t.person.maidenName}</Label>
              <Input
                id="maiden_name"
                value={form.maiden_name ?? ''}
                onChange={(e) => setForm({ ...form, maiden_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="birth_date">{t.person.birthDate}</Label>
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date ?? ''}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="death_date">{t.person.deathDate}</Label>
              <Input
                id="death_date"
                type="date"
                value={form.death_date ?? ''}
                onChange={(e) => setForm({ ...form, death_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">{t.person.gender}</Label>
            <select
              id="gender"
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              value={form.gender ?? ''}
              onChange={(e) =>
                setForm({ ...form, gender: (e.target.value || null) as PersonInput['gender'] })
              }
            >
              <option value="">—</option>
              <option value="m">{t.person.genderM}</option>
              <option value="f">{t.person.genderF}</option>
              <option value="o">{t.person.genderO}</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">{t.person.bio}</Label>
            <Textarea
              id="bio"
              rows={4}
              value={form.bio ?? ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.dashboard.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t.common.loading : t.person.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function emptyForm(): PersonInput {
  return {
    first_name: '',
    last_name: '',
    maiden_name: '',
    birth_date: '',
    death_date: '',
    gender: null,
    bio: '',
    photo_url: '',
  }
}
