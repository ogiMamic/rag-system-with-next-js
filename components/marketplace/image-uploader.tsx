'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadListingImage, publicImageUrl } from '@/lib/marketplace/storage'
import type { ListingImage } from '@/lib/marketplace/types'

const MAX_IMAGES = 10
const MAX_SIZE_MB = 8

export function ImageUploader({
  listingId,
  userId,
  initial,
}: {
  listingId: string
  userId: string
  initial: ListingImage[]
}) {
  const router = useRouter()
  const [images, setImages] = useState<ListingImage[]>(initial)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maksimalno ${MAX_IMAGES} slika po ponudi`)
      return
    }
    setUploading(true)
    try {
      let position = images.length
      const next: ListingImage[] = [...images]
      for (const file of files) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: prevelika (max ${MAX_SIZE_MB} MB)`)
          continue
        }
        const storagePath = await uploadListingImage(userId, listingId, file)
        const res = await fetch(`/api/listings/${listingId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage_path: storagePath, position }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(`Greška: ${err.error ?? 'upload'}`)
          continue
        }
        const json = await res.json()
        next.push(json.image)
        position += 1
      }
      setImages(next)
      router.refresh()
      toast.success('Slike dodane')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Greška pri uploadu')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(imageId: string) {
    const res = await fetch(`/api/listings/${listingId}/images?image_id=${imageId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast.error('Greška pri brisanju')
      return
    }
    setImages(images.filter((i) => i.id !== imageId))
    router.refresh()
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicImageUrl(img.storage_path)}
              alt={img.alt_text ?? ''}
              className="h-full w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                Glavna
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              className="absolute right-2 top-2 rounded bg-destructive/90 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"
            >
              Obriši
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-center text-sm text-muted-foreground hover:border-primary hover:text-primary">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFiles}
              disabled={uploading}
            />
            <span>{uploading ? 'Upload…' : '+ Dodaj sliku'}</span>
            <span className="mt-1 text-xs">JPG/PNG/WebP, max {MAX_SIZE_MB} MB</span>
          </label>
        )}
      </div>
    </div>
  )
}
