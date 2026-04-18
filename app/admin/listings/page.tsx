import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/marketplace/types'
import { AdminListingStatusSelect } from '@/components/marketplace/admin-listing-status-select'

export const metadata = { title: 'Admin – Ponude' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nacrt',
  active: 'Aktivno',
  paused: 'Pauzirano',
  removed: 'Uklonjeno',
}

export default async function AdminListings() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('*, seller:profiles!listings_seller_id_fkey(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sve ponude</h1>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Naslov</th>
              <th className="px-4 py-2 font-medium">Prodavac</th>
              <th className="px-4 py-2 font-medium">Tip</th>
              <th className="px-4 py-2 font-medium">Cijena</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(listings ?? []).map((l) => (
              <tr key={l.id}>
                <td className="max-w-xs truncate px-4 py-2">
                  <Link href={`/listings/${l.id}`} className="font-medium hover:underline">
                    {l.title}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(l as any).seller?.full_name ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2">{l.type === 'product' ? 'Proizvod' : 'Turizam'}</td>
                <td className="px-4 py-2">{formatPrice(l.price_minor, l.currency)}</td>
                <td className="px-4 py-2">
                  <AdminListingStatusSelect listingId={l.id} current={l.status} />
                </td>
                <td className="px-4 py-2">
                  <Link href={`/sell/listings/${l.id}/edit`} className="text-xs text-primary hover:underline">
                    Uredi
                  </Link>
                </td>
              </tr>
            ))}
            {(!listings || listings.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nema ponuda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Statusi: {Object.entries(STATUS_LABEL).map(([k, v]) => `${k}=${v}`).join(', ')}
      </p>
    </div>
  )
}
