import Link from 'next/link'
import { browseListings, distinctVillages } from '@/lib/marketplace/listings'
import { ListingCard } from '@/components/marketplace/listing-card'
import { ListingFilters } from '@/components/marketplace/listing-filters'
import type { ListingType } from '@/lib/marketplace/types'

export const metadata = { title: 'Sve ponude | Omarska Marketplace' }
export const dynamic = 'force-dynamic'

function parseMoney(s: string | undefined): number | undefined {
  if (!s) return undefined
  const n = parseFloat(s.replace(',', '.'))
  if (isNaN(n) || n < 0) return undefined
  return Math.round(n * 100)
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : (sp[k] as string | undefined))

  const filters = {
    type: (get('type') as ListingType | undefined) || undefined,
    category: get('category') || undefined,
    village: get('village') || undefined,
    minPriceMinor: parseMoney(get('minPrice')),
    maxPriceMinor: parseMoney(get('maxPrice')),
    search: get('q') || undefined,
    page: get('page') ? parseInt(get('page')!, 10) : 1,
  }

  const [{ items, total, page, pageSize }, villages] = await Promise.all([
    browseListings(filters),
    distinctVillages(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const queryString = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v == null || k === 'page' ? [] : [[k, Array.isArray(v) ? v[0]! : v]],
    ) as [string, string][],
  ).toString()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Sve ponude</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? 'ponuda' : 'ponuda'} pronađeno
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ListingFilters villages={villages} />
        </aside>
        <div>
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              Nema ponuda za odabrane filtere.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(queryString)
                params.set('page', String(p))
                return (
                  <Link
                    key={p}
                    href={`/listings?${params.toString()}`}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      p === page ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
