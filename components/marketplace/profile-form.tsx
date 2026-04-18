'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Profile } from '@/lib/marketplace/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    village: profile.village ?? 'Omarska',
    phone_e164: profile.phone_e164 ?? '',
    viber_id: profile.viber_id ?? '',
    preferred_lang: profile.preferred_lang,
    bio: profile.bio ?? '',
    role: profile.role,
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        village: form.village || null,
        phone_e164: form.phone_e164 || null,
        viber_id: form.viber_id || null,
        preferred_lang: form.preferred_lang,
        bio: form.bio || null,
        role: form.role === 'admin' ? profile.role : form.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      toast.error(`Greška: ${error.message}`)
      return
    }
    toast.success('Profil spašen')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="full_name">Ime i prezime</Label>
        <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          placeholder="npr. Mirsad Hodžić"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="village">Selo / mjesto</Label>
        <Input
          id="village"
          value={form.village}
          onChange={(e) => setForm({ ...form, village: e.target.value })}
          placeholder="Omarska"
          className="mt-1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone_e164">Telefon</Label>
          <Input
            id="phone_e164"
            value={form.phone_e164}
            onChange={(e) => setForm({ ...form, phone_e164: e.target.value })}
            placeholder="+387 65 123 456"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="viber_id">Viber broj (opciono)</Label>
          <Input
            id="viber_id"
            value={form.viber_id}
            onChange={(e) => setForm({ ...form, viber_id: e.target.value })}
            placeholder="+387 65 123 456"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="preferred_lang">Jezik</Label>
        <select
          id="preferred_lang"
          value={form.preferred_lang}
          onChange={(e) => setForm({ ...form, preferred_lang: e.target.value as 'bs' | 'de' | 'en' })}
          className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="bs">Bosanski</option>
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <Label htmlFor="role">Uloga</Label>
        <select
          id="role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as 'buyer' | 'seller' | 'admin' })}
          className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          disabled={profile.role === 'admin'}
        >
          <option value="buyer">Kupac</option>
          <option value="seller">Prodavac</option>
          {profile.role === 'admin' && <option value="admin">Administrator</option>}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Prebacite na „Prodavac“ ako želite postavljati ponude.
        </p>
      </div>

      <div>
        <Label htmlFor="bio">O meni</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          placeholder="Kratko predstavite sebe i svoje domaćinstvo / proizvode."
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Spašavanje…' : 'Spasi profil'}
      </Button>
    </form>
  )
}
