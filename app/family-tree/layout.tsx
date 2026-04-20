import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Porodično Stablo — Interaktivno 3D',
  description:
    'Kreiraj i istraži svoje porodično stablo u 3D-u. Dodaj pretke, potomke, fotografije i biografije.',
}

export default function FamilyTreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh" lang="bs">
      {children}
      <Toaster position="top-right" />
    </div>
  )
}
