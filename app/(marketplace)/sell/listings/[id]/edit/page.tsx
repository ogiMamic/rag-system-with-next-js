import { notFound, redirect } from 'next/navigation'
import { requireProfile } from '@/lib/marketplace/auth'
import { getListing } from '@/lib/marketplace/listings'
import { ListingForm } from '@/components/marketplace/listing-form'

export const metadata = { title: 'Uredi ponudu | Omarska Marketplace' }

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await requireProfile()
  const listing = await getListing(id)
  if (!listing) notFound()
  if (listing.seller_id !== profile.id && profile.role !== 'admin') {
    redirect('/sell')
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Uredi ponudu</h1>
      <p className="mb-8 text-sm text-muted-foreground">{listing.title}</p>
      <ListingForm mode="edit" userId={profile.id} initial={listing} />
    </div>
  )
}
