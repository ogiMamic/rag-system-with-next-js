'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg(null)

    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-medium">Link poslan!</p>
        <p className="mt-1">
          Provjerite svoj email ({email}) i kliknite na link za prijavu. Link važi 1 sat.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email adresa</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vi@primjer.ba"
          className="mt-1"
        />
      </div>
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <Button type="submit" disabled={status === 'sending'} className="w-full">
        {status === 'sending' ? 'Slanje…' : 'Pošalji link za prijavu'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Nema šifre. Dobit ćete jednokratni link na email.
      </p>
    </form>
  )
}
