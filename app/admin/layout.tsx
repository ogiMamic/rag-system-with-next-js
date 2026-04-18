import type React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/marketplace/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold tracking-tight">
            Omarska <span className="text-xs font-normal text-muted-foreground">/ admin</span>
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/admin" className="hover:underline">
              Pregled
            </Link>
            <Link href="/admin/listings" className="hover:underline">
              Ponude
            </Link>
            <Link href="/admin/users" className="hover:underline">
              Korisnici
            </Link>
            <Link href="/" className="text-muted-foreground hover:underline">
              ← Marketplace
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
