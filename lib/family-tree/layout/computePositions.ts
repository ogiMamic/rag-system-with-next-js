import type { Person, PersonPosition, Relationship } from '@/lib/family-tree/types'

const GEN_HEIGHT = 3
const BASE_RADIUS = 2.8
const RADIUS_PER_GEN = 1.4

/**
 * Generational 3D layout.
 * Ancestors upward (positive Y). Descendants outward (larger XZ radius).
 * Siblings distributed angularly within parent's angular sector.
 * Spouses placed adjacent with a small angular offset.
 */
export function computePositions(
  persons: Person[],
  relationships: Relationship[],
): Map<string, PersonPosition> {
  const result = new Map<string, PersonPosition>()
  if (persons.length === 0) return result

  // Build parent→children and child→parents maps
  const childrenOf = new Map<string, Set<string>>()
  const parentsOf = new Map<string, Set<string>>()
  const spousesOf = new Map<string, Set<string>>()

  for (const p of persons) {
    childrenOf.set(p.id, new Set())
    parentsOf.set(p.id, new Set())
    spousesOf.set(p.id, new Set())
  }

  for (const r of relationships) {
    if (r.type === 'parent') {
      childrenOf.get(r.person_a_id)?.add(r.person_b_id)
      parentsOf.get(r.person_b_id)?.add(r.person_a_id)
    } else if (r.type === 'spouse') {
      spousesOf.get(r.person_a_id)?.add(r.person_b_id)
      spousesOf.get(r.person_b_id)?.add(r.person_a_id)
    }
  }

  // Roots = persons with no parents (oldest ancestors)
  const roots = persons.filter((p) => parentsOf.get(p.id)!.size === 0)
  if (roots.length === 0) roots.push(persons[0])

  // BFS to assign generation depth (0 = root/top)
  const generation = new Map<string, number>()
  const queue: Array<{ id: string; gen: number }> = roots.map((r) => ({ id: r.id, gen: 0 }))
  while (queue.length > 0) {
    const { id, gen } = queue.shift()!
    const prev = generation.get(id)
    if (prev != null && prev <= gen) continue
    generation.set(id, gen)
    for (const childId of childrenOf.get(id) ?? []) {
      queue.push({ id: childId, gen: gen + 1 })
    }
  }

  // Persons not reached (disconnected) → gen 0
  for (const p of persons) {
    if (!generation.has(p.id)) generation.set(p.id, 0)
  }

  // Group by generation
  const byGen = new Map<number, string[]>()
  for (const [id, gen] of generation) {
    if (!byGen.has(gen)) byGen.set(gen, [])
    byGen.get(gen)!.push(id)
  }

  // Assign angular position per generation
  const maxGen = Math.max(...byGen.keys())
  const placed = new Set<string>()

  for (let gen = 0; gen <= maxGen; gen++) {
    const ids = byGen.get(gen) ?? []
    // Pair spouses adjacently: build a stable ordering that places spouses next to each other
    const ordered = orderWithSpouses(ids, spousesOf)
    const n = ordered.length
    const radius = BASE_RADIUS + RADIUS_PER_GEN * gen
    // Ancestors up, descendants down
    const y = (maxGen / 2 - gen) * GEN_HEIGHT

    ordered.forEach((id, i) => {
      const theta = n === 1 ? 0 : (i / n) * Math.PI * 2
      const x = Math.cos(theta) * radius
      const z = Math.sin(theta) * radius
      result.set(id, { id, x, y, z, generation: gen })
      placed.add(id)
    })
  }

  // Safety net — any unplaced person
  for (const p of persons) {
    if (!placed.has(p.id)) {
      result.set(p.id, { id: p.id, x: 0, y: 0, z: 0, generation: 0 })
    }
  }

  return result
}

function orderWithSpouses(ids: string[], spousesOf: Map<string, Set<string>>): string[] {
  const remaining = new Set(ids)
  const ordered: string[] = []
  for (const id of ids) {
    if (!remaining.has(id)) continue
    ordered.push(id)
    remaining.delete(id)
    for (const spouseId of spousesOf.get(id) ?? []) {
      if (remaining.has(spouseId)) {
        ordered.push(spouseId)
        remaining.delete(spouseId)
      }
    }
  }
  return ordered
}

export type Edge = { fromId: string; toId: string; type: 'parent' | 'spouse' }

export function buildEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((r) => ({
    fromId: r.person_a_id,
    toId: r.person_b_id,
    type: r.type,
  }))
}
