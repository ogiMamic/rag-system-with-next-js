import Link from 'next/link'
import { requireProfile } from '@/lib/marketplace/auth'
import { listConversations } from '@/lib/marketplace/conversations'

export const metadata = { title: 'Poruke | Omarska Marketplace' }
export const dynamic = 'force-dynamic'

export default async function MessagesInbox() {
  const profile = await requireProfile()
  const conversations = await listConversations(profile.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Poruke</h1>

      {conversations.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
          <p>Nemate još razgovora.</p>
          <Link href="/listings" className="mt-3 inline-block text-primary hover:underline">
            Pogledajte ponude
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {conversations.map((c) => {
            const isBuyer = c.buyer_id === profile.id
            const other = isBuyer ? c.seller : c.buyer
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-start gap-4 p-4 hover:bg-accent/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(other?.full_name ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{other?.full_name ?? 'Korisnik'}</p>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(c.last_message_at).toLocaleDateString('bs-BA')}
                      </time>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.listing?.title ?? 'Ponuda obrisana'}
                    </p>
                    {c.last_message_body && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{c.last_message_body}</p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
