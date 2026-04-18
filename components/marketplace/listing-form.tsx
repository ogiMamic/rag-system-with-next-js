'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  categoriesFor,
  PRODUCT_CATEGORIES,
  TOURISM_CATEGORIES,
  UNITS,
  type ListingType,
  type ListingWithImages,
} from '@/lib/marketplace/types'
import { ImageUploader } from './image-uploader'

type Mode = 'create' | 'edit'

export function ListingForm({
  mode,
  userId,
  initial,
}: {
  mode: Mode
  userId: string
  initial?: ListingWithImages
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: (initial?.type ?? 'product') as ListingType,
    category: initial?.category ?? PRODUCT_CATEGORIES[0].value,
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    price_major: initial ? (initial.price_minor / 100).toFixed(2) : '',
    currency: initial?.currency ?? 'BAM',
    unit: initial?.unit ?? '',
    stock: initial?.stock != null ? String(initial.stock) : '',
    location_village: initial?.location_village ?? 'Omarska',
    status: (initial?.status ?? 'draft') as 'draft' | 'active' | 'paused',
  })

  const cats = categoriesFor(form.type)

  function setType(t: ListingType) {
    const newCats = t === 'product' ? PRODUCT_CATEGORIES : TOURISM_CATEGORIES
    setForm({ ...form, type: t, category: newCats[0].value })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const priceMajor = parseFloat(form.price_major.replace(',', '.'))
    if (isNaN(priceMajor) || priceMajor < 0) {
      toast.error('Unesite ispravnu cijenu')
      setSaving(false)
      return
    }
    const payload = {
      type: form.type,
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      price_minor: Math.round(priceMajor * 100),
      currency: form.currency.toUpperCase(),
      unit: form.unit || null,
      stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
      location_village: form.location_village || null,
      status: form.status,
    }

    const url = mode === 'create' ? '/api/listings' : `/api/listings/${initial!.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(`Greška: ${err.error ?? 'pokušajte ponovo'}`)
      return
    }
    const json = await res.json()
    const listingId = mode === 'create' ? json.listing.id : initial!.id

    toast.success(mode === 'create' ? 'Ponuda kreirana — sada dodajte slike' : 'Ponuda spašena')
    if (mode === 'create') {
      router.push(`/sell/listings/${listingId}/edit`)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label>Tip ponude</Label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setType('product')}
              className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium transition ${
                form.type === 'product'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:bg-accent'
              }`}
            >
              Domaći proizvod
            </button>
            <button
              type="button"
              onClick={() => setType('tourism')}
              className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium transition ${
                form.type === 'tourism'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-input hover:bg-accent'
              }`}
            >
              Turizam
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Kategorija</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {cats.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="title">Naslov</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            minLength={3}
            maxLength={160}
            placeholder={form.type === 'product' ? 'npr. Domaći cvjetni med, 1 kg' : 'npr. Seosko domaćinstvo Hodžić'}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Opis</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            placeholder="Opišite proizvod ili ponudu detaljno…"
            className="mt-1"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price_major">Cijena</Label>
            <Input
              id="price_major"
              inputMode="decimal"
              value={form.price_major}
              onChange={(e) => setForm({ ...form, price_major: e.target.value })}
              required
              placeholder="15.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="currency">Valuta</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="BAM">BAM</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <Label htmlFor="unit">Jedinica</Label>
            <select
              id="unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">—</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.type === 'product' && (
          <div>
            <Label htmlFor="stock">Količina na zalihama (opciono)</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="npr. 20"
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label htmlFor="location_village">Selo / lokacija</Label>
          <Input
            id="location_village"
            value={form.location_village}
            onChange={(e) => setForm({ ...form, location_village: e.target.value })}
            placeholder="Omarska"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'active' | 'paused' })}
            className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="draft">Nacrt (nevidljivo)</option>
            <option value="active">Aktivno (vidljivo kupcima)</option>
            <option value="paused">Pauzirano</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Spašavanje…' : mode === 'create' ? 'Kreiraj ponudu' : 'Spasi izmjene'}
          </Button>
          <Link href="/sell">
            <Button type="button" variant="ghost">
              Otkaži
            </Button>
          </Link>
        </div>
      </form>

      {mode === 'edit' && initial && (
        <div className="border-t pt-8">
          <h2 className="mb-2 text-xl font-semibold">Slike</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Dodajte do 10 slika. Prva slika je glavna.
          </p>
          <ImageUploader listingId={initial.id} userId={userId} initial={initial.images ?? []} />
        </div>
      )}
    </div>
  )
}
