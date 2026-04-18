import Link from 'next/link'
import { browseListings } from '@/lib/marketplace/listings'
import { ListingCard } from '@/components/marketplace/listing-card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function MarketplaceHome() {
  const { items } = await browseListings({ pageSize: 8 })
  const tourism = items.filter((l) => l.type === 'tourism').slice(0, 4)
  const products = items.filter((l) => l.type === 'product').slice(0, 4)

  return (
    <div>
      <section className="border-b bg-gradient-to-br from-amber-50 via-background to-emerald-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Omarska Marketplace
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
              Povezujemo mještane Omarske sa dijasporom. Domaći proizvodi, seoska domaćinstva
              i turistička iskustva — direktno od ljudi koji ih prave.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/listings?type=product">
                <Button size="lg">Domaći proizvodi</Button>
              </Link>
              <Link href="/listings?type=tourism">
                <Button size="lg" variant="outline">
                  Seosko domaćinstvo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Njemačka · Austrija · Švedska · SAD · BiH
            </p>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Domaći proizvodi</h2>
            <Link href="/listings?type=product" className="text-sm text-primary hover:underline">
              Pogledaj sve →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {tourism.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Turizam</h2>
            <Link href="/listings?type=tourism" className="text-sm text-primary hover:underline">
              Pogledaj sve →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tourism.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted-foreground">
            Još nema aktivnih ponuda. Budite prvi — registrujte se i postavite ponudu.
          </p>
          <div className="mt-6">
            <Link href="/auth/login">
              <Button>Registracija / Prijava</Button>
            </Link>
          </div>
        </section>
      )}

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <h3 className="mb-2 font-semibold">Za prodavce</h3>
            <p className="text-sm text-muted-foreground">
              Postavljanje ponuda je besplatno. Platforma uzima proviziju tek kada ostvarite prodaju.
            </p>
            <Link href="/auth/login" className="mt-3 inline-block text-sm text-primary hover:underline">
              Počnite prodavati →
            </Link>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Za kupce</h3>
            <p className="text-sm text-muted-foreground">
              Pronađite originalne proizvode i iskustva direktno od mještana Omarske.
              Komunikacija i dogovori na platformi.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Kako radi</h3>
            <p className="text-sm text-muted-foreground">
              Kontaktirate prodavca, dogovorite detalje, a u narednoj fazi i platite karticom.
              Isplata prodavcu preko Pošte BiH.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
