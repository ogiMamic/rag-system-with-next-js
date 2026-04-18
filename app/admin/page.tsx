import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin | Omarska Marketplace' }
export const dynamic = 'force-dynamic'

async function counts() {
  const supabase = await createClient()
  const [listings, sellers, buyers, conversations] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabase.from('conversations').select('id', { count: 'exact', head: true }),
  ])
  return {
    listings: listings.count ?? 0,
    sellers: sellers.count ?? 0,
    buyers: buyers.count ?? 0,
    conversations: conversations.count ?? 0,
  }
}

export default async function AdminHome() {
  const c = await counts()
  const cards = [
    { label: 'Ponude', value: c.listings, href: '/admin/listings' },
    { label: 'Prodavci', value: c.sellers, href: '/admin/users?role=seller' },
    { label: 'Kupci', value: c.buyers, href: '/admin/users?role=buyer' },
    { label: 'Razgovori', value: c.conversations, href: '/admin' },
  ]
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Admin pregled</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border bg-card p-5 transition hover:shadow-md"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
