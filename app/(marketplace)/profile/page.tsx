import { requireProfile } from '@/lib/marketplace/auth'
import { ProfileForm } from '@/components/marketplace/profile-form'

export const metadata = { title: 'Moj profil | Omarska Marketplace' }

export default async function ProfilePage() {
  const profile = await requireProfile()
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Moj profil</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Ove informacije vide kupci kada pogledaju vaše ponude. Popunite profil da povećate povjerenje.
      </p>
      <ProfileForm profile={profile} />
    </div>
  )
}
