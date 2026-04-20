import { Suspense } from 'react'
import { AuthForm } from '@/components/family-tree/ui/AuthForm'

export const metadata = { title: 'Registracija — Porodično Stablo' }

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  )
}
