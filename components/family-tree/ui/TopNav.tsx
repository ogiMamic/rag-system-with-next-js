'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TreePine, LogOut } from 'lucide-react'
import { t } from '@/lib/family-tree/i18n/bcs'

type Props = {
  showLogout?: boolean
  extra?: React.ReactNode
}

export function TopNav({ showLogout = true, extra }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function onLogout() {
    await supabase.auth.signOut()
    router.push('/family-tree/login')
    router.refresh()
  }

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 backdrop-blur">
      <Link href="/family-tree/dashboard" className="flex items-center gap-2 font-semibold">
        <TreePine className="size-5" />
        <span>{t.appName}</span>
      </Link>
      <div className="flex items-center gap-2">
        {extra}
        {showLogout && (
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="size-4" /> {t.nav.logout}
          </Button>
        )}
      </div>
    </header>
  )
}
