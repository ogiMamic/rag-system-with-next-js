'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'draft', label: 'Nacrt' },
  { value: 'active', label: 'Aktivno' },
  { value: 'paused', label: 'Pauzirano' },
  { value: 'removed', label: 'Uklonjeno' },
]

export function AdminListingStatusSelect({
  listingId,
  current,
}: {
  listingId: string
  current: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(current)
  const [pending, startTransition] = useTransition()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setValue(next)
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      toast.error('Greška pri izmjeni statusa')
      setValue(current)
      return
    }
    toast.success('Status ažuriran')
    startTransition(() => router.refresh())
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={pending}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
