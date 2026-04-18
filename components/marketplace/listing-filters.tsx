'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PRODUCT_CATEGORIES, TOURISM_CATEGORIES, type ListingType } from '@/lib/marketplace/types'

export function ListingFilters({ villages }: { villages: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const currentType = (searchParams.get('type') as ListingType | null) ?? ''
  const cats = currentType === 'tourism' ? TOURISM_CATEGORIES : currentType === 'product' ? PRODUCT_CATEGORIES : []

  const [form, setForm] = useState({
    type: currentType,
    category: searchParams.get('category') ?? '',
    village: searchParams.get('village') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    q: searchParams.get('q') ?? '',
  })

  function apply(next: typeof form) {
    const params = new URLSearchParams()
    if (next.type) params.set('type', next.type)
    if (next.category) params.set('category', next.category)
    if (next.village) params.set('village', next.village)
    if (next.minPrice) params.set('minPrice', next.minPrice)
    if (next.maxPrice) params.set('maxPrice', next.maxPrice)
    if (next.q) params.set('q', next.q)
    startTransition(() => router.push(`/listings?${params.toString()}`))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    apply(form)
  }

  function clear() {
    const empty = { type: '', category: '', village: '', minPrice: '', maxPrice: '', q: '' }
    setForm(empty)
    apply(empty)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <Label htmlFor="q">Pretraga</Label>
        <Input
          id="q"
          value={form.q}
          onChange={(e) => setForm({ ...form, q: e.target.value })}
          placeholder="med, rakija, sir…"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="type">Tip</Label>
        <select
          id="type"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ListingType | '', category: '' })}
          className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Sve</option>
          <option value="product">Proizvodi</option>
          <option value="tourism">Turizam</option>
        </select>
      </div>

      {cats.length > 0 && (
        <div>
          <Label htmlFor="category">Kategorija</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Sve kategorije</option>
            {cats.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {villages.length > 0 && (
        <div>
          <Label htmlFor="village">Selo / mjesto</Label>
          <select
            id="village"
            value={form.village}
            onChange={(e) => setForm({ ...form, village: e.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Sva</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="minPrice">Min cijena</Label>
          <Input
            id="minPrice"
            inputMode="decimal"
            value={form.minPrice}
            onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
            placeholder="0"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="maxPrice">Max cijena</Label>
          <Input
            id="maxPrice"
            inputMode="decimal"
            value={form.maxPrice}
            onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
            placeholder="—"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          Primijeni
        </Button>
        <Button type="button" variant="ghost" onClick={clear} disabled={pending}>
          Očisti
        </Button>
      </div>
    </form>
  )
}
