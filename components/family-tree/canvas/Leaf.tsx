'use client'

import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import type { Person, PersonPosition } from '@/lib/family-tree/types'

type Props = {
  person: Person
  position: PersonPosition
  selected: boolean
  onSelect: (person: Person) => void
}

export function Leaf({ person, position, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  const isDeceased = !!person.death_date
  const baseColor = isDeceased ? '#d97742' : '#4caf50'
  const emissiveColor = selected ? '#ffeb3b' : hovered ? '#aed581' : '#000000'
  const emissiveIntensity = selected ? 0.6 : hovered ? 0.4 : 0

  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.rotation.z = Math.sin(t * 1.2 + phase) * 0.1
    meshRef.current.rotation.x = Math.sin(t * 0.9 + phase) * 0.08
    const baseScale = selected ? 1.4 : hovered ? 1.25 : 1
    const wobble = 1 + Math.sin(t * 2 + phase) * 0.03
    meshRef.current.scale.setScalar(baseScale * wobble)
  })

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Leaf shape — ellipse plane */}
      <Billboard follow>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(person)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = ''
          }}
          castShadow
        >
          <circleGeometry args={[0.32, 24]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      </Billboard>

      {/* Label overlay */}
      <Html
        position={[0, -0.6, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium shadow-sm transition-opacity ${
            hovered || selected
              ? 'bg-background/95 text-foreground opacity-100'
              : 'bg-background/60 text-foreground/80 opacity-80'
          }`}
        >
          {person.first_name}
          {person.last_name ? ` ${person.last_name}` : ''}
        </div>
      </Html>
    </group>
  )
}
