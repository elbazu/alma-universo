import { getPb } from '@/lib/pocketbase'

/**
 * User profile data model — matches the `user_profiles` PocketBase
 * collection from Sprint 4. 1:1 with the auth users collection via
 * the `user` relation (unique index).
 *
 * Rename/URL gates (`*_at` fields + counts) are captured here so that
 * when paywall/beta flags flip in Sprint 7 the gating logic can read
 * them without another schema migration.
 */

export type MyersBriggs =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ'

export type SocialPlatform =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'website'

export interface SocialLink {
  platform: SocialPlatform
  url: string
}

export interface UserProfile {
  id?: string
  user: string // relation id to users
  first_name: string
  last_name: string
  username: string
  avatar_url?: string
  bio: string
  location_text: string
  location_lat?: number
  location_lng?: number
  myers_briggs?: MyersBriggs | ''
  social_links: SocialLink[]
  show_location: boolean
  show_membership_date: boolean
  show_online_status: boolean
  name_renamed_at?: string
  username_changed_at?: string
  followers_count: number
  contributions_count: number
  created?: string
  updated?: string
}

const COLLECTION = 'user_profiles'

export function emptyProfile(userId: string): UserProfile {
  return {
    user: userId,
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    location_text: '',
    social_links: [],
    show_location: true,
    show_membership_date: true,
    show_online_status: false,
    followers_count: 0,
    contributions_count: 0,
  }
}

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

function recordToProfile(rec: Record<string, unknown>): UserProfile {
  const id = rec.id as string
  const avatarFile = rec.avatar as string | undefined
  const rawLinks = rec.social_links
  const links: SocialLink[] = Array.isArray(rawLinks)
    ? (rawLinks as unknown[]).filter((l): l is SocialLink => {
        if (!l || typeof l !== 'object') return false
        const obj = l as Record<string, unknown>
        return typeof obj.platform === 'string' && typeof obj.url === 'string'
      })
    : []
  return {
    id,
    user: (rec.user as string) || '',
    first_name: (rec.first_name as string) || '',
    last_name: (rec.last_name as string) || '',
    username: (rec.username as string) || '',
    avatar_url: fileUrl(COLLECTION, id, avatarFile),
    bio: (rec.bio as string) || '',
    location_text: (rec.location_text as string) || '',
    location_lat: (rec.location_lat as number) ?? undefined,
    location_lng: (rec.location_lng as number) ?? undefined,
    myers_briggs: (rec.myers_briggs as MyersBriggs | '') || '',
    social_links: links,
    show_location: rec.show_location !== false,
    show_membership_date: rec.show_membership_date !== false,
    show_online_status: Boolean(rec.show_online_status),
    name_renamed_at: (rec.name_renamed_at as string) || undefined,
    username_changed_at: (rec.username_changed_at as string) || undefined,
    followers_count: (rec.followers_count as number) || 0,
    contributions_count: (rec.contributions_count as number) || 0,
    created: rec.created as string,
    updated: rec.updated as string,
  }
}

/**
 * Fetch the profile for a given user. If none exists yet, create an empty
 * one so subsequent writes are a simple PATCH. Returns `null` if PB is
 * unreachable or the user isn't authenticated — callers should handle
 * the null case rather than throwing.
 */
export async function fetchOrCreateProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null
  try {
    const pb = getPb()
    try {
      const rec = await pb.collection(COLLECTION).getFirstListItem(
        `user="${userId}"`,
        { requestKey: `profile_load_${userId}` }
      )
      return recordToProfile(rec as unknown as Record<string, unknown>)
    } catch {
      // No profile yet — create one.
      const rec = await pb.collection(COLLECTION).create({
        user: userId,
        show_location: true,
        show_membership_date: true,
        show_online_status: false,
        social_links: [],
      })
      return recordToProfile(rec as unknown as Record<string, unknown>)
    }
  } catch {
    return null
  }
}

/**
 * Patch text/boolean/json fields. For avatar uploads use `updateProfileAvatar`.
 */
export async function updateProfile(
  id: string,
  patch: Partial<Omit<UserProfile, 'id' | 'avatar_url' | 'created' | 'updated'>>
): Promise<UserProfile> {
  const pb = getPb()
  const rec = await pb.collection(COLLECTION).update(id, patch as Record<string, unknown>)
  return recordToProfile(rec as unknown as Record<string, unknown>)
}

export async function updateProfileAvatar(id: string, avatar: File): Promise<UserProfile> {
  const pb = getPb()
  const form = new FormData()
  form.append('avatar', avatar)
  const rec = await pb.collection(COLLECTION).update(id, form)
  return recordToProfile(rec as unknown as Record<string, unknown>)
}

export async function clearProfileAvatar(id: string): Promise<UserProfile> {
  const pb = getPb()
  // PB accepts `null` via FormData key with empty value on the multipart
  // endpoint; the JSON endpoint accepts an empty array for multi-file fields
  // and `null` for single-file. `avatar` is maxSelect:1, so `null` works.
  const rec = await pb.collection(COLLECTION).update(id, { avatar: null })
  return recordToProfile(rec as unknown as Record<string, unknown>)
}

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30)
}

export function displayName(profile: UserProfile | null, fallback = ''): string {
  if (!profile) return fallback
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  return full || profile.username || fallback
}
