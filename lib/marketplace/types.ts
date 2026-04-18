export type UserRole = 'buyer' | 'seller' | 'admin'
export type Lang = 'bs' | 'de' | 'en'
export type ListingType = 'tourism' | 'product'
export type ListingStatus = 'draft' | 'active' | 'paused' | 'removed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  village: string | null
  phone_e164: string | null
  viber_id: string | null
  preferred_lang: Lang
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  type: ListingType
  category: string
  title: string
  description: string
  price_minor: number
  currency: string
  unit: string | null
  stock: number | null
  location_village: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  alt_text: string | null
  position: number
  created_at: string
}

export interface ListingWithImages extends Listing {
  images: ListingImage[]
  seller?: Pick<Profile, 'id' | 'full_name' | 'village' | 'avatar_url'> | null
}

export interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export interface ConversationListItem extends Conversation {
  listing: Pick<Listing, 'id' | 'title' | 'type'> | null
  buyer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  seller: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  last_message_body: string | null
}

export const PRODUCT_CATEGORIES = [
  { value: 'med', label: 'Med' },
  { value: 'rakija', label: 'Rakija' },
  { value: 'sir', label: 'Sir' },
  { value: 'ajvar', label: 'Ajvar' },
  { value: 'meso', label: 'Meso i suhomesnati proizvodi' },
  { value: 'voce', label: 'Voće i povrće' },
  { value: 'pekarski', label: 'Pekarski proizvodi' },
  { value: 'rukotvorine', label: 'Rukotvorine' },
  { value: 'ostalo-proizvod', label: 'Ostalo' },
] as const

export const TOURISM_CATEGORIES = [
  { value: 'smjestaj', label: 'Smještaj' },
  { value: 'seosko-domacinstvo', label: 'Seosko domaćinstvo' },
  { value: 'ture', label: 'Ture i izleti' },
  { value: 'iskustvo', label: 'Tradicionalno iskustvo' },
  { value: 'ostalo-turizam', label: 'Ostalo' },
] as const

export const UNITS = ['kg', 'l', 'kom', 'noć', 'osoba', 'sat'] as const

export function categoriesFor(type: ListingType) {
  return type === 'product' ? PRODUCT_CATEGORIES : TOURISM_CATEGORIES
}

export function formatPrice(priceMinor: number, currency: string = 'BAM') {
  const major = priceMinor / 100
  return `${major.toFixed(2)} ${currency}`
}
