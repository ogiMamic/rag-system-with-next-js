'use client'

import { useMemo } from 'react'
import { Environment, Sky, ContactShadows } from '@react-three/drei'
import type { Person, Relationship } from '@/lib/family-tree/types'
import {
  buildEdges,
  computePositions,
} from '@/lib/family-tree/layout/computePositions'
import { Trunk } from './Trunk'
import { Branches } from './Branches'
import { Leaf } from './Leaf'
import { CameraRig } from './CameraRig'

type Props = {
  persons: Person[]
  relationships: Relationship[]
  selectedId: string | null
  onSelect: (person: Person) => void
  autoRotate: boolean
}

export function Scene({ persons, relationships, selectedId, onSelect, autoRotate }: Props) {
  const positions = useMemo(
    () => computePositions(persons, relationships),
    [persons, relationships],
  )
  const edges = useMemo(() => buildEdges(relationships), [relationships])

  const selectedPerson = persons.find((p) => p.id === selectedId) ?? null
  const focusPosition = selectedPerson ? positions.get(selectedPerson.id) ?? null : null

  return (
    <>
      <Sky sunPosition={[10, 20, 10]} turbidity={4} rayleigh={1.5} />
      <Environment preset="forest" />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Trunk height={4} />
      <Branches positions={positions} edges={edges} />

      {persons.map((person) => {
        const pos = positions.get(person.id)
        if (!pos) return null
        return (
          <Leaf
            key={person.id}
            person={person}
            position={pos}
            selected={person.id === selectedId}
            onSelect={onSelect}
          />
        )
      })}

      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.45}
        scale={20}
        blur={2.2}
        far={8}
      />

      <CameraRig focusPosition={focusPosition} autoRotate={autoRotate} />
    </>
  )
}
