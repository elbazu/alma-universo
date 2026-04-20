import { getPb } from '@/lib/pocketbase'

/**
 * Thin wrapper around the `courses` PocketBase collection for the
 * "Mis Cursos" view. Sprint 1 is the real owner of course CRUD; this
 * file exists just to list + shape published courses for the settings
 * pane until Sprint 1's own module lands.
 */
export interface CourseLite {
  id: string
  title: string
  slug: string
  tagline: string
  thumbnail_url?: string
  cover_url?: string
  is_published: boolean
  sort_order: number
}

const COLLECTION = 'courses'

function fileUrl(collection: string, id: string, filename?: string): string | undefined {
  if (!filename) return undefined
  const client = getPb() as { baseUrl?: string; baseURL?: string }
  const base = (
    client.baseUrl ||
    client.baseURL ||
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    ''
  ).replace(/\/$/, '')
  return `${base}/api/files/${collection}/${id}/${filename}`
}

export function recordToCourseLite(rec: Record<string, unknown>): CourseLite {
  const id = rec.id as string
  return {
    id,
    title: (rec.title as string) || '',
    slug: (rec.slug as string) || '',
    tagline: (rec.tagline as string) || '',
    thumbnail_url: fileUrl(COLLECTION, id, rec.thumbnail as string | undefined),
    cover_url: fileUrl(COLLECTION, id, rec.cover_image as string | undefined),
    is_published: Boolean(rec.is_published),
    sort_order: (rec.sort_order as number) || 0,
  }
}

/**
 * All published courses, sorted by sort_order. Returns [] if the
 * `courses` collection is empty or PB unreachable.
 */
export async function listPublishedCourses(): Promise<CourseLite[]> {
  try {
    const pb = getPb()
    const list = await pb.collection(COLLECTION).getFullList({
      filter: 'is_published = true',
      sort: 'sort_order,title',
      requestKey: 'courses_published',
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToCourseLite)
  } catch {
    return []
  }
}

/**
 * All courses regardless of publish state — admin-only view.
 */
export async function listAllCourses(): Promise<CourseLite[]> {
  try {
    const pb = getPb()
    const list = await pb.collection(COLLECTION).getFullList({
      sort: 'sort_order,title',
      requestKey: 'courses_all',
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToCourseLite)
  } catch {
    return []
  }
}
