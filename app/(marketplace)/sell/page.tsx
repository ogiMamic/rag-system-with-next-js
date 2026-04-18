import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/marketplace/auth'
import { getOwnListings } from '@/lib/marketplace/listings'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/marketplace/types'
import { publicImageUrl } from '@/lib/marketplace/storage'

export const metadata = { title: 'Moje ponude | Omarska Marketplace' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nacrt',
  active: 'Aktivno',
  paused: 'Pauzirano',
  removed: 'Uklonjeno',
}

export default async function SellDashboard() {
  const profile = await requireProfile()

  if (profile.role !== 'seller' && profile.role !== 'admin') {
    redirect('/profile?onboarding=become-seller')
  }

  const listings = await getOwnListings(profile.id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje ponude</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upravljajte svojim proizvodima i turističkim ponudama.
          </p>
        </div>
        <Link href="/sell/listings/new">
          <Button>+ Nova ponuda</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="mb-4 text-muted-foreground">Još nemate ponuda.</p>
          <Link href="/sell/listings/new">
            <Button>Kreiraj prvu ponudu</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {listings.map((l) => {
            const cover = l.images?.sort((a, b) => a.position - b.position)[0]
            return (
              <li key={l.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={publicImageUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      bez slike
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/sell/listings/${l.id}/edit`} className="block font-medium hover:underline">
                    {l.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {l.type === 'product' ? 'Proizvod' : 'Turizam'} · {STATUS_LABEL[l.status] ?? l.status} ·{' '}
                    {formatPrice(l.price_minor, l.currency)}
                    {l.unit && ` / ${l.unit}`}
                  </p>
                </div>
                <Link href={`/listings/${l.id}`}>
                  <Button variant="ghost" size="sm">
                    Pregled
                  </Button>
                </Link>
                <Link href={`/sell/listings/${l.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Uredi
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
