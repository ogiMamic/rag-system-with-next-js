import Link from 'next/link'
import { formatPrice, type ListingWithImages } from '@/lib/marketplace/types'
import { publicImageUrl } from '@/lib/marketplace/storage'

export function ListingCard({ listing }: { listing: ListingWithImages }) {
  const cover = listing.images?.sort((a, b) => a.position - b.position)[0]
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={publicImageUrl(cover.storage_path)}
            alt={cover.alt_text ?? listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Bez slike
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
            {listing.type === 'product' ? 'Proizvod' : 'Turizam'}
          </span>
          {listing.location_village && <span>{listing.location_village}</span>}
        </div>
        <h3 className="line-clamp-2 font-medium leading-snug">{listing.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold">{formatPrice(listing.price_minor, listing.currency)}</span>
          {listing.unit && <span className="text-xs text-muted-foreground">/ {listing.unit}</span>}
        </div>
      </div>
    </Link>
  )
}
