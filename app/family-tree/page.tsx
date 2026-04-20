import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TreePine, Sparkles, Users, Share2 } from 'lucide-react'
import { t } from '@/lib/family-tree/i18n/bcs'

export default function FamilyTreeLanding() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <TreePine className="text-primary size-16" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.appName}</h1>
        <p className="text-muted-foreground max-w-xl text-lg">{t.tagline}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Feature icon={<Sparkles className="size-6" />} title="Interaktivno 3D">
          Organsko stablo sa lišćem koje zaista raste
        </Feature>
        <Feature icon={<Users className="size-6" />} title="Preci i potomci">
          Lako dodaj članove porodice i njihove odnose
        </Feature>
        <Feature icon={<Share2 className="size-6" />} title="Sigurno i privatno">
          Tvoji podaci, tvoj nalog — možeš dijeliti kad želiš
        </Feature>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/family-tree/signup">Registruj se besplatno</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/family-tree/login">Prijavi se</Link>
        </Button>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border bg-card flex flex-col items-center gap-2 rounded-lg border p-5">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{children}</p>
    </div>
  )
}
