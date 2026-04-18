import { createClient as createServerClient } from '@/lib/supabase/server'
import type { FamilyTree, Person, Relationship, TreeGraph } from '@/lib/family-tree/types'
import type { PersonInput, RelationshipInput, TreeInput } from '@/lib/family-tree/schemas/person'

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function listTrees(): Promise<FamilyTree[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('family_trees')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTree(treeId: string): Promise<FamilyTree | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('family_trees')
    .select('*')
    .eq('id', treeId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getTreeGraph(treeId: string): Promise<TreeGraph> {
  const supabase = await createServerClient()
  const [personsRes, relsRes] = await Promise.all([
    supabase.from('persons').select('*').eq('tree_id', treeId).order('created_at'),
    supabase.from('relationships').select('*').eq('tree_id', treeId),
  ])
  if (personsRes.error) throw personsRes.error
  if (relsRes.error) throw relsRes.error
  return {
    persons: (personsRes.data ?? []) as Person[],
    relationships: (relsRes.data ?? []) as Relationship[],
  }
}

export async function createTree(input: TreeInput): Promise<FamilyTree> {
  const supabase = await createServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('family_trees')
    .insert({ owner_id: userData.user.id, name: input.name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTree(treeId: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('family_trees').delete().eq('id', treeId)
  if (error) throw error
}

export async function createPerson(treeId: string, input: PersonInput): Promise<Person> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('persons')
    .insert({ tree_id: treeId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePerson(personId: string, input: PersonInput): Promise<Person> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('persons')
    .update(input)
    .eq('id', personId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePerson(personId: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('persons').delete().eq('id', personId)
  if (error) throw error
}

export async function createRelationship(
  treeId: string,
  input: RelationshipInput,
): Promise<Relationship> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('relationships')
    .insert({ tree_id: treeId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRelationship(id: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.from('relationships').delete().eq('id', id)
  if (error) throw error
}
