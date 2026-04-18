'use client'

import { useState } from 'react'
import { publicImageUrl } from '@/lib/marketplace/storage'
import type { ListingImage } from '@/lib/marketplace/types'

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const sorted = [...images].sort((a, b) => a.position - b.position)
  const [active, setActive] = useState(0)

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Bez slika
      </div>
    )
  }

  const main = sorted[active]
  return (
    <div>
      <div className="overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={publicImageUrl(main.storage_path)}
          alt={main.alt_text ?? title}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-md border-2 transition ${
                i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicImageUrl(img.storage_path)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
