import { createClient } from '@/lib/supabase/client'

export const LISTING_BUCKET = 'listing-images'

export function publicImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return ''
  return `${base}/storage/v1/object/public/${LISTING_BUCKET}/${storagePath}`
}

export async function uploadListingImage(
  userId: string,
  listingId: string,
  file: File,
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`
  const storagePath = `${userId}/${listingId}/${fileName}`

  const { error } = await supabase.storage
    .from(LISTING_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${safeExt}`,
    })

  if (error) throw new Error(error.message)
  return storagePath
}
