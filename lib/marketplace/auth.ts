import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from './types'

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (data) return data as Profile

  // Fallback: trigger missed — create the row now
  const { data: created } = await supabase
    .from('profiles')
    .insert({ id: user.id })
    .select()
    .maybeSingle()
  return (created as Profile) ?? null
}

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')
  return user
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== 'admin') redirect('/')
  return profile
}
