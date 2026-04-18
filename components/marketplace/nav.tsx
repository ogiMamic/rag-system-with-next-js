import Link from 'next/link'
import { getSessionProfile } from '@/lib/marketplace/auth'
import { Button } from '@/components/ui/button'
import { SignOutButton } from './sign-out-button'

export async function Nav() {
  const profile = await getSessionProfile()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-lg">Omarska</span>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            Marketplace
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/listings" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">
            Ponude
          </Link>
          <Link href="/listings?type=tourism" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">
            Turizam
          </Link>
          <Link href="/listings?type=product" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent">
            Proizvodi
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {profile ? (
            <>
              <Link href="/messages" className="hidden text-sm font-medium hover:underline sm:inline-block">
                Poruke
              </Link>
              <Link href="/sell" className="hidden sm:inline-block">
                <Button variant="outline" size="sm">
                  Moje ponude
                </Button>
              </Link>
              <Link href="/profile" className="hidden text-sm font-medium hover:underline sm:inline-block">
                {profile.full_name || 'Profil'}
              </Link>
              {profile.role === 'admin' && (
                <Link href="/admin" className="hidden text-xs font-medium text-primary hover:underline md:inline-block">
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">Prijava</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
