import type React from 'react'
import { Nav } from '@/components/marketplace/nav'
import { Toaster } from 'sonner'

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Omarska Marketplace — Podrška lokalnoj zajednici.</p>
          <p className="text-xs">Napravljeno za mještane Omarske i dijasporu.</p>
        </div>
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  )
}
