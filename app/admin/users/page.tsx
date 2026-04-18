import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Admin – Korisnici' }
export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  buyer: 'Kupac',
  seller: 'Prodavac',
  admin: 'Administrator',
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (sp.role && ['buyer', 'seller', 'admin'].includes(sp.role)) {
    query = query.eq('role', sp.role)
  }
  const { data: users } = await query

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Korisnici</h1>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Ime</th>
              <th className="px-4 py-2 font-medium">Uloga</th>
              <th className="px-4 py-2 font-medium">Selo</th>
              <th className="px-4 py-2 font-medium">Telefon</th>
              <th className="px-4 py-2 font-medium">Registrovan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium">
                  {u.full_name ?? <span className="text-muted-foreground">bez imena</span>}
                </td>
                <td className="px-4 py-2">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-4 py-2">{u.village ?? '—'}</td>
                <td className="px-4 py-2">{u.phone_e164 ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('bs-BA')}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nema korisnika.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
