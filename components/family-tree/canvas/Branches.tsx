'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { PersonPosition } from '@/lib/family-tree/types'
import type { Edge } from '@/lib/family-tree/layout/computePositions'

type Props = {
  positions: Map<string, PersonPosition>
  edges: Edge[]
}

/**
 * Procedural branches between parents and children.
 * Each parent→child edge is an extruded tube along a Catmull-Rom curve.
 */
export function Branches({ positions, edges }: Props) {
  const { geometry, material } = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []

    for (const edge of edges) {
      if (edge.type !== 'parent') continue
      const from = positions.get(edge.fromId)
      const to = positions.get(edge.toId)
      if (!from || !to) continue

      // Control points — curve outwards and slightly upwards for organic feel
      const start = new THREE.Vector3(from.x, from.y, from.z)
      const end = new THREE.Vector3(to.x, to.y, to.z)
      const mid = start.clone().lerp(end, 0.5)
      const outwards = mid.clone().setY(0).normalize().multiplyScalar(0.5)
      mid.add(outwards)
      mid.y -= 0.2

      const curve = new THREE.CatmullRomCurve3([start, mid, end], false, 'catmullrom', 0.5)
      const tube = new THREE.TubeGeometry(curve, 16, 0.08, 8, false)
      geometries.push(tube)
    }

    if (geometries.length === 0) {
      return { geometry: null, material: null }
    }

    const merged = mergeBufferGeometries(geometries)
    const mat = new THREE.MeshStandardMaterial({
      color: '#6b4226',
      roughness: 0.9,
      metalness: 0,
    })
    return { geometry: merged, material: mat }
  }, [positions, edges])

  if (!geometry || !material) return null

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />
}

// Minimal geometry merger (BufferGeometryUtils subset) to avoid import path issues
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry()
  const attributes: Record<string, THREE.BufferAttribute[]> = {}
  let indexTotal = 0
  const indices: number[] = []
  let vertexOffset = 0

  for (const geom of geometries) {
    for (const name in geom.attributes) {
      const attr = geom.attributes[name]
      if (!(attr instanceof THREE.BufferAttribute)) continue
      if (!attributes[name]) attributes[name] = []
      attributes[name].push(attr)
    }
    const idx = geom.getIndex()
    const vertexCount = geom.attributes.position.count
    if (idx) {
      for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + vertexOffset)
      indexTotal += idx.count
    }
    vertexOffset += vertexCount
  }

  for (const name in attributes) {
    const attrs = attributes[name]
    const itemSize = attrs[0].itemSize
    const total = attrs.reduce((s, a) => s + a.count * itemSize, 0)
    const array = new Float32Array(total)
    let offset = 0
    for (const a of attrs) {
      array.set(a.array as Float32Array, offset)
      offset += a.count * itemSize
    }
    merged.setAttribute(name, new THREE.BufferAttribute(array, itemSize))
  }

  if (indexTotal > 0) {
    merged.setIndex(indices)
  }
  return merged
}
