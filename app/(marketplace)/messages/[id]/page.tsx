import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireProfile } from '@/lib/marketplace/auth'
import { getConversation, listMessages } from '@/lib/marketplace/conversations'
import { MessageThread } from '@/components/marketplace/message-thread'
import { formatPrice } from '@/lib/marketplace/types'

export const metadata = { title: 'Razgovor | Omarska Marketplace' }
export const dynamic = 'force-dynamic'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await requireProfile()
  const convo = await getConversation(id, profile.id)
  if (!convo) notFound()

  const messages = await listMessages(id)
  const isBuyer = convo.buyer_id === profile.id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const other = isBuyer ? (convo as any).seller : (convo as any).buyer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listing = (convo as any).listing

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/messages" className="text-sm text-muted-foreground hover:underline">
        ← Sve poruke
      </Link>

      <div className="mb-4 mt-3 flex items-center gap-3 rounded-md border bg-card p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(other?.full_name ?? '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{other?.full_name ?? 'Korisnik'}</p>
          {listing && (
            <Link
              href={`/listings/${listing.id}`}
              className="block truncate text-xs text-muted-foreground hover:underline"
            >
              {listing.title} · {formatPrice(listing.price_minor, listing.currency)}
            </Link>
          )}
        </div>
      </div>

      <MessageThread conversationId={id} initialMessages={messages} currentUserId={profile.id} />
    </div>
  )
}
