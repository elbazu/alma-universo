/**
 * lib/classroom-crud.ts — Admin CRUD for courses, modules, and lessons.
 *
 * All write operations require admin auth (enforced by PB rules).
 * Read operations are public — any visitor can list published courses/modules/lessons.
 */
import { getPb } from '@/lib/pocketbase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourseAdmin {
  id: string
  title: string
  slug: string
  tagline: string
  description: string
  thumbnail_url?: string
  access_type: 'free' | 'paid'
  price_cents: number
  currency: string
  billing: string
  is_published: boolean
  sort_order: number
}

export interface ModuleRecord {
  id: string
  course: string
  title: string
  description: string
  sort_order: number
  is_published: boolean
}

export interface LessonRecord {
  id: string
  module: string
  title: string
  description: string
  video_url: string
  duration_minutes: number
  sort_order: number
  is_free: boolean
  is_published: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function recordToCourse(rec: Record<string, unknown>): CourseAdmin {
  const id = rec.id as string
  return {
    id,
    title: (rec.title as string) || '',
    slug: (rec.slug as string) || '',
    tagline: (rec.tagline as string) || '',
    description: (rec.description as string) || '',
    thumbnail_url: fileUrl('courses', id, rec.thumbnail as string | undefined),
    access_type: ((rec.access_type as string) || 'free') as 'free' | 'paid',
    price_cents: (rec.price_cents as number) || 0,
    currency: (rec.currency as string) || 'USD',
    billing: (rec.billing as string) || '',
    is_published: Boolean(rec.is_published),
    sort_order: (rec.sort_order as number) || 0,
  }
}

function recordToModule(rec: Record<string, unknown>): ModuleRecord {
  return {
    id: rec.id as string,
    course: (rec.course as string) || '',
    title: (rec.title as string) || '',
    description: (rec.description as string) || '',
    sort_order: (rec.sort_order as number) || 0,
    is_published: Boolean(rec.is_published),
  }
}

function recordToLesson(rec: Record<string, unknown>): LessonRecord {
  return {
    id: rec.id as string,
    module: (rec.module as string) || '',
    title: (rec.title as string) || '',
    description: (rec.description as string) || '',
    video_url: (rec.video_url as string) || '',
    duration_minutes: (rec.duration_minutes as number) || 0,
    sort_order: (rec.sort_order as number) || 0,
    is_free: Boolean(rec.is_free),
    is_published: Boolean(rec.is_published),
  }
}

// ─── Courses ─────────────────────────────────────────────────────────────────

/** All courses (admin). Includes unpublished. */
export async function adminListCourses(): Promise<CourseAdmin[]> {
  try {
    const list = await getPb().collection('courses').getFullList({
      sort: 'sort_order,title',
      requestKey: 'admin_courses_all',
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToCourse)
  } catch {
    return []
  }
}

export interface CourseFormData {
  title: string
  tagline?: string
  description?: string
  access_type: 'free' | 'paid'
  price_cents?: number
  currency?: string
  billing?: string
  is_published?: boolean
  thumbnail?: File
}

/** Create a new course. Admin only. */
export async function createCourse(data: CourseFormData): Promise<CourseAdmin | null> {
  try {
    const pb = getPb()
    const existingCourses = await adminListCourses()
    const sortOrder = existingCourses.length

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('slug', toSlug(data.title))
    formData.append('tagline', data.tagline || '')
    formData.append('description', data.description || '')
    formData.append('access_type', data.access_type)
    formData.append('price_cents', String(data.price_cents || 0))
    formData.append('currency', data.currency || 'USD')
    formData.append('billing', data.billing || 'one_time')
    formData.append('is_published', String(data.is_published ?? false))
    formData.append('sort_order', String(sortOrder))
    if (data.thumbnail) formData.append('thumbnail', data.thumbnail)

    const rec = await pb.collection('courses').create(formData)
    return recordToCourse(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createCourse error:', err)
    return null
  }
}

/** Update a course. Admin only. */
export async function updateCourse(
  id: string,
  data: Partial<CourseFormData>
): Promise<CourseAdmin | null> {
  try {
    const formData = new FormData()
    if (data.title !== undefined) {
      formData.append('title', data.title)
      formData.append('slug', toSlug(data.title))
    }
    if (data.tagline !== undefined) formData.append('tagline', data.tagline)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.access_type !== undefined) formData.append('access_type', data.access_type)
    if (data.price_cents !== undefined) formData.append('price_cents', String(data.price_cents))
    if (data.currency !== undefined) formData.append('currency', data.currency)
    if (data.billing !== undefined) formData.append('billing', data.billing)
    if (data.is_published !== undefined) formData.append('is_published', String(data.is_published))
    if (data.thumbnail !== undefined) formData.append('thumbnail', data.thumbnail)

    const rec = await getPb().collection('courses').update(id, formData)
    return recordToCourse(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('updateCourse error:', err)
    return null
  }
}

/** Delete a course (cascades to modules → lessons). Admin only. */
export async function deleteCourse(id: string): Promise<boolean> {
  try {
    await getPb().collection('courses').delete(id)
    return true
  } catch {
    return false
  }
}

// ─── Modules ─────────────────────────────────────────────────────────────────

/** List all modules for a course, sorted by sort_order. */
export async function listModules(courseId: string): Promise<ModuleRecord[]> {
  try {
    const list = await getPb().collection('modules').getFullList({
      filter: `course = "${courseId}"`,
      sort: 'sort_order,created',
      requestKey: `modules_${courseId}`,
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToModule)
  } catch {
    return []
  }
}

export interface ModuleFormData {
  title: string
  description?: string
  is_published?: boolean
}

/** Create a module in a course. Admin only. */
export async function createModule(
  courseId: string,
  data: ModuleFormData,
  sortOrder: number
): Promise<ModuleRecord | null> {
  try {
    const rec = await getPb().collection('modules').create({
      course: courseId,
      title: data.title,
      description: data.description || '',
      is_published: data.is_published ?? true,
      sort_order: sortOrder,
    })
    return recordToModule(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createModule error:', err)
    return null
  }
}

/** Update a module. Admin only. */
export async function updateModule(
  id: string,
  data: Partial<ModuleFormData & { sort_order: number }>
): Promise<ModuleRecord | null> {
  try {
    const rec = await getPb().collection('modules').update(id, data)
    return recordToModule(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('updateModule error:', err)
    return null
  }
}

/** Delete a module (cascades to lessons). Admin only. */
export async function deleteModule(id: string): Promise<boolean> {
  try {
    await getPb().collection('modules').delete(id)
    return true
  } catch {
    return false
  }
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

/** List all lessons in a module, sorted by sort_order. */
export async function listLessons(moduleId: string): Promise<LessonRecord[]> {
  try {
    const list = await getPb().collection('lessons').getFullList({
      filter: `module = "${moduleId}"`,
      sort: 'sort_order,created',
      requestKey: `lessons_${moduleId}`,
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToLesson)
  } catch {
    return []
  }
}

export interface LessonFormData {
  title: string
  description?: string
  video_url?: string
  duration_minutes?: number
  is_free?: boolean
  is_published?: boolean
}

/** Create a lesson in a module. Admin only. */
export async function createLesson(
  moduleId: string,
  data: LessonFormData,
  sortOrder: number
): Promise<LessonRecord | null> {
  try {
    const rec = await getPb().collection('lessons').create({
      module: moduleId,
      title: data.title,
      description: data.description || '',
      video_url: data.video_url || '',
      duration_minutes: data.duration_minutes || 0,
      is_free: data.is_free ?? false,
      is_published: data.is_published ?? true,
      sort_order: sortOrder,
    })
    return recordToLesson(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createLesson error:', err)
    return null
  }
}

/** Update a lesson. Admin only. */
export async function updateLesson(
  id: string,
  data: Partial<LessonFormData & { sort_order: number }>
): Promise<LessonRecord | null> {
  try {
    const rec = await getPb().collection('lessons').update(id, data)
    return recordToLesson(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('updateLesson error:', err)
    return null
  }
}

/** Delete a lesson. Admin only. */
export async function deleteLesson(id: string): Promise<boolean> {
  try {
    await getPb().collection('lessons').delete(id)
    return true
  } catch {
    return false
  }
}
