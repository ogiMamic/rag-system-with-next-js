import { createClient } from '@/lib/supabase/server'
import type { ListingType, ListingWithImages } from './types'

export interface BrowseFilters {
  type?: ListingType
  category?: string
  village?: string
  minPriceMinor?: number
  maxPriceMinor?: number
  search?: string
  page?: number
  pageSize?: number
}

export async function browseListings(filters: BrowseFilters = {}): Promise<{
  items: ListingWithImages[]
  total: number
  page: number
  pageSize: number
}> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(48, filters.pageSize ?? 12)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('listings')
    .select('*, images:listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name, village, avatar_url)', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.village) query = query.ilike('location_village', `%${filters.village}%`)
  if (filters.minPriceMinor !== undefined) query = query.gte('price_minor', filters.minPriceMinor)
  if (filters.maxPriceMinor !== undefined) query = query.lte('price_minor', filters.maxPriceMinor)
  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, '')
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    items: (data ?? []) as ListingWithImages[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getListing(id: string): Promise<ListingWithImages | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, images:listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name, village, avatar_url)')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return (data as ListingWithImages) ?? null
}

export async function getOwnListings(sellerId: string): Promise<ListingWithImages[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*, images:listing_images(*)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ListingWithImages[]
}

export async function distinctVillages(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('location_village')
    .eq('status', 'active')
    .not('location_village', 'is', null)
    .limit(500)
  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.location_village) set.add(row.location_village)
  }
  return Array.from(set).sort()
}
