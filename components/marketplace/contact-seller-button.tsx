'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ContactSellerButton({
  listingId,
  isAuthenticated,
  isOwnListing,
}: {
  listingId: string
  isAuthenticated: boolean
  isOwnListing: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (isOwnListing) {
    return (
      <Button disabled className="w-full" size="lg">
        Vaša ponuda
      </Button>
    )
  }

  async function handleClick() {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(`/listings/${listingId}`)}`)
      return
    }
    setLoading(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId }),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(`Greška: ${err.error ?? 'pokušajte ponovo'}`)
      return
    }
    const json = await res.json()
    router.push(`/messages/${json.conversation.id}`)
  }

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full" size="lg">
      {loading ? 'Otvaranje…' : 'Kontaktiraj prodavca'}
    </Button>
  )
}
