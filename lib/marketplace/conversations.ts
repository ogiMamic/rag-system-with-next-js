import { createClient } from '@/lib/supabase/server'
import type { ConversationListItem, Message } from './types'

export async function listConversations(userId: string): Promise<ConversationListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings(id, title, type),
      buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })
  if (error) throw new Error(error.message)

  const conversations = (data ?? []) as unknown as ConversationListItem[]

  if (conversations.length === 0) return []

  const ids = conversations.map((c) => c.id)
  const { data: lastMsgs } = await supabase
    .from('messages')
    .select('conversation_id, body, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false })

  const lastByConv = new Map<string, string>()
  for (const m of lastMsgs ?? []) {
    if (!lastByConv.has(m.conversation_id as string)) {
      lastByConv.set(m.conversation_id as string, m.body as string)
    }
  }
  return conversations.map((c) => ({ ...c, last_message_body: lastByConv.get(c.id) ?? null }))
}

export async function getConversation(conversationId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings(id, title, type, price_minor, currency),
      buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', conversationId)
    .maybeSingle()
  if (error || !data) return null
  if (data.buyer_id !== userId && data.seller_id !== userId) return null
  return data
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Message[]
}
