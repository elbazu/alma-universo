import { getPb } from '@/lib/pocketbase'

/**
 * Enrollments with Sprint 4 UX flags (pinned, hidden) added.
 * Used by "Mis Cursos" in the user settings modal.
 */
export interface Enrollment {
  id: string
  user: string
  course: string
  status: 'active' | 'cancelled' | 'pending'
  enrolled_at?: string
  expires_at?: string
  source?: 'free' | 'stripe' | 'manual' | 'promo'
  pinned: boolean
  hidden: boolean
  // `expand` for the course relation when we ask for it
  expand?: { course?: Record<string, unknown> }
}

const COLLECTION = 'enrollments'

function recordToEnrollment(rec: Record<string, unknown>): Enrollment {
  return {
    id: rec.id as string,
    user: (rec.user as string) || '',
    course: (rec.course as string) || '',
    status: ((rec.status as string) || 'active') as Enrollment['status'],
    enrolled_at: (rec.enrolled_at as string) || undefined,
    expires_at: (rec.expires_at as string) || undefined,
    source: (rec.source as Enrollment['source']) || undefined,
    pinned: Boolean(rec.pinned),
    hidden: Boolean(rec.hidden),
    expand: (rec.expand as { course?: Record<string, unknown> }) || undefined,
  }
}

/**
 * All enrollments for the given user (active + cancelled + pending).
 * The UI filters/sorts client-side so it can animate pin/hide state
 * changes without refetching.
 */
export async function listEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
  if (!userId) return []
  try {
    const pb = getPb()
    const list = await pb.collection(COLLECTION).getFullList({
      filter: `user="${userId}"`,
      expand: 'course',
      sort: '-pinned,created',
      requestKey: `enrollments_user_${userId}`,
    })
    return (list as unknown as Record<string, unknown>[]).map(recordToEnrollment)
  } catch {
    return []
  }
}

export async function setEnrollmentPinned(id: string, pinned: boolean): Promise<Enrollment> {
  const pb = getPb()
  const rec = await pb.collection(COLLECTION).update(id, { pinned })
  return recordToEnrollment(rec as unknown as Record<string, unknown>)
}

export async function setEnrollmentHidden(id: string, hidden: boolean): Promise<Enrollment> {
  const pb = getPb()
  const rec = await pb.collection(COLLECTION).update(id, { hidden })
  return recordToEnrollment(rec as unknown as Record<string, unknown>)
}
