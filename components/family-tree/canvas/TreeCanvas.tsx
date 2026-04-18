'use client'

import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { Person, Relationship } from '@/lib/family-tree/types'
import { Scene } from './Scene'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/family-tree/i18n/bcs'

type Props = {
  persons: Person[]
  relationships: Relationship[]
  selectedId: string | null
  onSelect: (person: Person) => void
}

export function TreeCanvas({ persons, relationships, selectedId, onSelect }: Props) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Pause autorotate briefly when user interacts
  useEffect(() => {
    const handler = () => {
      setAutoRotate(false)
      clearTimeout((handler as unknown as { timeout?: ReturnType<typeof setTimeout> }).timeout)
      ;(handler as unknown as { timeout?: ReturnType<typeof setTimeout> }).timeout = setTimeout(
        () => setAutoRotate(true),
        8000,
      )
    }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('wheel', handler)
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('wheel', handler)
    }
  }, [])

  if (!mounted) {
    return <Skeleton className="h-full w-full" />
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 10], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      aria-label={t.appName}
    >
      <Suspense fallback={null}>
        <Scene
          persons={persons}
          relationships={relationships}
          selectedId={selectedId}
          onSelect={onSelect}
          autoRotate={autoRotate}
        />
      </Suspense>
    </Canvas>
  )
}
