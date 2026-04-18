'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Message } from '@/lib/marketplace/types'

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setSending(true)
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: trimmed }),
    })
    setSending(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(`Greška: ${err.error ?? 'pokušajte ponovo'}`)
      return
    }
    const json = await res.json()
    setMessages((prev) => (prev.some((x) => x.id === json.message.id) ? prev : [...prev, json.message]))
    setBody('')
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/20 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Pošaljite prvu poruku.</p>
        )}
        {messages.map((m) => {
          const own = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  own ? 'bg-primary text-primary-foreground' : 'bg-background border'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className={`mt-1 text-[10px] ${own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Napišite poruku…"
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const formEl = (e.currentTarget as HTMLTextAreaElement).form
              if (formEl) formEl.requestSubmit()
            }
          }}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? '…' : 'Pošalji'}
        </Button>
      </form>
    </div>
  )
}
