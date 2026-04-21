/**
 * lib/lesson-progress.ts — Track lesson completion per user.
 *
 * Uses the `lesson_completions` PocketBase collection added in the
 * Lesson Player sprint. Each record = one user has completed one lesson.
 *
 * All functions are safe to call when the user is not logged in —
 * they return empty/false/0 gracefully.
 */
import { getPb } from '@/lib/pocketbase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompletionRecord {
  id: string
  user: string
  lesson: string
  created: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function recordToCompletion(rec: Record<string, unknown>): CompletionRecord {
  return {
    id:      rec.id      as string,
    user:    rec.user    as string,
    lesson:  rec.lesson  as string,
    created: rec.created as string,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the set of lesson IDs the current user has completed
 * across the whole site. Used to seed the lesson player and
 * calculate per-course progress on the classroom index.
 */
export async function getAllCompletedLessonIds(): Promise<Set<string>> {
  const pb = getPb()
  if (!pb.authStore.record) return new Set()
  try {
    const list = await pb.collection('lesson_completions').getFullList({
      filter: `user = "${pb.authStore.record.id}"`,
      fields: 'lesson',
      requestKey: 'all_completions',
    })
    return new Set((list as unknown as { lesson: string }[]).map(r => r.lesson))
  } catch {
    return new Set()
  }
}

/**
 * Returns the set of lesson IDs the current user has completed
 * within a specific course. More targeted than getAllCompletedLessonIds
 * when we only need one course's progress.
 */
export async function getCompletedLessonIds(courseId: string): Promise<Set<string>> {
  const pb = getPb()
  if (!pb.authStore.record) return new Set()
  try {
    const list = await pb.collection('lesson_completions').getFullList({
      filter: `user = "${pb.authStore.record.id}" && lesson.module.course = "${courseId}"`,
      fields: 'lesson',
      requestKey: `completions_${courseId}`,
    })
    return new Set((list as unknown as { lesson: string }[]).map(r => r.lesson))
  } catch {
    return new Set()
  }
}

/**
 * Marks a lesson as complete for the current user.
 * Safe to call even if already completed — PocketBase will just
 * return an error which we swallow (the UI can assume it's already marked).
 */
export async function markLessonComplete(lessonId: string): Promise<boolean> {
  const pb = getPb()
  if (!pb.authStore.record) return false
  try {
    await pb.collection('lesson_completions').create({
      user:   pb.authStore.record.id,
      lesson: lessonId,
    })
    return true
  } catch {
    // May already exist — that's fine
    return false
  }
}

/**
 * Removes a lesson completion for the current user (undo "Mark as done").
 */
export async function markLessonIncomplete(lessonId: string): Promise<boolean> {
  const pb = getPb()
  if (!pb.authStore.record) return false
  try {
    // Find the specific completion record
    const rec = await pb.collection('lesson_completions').getFirstListItem(
      `user = "${pb.authStore.record.id}" && lesson = "${lessonId}"`,
      { requestKey: `completion_find_${lessonId}` }
    )
    await pb.collection('lesson_completions').delete(rec.id)
    return true
  } catch {
    return false
  }
}

/**
 * Calculates the completion percentage for a course.
 * totalLessons should be the count of published lessons in the course.
 * Returns 0 if totalLessons is 0 or user is not logged in.
 */
export function calcProgressPercent(
  completedIds: Set<string>,
  allLessonIdsInCourse: string[]
): number {
  if (allLessonIdsInCourse.length === 0) return 0
  const count = allLessonIdsInCourse.filter(id => completedIds.has(id)).length
  return Math.round((count / allLessonIdsInCourse.length) * 100)
}

// ─── localStorage — last visited lesson per course ────────────────────────────

const LAST_LESSON_KEY = (courseId: string) => `alma_last_lesson_${courseId}`

export function saveLastLesson(courseId: string, lessonId: string): void {
  try {
    localStorage.setItem(LAST_LESSON_KEY(courseId), lessonId)
  } catch { /* SSR or private mode */ }
}

export function loadLastLesson(courseId: string): string | null {
  try {
    return localStorage.getItem(LAST_LESSON_KEY(courseId))
  } catch {
    return null
  }
}
