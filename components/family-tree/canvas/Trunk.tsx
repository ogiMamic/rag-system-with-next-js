'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Procedural bark-textured trunk built from a tapered cylinder.
 * No external GLTF needed — keeps bundle small for MVP.
 */
export function Trunk({ height = 4 }: { height?: number }) {
  const ref = useRef<THREE.Group>(null)

  const barkTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    // Base bark color
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(0, 0, 256, 256)
    // Vertical bark streaks
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256
      const w = 1 + Math.random() * 3
      const shade = 30 + Math.floor(Math.random() * 40)
      ctx.fillStyle = `rgb(${shade + 20}, ${shade + 10}, ${shade})`
      ctx.fillRect(x, 0, w, 256)
    }
    // Horizontal cracks
    for (let i = 0; i < 25; i++) {
      const y = Math.random() * 256
      ctx.fillStyle = `rgba(20, 10, 5, ${0.4 + Math.random() * 0.3})`
      ctx.fillRect(0, y, 256, 1 + Math.random() * 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 3)
    return tex
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    // Very subtle sway to feel alive
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.005
  })

  return (
    <group ref={ref}>
      {/* Main trunk */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.55, height, 24, 1, false]} />
        <meshStandardMaterial map={barkTexture} roughness={0.95} metalness={0} />
      </mesh>
      {/* Ground mound */}
      <mesh position={[0, -height / 2, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.8, 0.4, 24]} />
        <meshStandardMaterial color="#3f2a18" roughness={1} />
      </mesh>
    </group>
  )
}
