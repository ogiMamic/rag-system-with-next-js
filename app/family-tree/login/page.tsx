import { Suspense } from 'react'
import { AuthForm } from '@/components/family-tree/ui/AuthForm'

export const metadata = { title: 'Prijava — Porodično Stablo' }

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  )
}
