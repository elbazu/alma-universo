/**
 * lib/rules.ts — PocketBase CRUD helpers for the `rules` collection.
 *
 * Rules are community guidelines. Only the admin can create/update/delete.
 */
import { getPb } from '@/lib/pocketbase'

export interface RuleRecord {
  id: string
  title: string
  body: string
  course: string
  sort_order: number
}

function recordToRule(rec: Record<string, unknown>): RuleRecord {
  return {
    id: rec.id as string,
    title: (rec.title as string) || '',
    body: (rec.body as string) || '',
    course: (rec.course as string) || '',
    sort_order: (rec.sort_order as number) ?? 0,
  }
}

/** List hub-level rules (not tied to a course), sorted by sort_order. */
export async function listHubRules(): Promise<RuleRecord[]> {
  try {
    const list = await getPb().collection('rules').getFullList({
      filter: 'course = ""',
      sort: 'sort_order,created',
      requestKey: 'rules_hub',
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToRule)
  } catch {
    return []
  }
}

export interface RuleData {
  title: string
  body: string
  course?: string
}

/** Create a new rule. Admin only. */
export async function createRule(data: RuleData, sortOrder: number): Promise<RuleRecord | null> {
  try {
    const rec = await getPb().collection('rules').create({
      title: data.title,
      body: data.body,
      course: data.course || '',
      sort_order: sortOrder,
    })
    return recordToRule(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createRule error:', err)
    return null
  }
}

/** Update an existing rule. Admin only. */
export async function updateRule(
  id: string,
  data: Partial<RuleData & { sort_order: number }>
): Promise<RuleRecord | null> {
  try {
    const rec = await getPb().collection('rules').update(id, data)
    return recordToRule(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('updateRule error:', err)
    return null
  }
}

/** Delete a rule. Admin only. */
export async function deleteRule(id: string): Promise<boolean> {
  try {
    await getPb().collection('rules').delete(id)
    return true
  } catch {
    return false
  }
}

/** Reorder rules by setting sort_order sequentially. Admin only. */
export async function reorderRules(ids: string[]): Promise<void> {
  const pb = getPb()
  await Promise.all(
    ids.map((id, idx) => pb.collection('rules').update(id, { sort_order: idx }))
  )
}
