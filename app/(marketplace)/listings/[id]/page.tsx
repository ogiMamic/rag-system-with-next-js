import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getListing } from '@/lib/marketplace/listings'
import { getSessionUser } from '@/lib/marketplace/auth'
import { ListingGallery } from '@/components/marketplace/listing-gallery'
import { ContactSellerButton } from '@/components/marketplace/contact-seller-button'
import { categoriesFor, formatPrice } from '@/lib/marketplace/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)
  return {
    title: listing ? `${listing.title} | Omarska Marketplace` : 'Ponuda | Omarska Marketplace',
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [listing, user] = await Promise.all([getListing(id), getSessionUser()])
  if (!listing || (listing.status !== 'active' && listing.seller_id !== user?.id)) {
    notFound()
  }

  const cats = categoriesFor(listing.type)
  const categoryLabel = cats.find((c) => c.value === listing.category)?.label ?? listing.category

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/listings" className="hover:underline">
          Sve ponude
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/listings?type=${listing.type}`} className="hover:underline">
          {listing.type === 'product' ? 'Proizvodi' : 'Turizam'}
        </Link>
        <span className="mx-2">/</span>
        <span>{categoryLabel}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <ListingGallery images={listing.images ?? []} title={listing.title} />
          <div className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {listing.type === 'product' ? 'Proizvod' : 'Turizam'}
              </span>
              <span>{categoryLabel}</span>
              {listing.location_village && <span>· {listing.location_village}</span>}
            </div>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{listing.description}</div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-1 text-3xl font-bold">
              {formatPrice(listing.price_minor, listing.currency)}
              {listing.unit && <span className="ml-1 text-base font-normal text-muted-foreground">/ {listing.unit}</span>}
            </div>
            {listing.stock != null && (
              <p className="mb-4 text-xs text-muted-foreground">
                Dostupno: {listing.stock} {listing.unit ?? 'kom'}
              </p>
            )}
            <ContactSellerButton
              listingId={listing.id}
              isAuthenticated={!!user}
              isOwnListing={user?.id === listing.seller_id}
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Komunikacija direktno sa prodavcem putem platforme.
            </p>
          </div>

          {listing.seller && (
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Prodavac</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {(listing.seller.full_name ?? '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{listing.seller.full_name ?? 'Anonimni prodavac'}</p>
                  {listing.seller.village && (
                    <p className="text-xs text-muted-foreground">{listing.seller.village}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-medium">Sigurnost prvo</p>
            <p className="mt-1">
              Sve dogovore i plaćanja vodite preko platforme. Ne šaljite novac van Marketplacea.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
