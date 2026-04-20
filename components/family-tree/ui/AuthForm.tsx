'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/lib/family-tree/i18n/bcs'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/family-tree/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/family-tree/auth/callback?next=${encodeURIComponent(next)}`,
          },
        })
        if (error) throw error
        toast.success(t.auth.checkEmail)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success(t.auth.loginSuccess)
        router.push(next)
        router.refresh()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(mode === 'login' ? t.auth.loginError : t.auth.signupError, {
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  async function onGoogle() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/family-tree/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(t.auth.loginError, { description: msg })
      setLoading(false)
    }
  }

  const title = mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle
  const submit = mode === 'login' ? t.auth.login : t.auth.signup

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{t.tagline}</p>
      </div>

      <form onSubmit={onEmailSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t.common.loading : submit}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            {t.auth.orContinueWith}
          </span>
        </div>
      </div>

      <Button variant="outline" onClick={onGoogle} disabled={loading} className="w-full">
        {t.auth.google}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
        <Link
          href={mode === 'login' ? '/family-tree/signup' : '/family-tree/login'}
          className="text-foreground font-medium underline"
        >
          {mode === 'login' ? t.auth.signupHere : t.auth.loginHere}
        </Link>
      </p>
    </div>
  )
}
