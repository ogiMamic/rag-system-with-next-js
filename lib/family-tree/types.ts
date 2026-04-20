export type Gender = 'm' | 'f' | 'o'
export type RelType = 'parent' | 'spouse'

export type FamilyTree = {
  id: string
  owner_id: string
  name: string
  is_public: boolean
  share_slug: string | null
  created_at: string
  updated_at: string
}

export type Person = {
  id: string
  tree_id: string
  first_name: string
  last_name: string | null
  maiden_name: string | null
  birth_date: string | null
  death_date: string | null
  gender: Gender | null
  photo_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type Relationship = {
  id: string
  tree_id: string
  person_a_id: string
  person_b_id: string
  type: RelType
  created_at: string
}

export type PersonPosition = {
  id: string
  x: number
  y: number
  z: number
  generation: number
}

export type TreeGraph = {
  persons: Person[]
  relationships: Relationship[]
}
