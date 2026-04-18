import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/marketplace/auth'
import { ListingForm } from '@/components/marketplace/listing-form'

export const metadata = { title: 'Nova ponuda | Omarska Marketplace' }

export default async function NewListingPage() {
  const profile = await requireProfile()
  if (profile.role !== 'seller' && profile.role !== 'admin') {
    redirect('/profile?onboarding=become-seller')
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Nova ponuda</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Popunite osnovne informacije, zatim ćete moći dodati slike.
      </p>
      <ListingForm mode="create" userId={profile.id} />
    </div>
  )
}
