/**
 * lib/categories.ts — PocketBase CRUD helpers for the `categories` collection.
 *
 * Categories belong to the hub (no course) or to a specific course.
 * Only the admin can create/update/delete (enforced by PB rules).
 */
import { getPb } from '@/lib/pocketbase'

export interface CategoryRecord {
  id: string
  name: string
  slug: string
  emoji: string
  description: string
  course: string
  sort_order: number
}

function recordToCategory(rec: Record<string, unknown>): CategoryRecord {
  return {
    id: rec.id as string,
    name: (rec.name as string) || '',
    slug: (rec.slug as string) || '',
    emoji: (rec.emoji as string) || '',
    description: (rec.description as string) || '',
    course: (rec.course as string) || '',
    sort_order: (rec.sort_order as number) ?? 0,
  }
}

/** List all hub-level categories (no course attached), sorted by sort_order. */
export async function listHubCategories(): Promise<CategoryRecord[]> {
  try {
    const list = await getPb().collection('categories').getFullList({
      filter: 'course = ""',
      sort: 'sort_order,name',
      requestKey: 'categories_hub',
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToCategory)
  } catch {
    return []
  }
}

/** List all categories for a specific course. */
export async function listCourseCategories(courseId: string): Promise<CategoryRecord[]> {
  try {
    const list = await getPb().collection('categories').getFullList({
      filter: `course = "${courseId}"`,
      sort: 'sort_order,name',
      requestKey: `categories_course_${courseId}`,
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToCategory)
  } catch {
    return []
  }
}

export interface CategoryData {
  name: string
  emoji?: string
  description?: string
  course?: string
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** Create a new category. Admin only. */
export async function createCategory(
  data: CategoryData,
  sortOrder: number
): Promise<CategoryRecord | null> {
  try {
    const rec = await getPb().collection('categories').create({
      name: data.name,
      slug: toSlug(data.name),
      emoji: data.emoji || '',
      description: data.description || '',
      course: data.course || '',
      sort_order: sortOrder,
    })
    return recordToCategory(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createCategory error:', err)
    return null
  }
}

/** Update an existing category. Admin only. */
export async function updateCategory(
  id: string,
  data: Partial<CategoryData & { sort_order: number }>
): Promise<CategoryRecord | null> {
  try {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) {
      payload.name = data.name
      payload.slug = toSlug(data.name)
    }
    if (data.emoji !== undefined) payload.emoji = data.emoji
    if (data.description !== undefined) payload.description = data.description
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order

    const rec = await getPb().collection('categories').update(id, payload)
    return recordToCategory(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('updateCategory error:', err)
    return null
  }
}

/** Delete a category. Admin only. */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await getPb().collection('categories').delete(id)
    return true
  } catch {
    return false
  }
}

/** Reorder categories by setting sort_order sequentially. Admin only. */
export async function reorderCategories(ids: string[]): Promise<void> {
  const pb = getPb()
  await Promise.all(
    ids.map((id, idx) => pb.collection('categories').update(id, { sort_order: idx }))
  )
}
