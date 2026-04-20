import { getPb } from '@/lib/pocketbase'
import communityJson from '@/content/community.json'

/**
 * Community settings data model. Matches the `community_settings`
 * PocketBase collection from Sprint 2. If PB is unreachable we fall back
 * to the bundled JSON seed so the site still renders.
 */
export interface CommunitySettings {
  id?: string
  name: string
  description: string
  url_slug: string
  icon_url?: string
  cover_url?: string
  is_public: boolean
  support_email: string
  show_classroom_tab: boolean
  show_calendar_tab: boolean
  show_map_tab: boolean
  show_members_tab: boolean
  show_about_tab: boolean
}

const SINGLETON_KEY = 'main'

export const COMMUNITY_FALLBACK: CommunitySettings = {
  name: communityJson.name || 'Mi Alma en el Universo',
  description: communityJson.description || '',
  url_slug: communityJson.url || 'mi-alma',
  is_public: true,
  support_email: 'zuniga.elba@gmail.com',
  show_classroom_tab: true,
  show_calendar_tab: true,
  show_map_tab: false,
  show_members_tab: true,
  show_about_tab: true,
}

/**
 * Build a public file URL without relying on a specific PocketBase SDK helper
 * name (`getUrl` vs `getURL` varies between SDK versions). This uses the
 * stable `/api/files/<collection>/<id>/<filename>` endpoint directly.
 */
function fileUrl(collection: string, id: string, filename?: string): string | undefined {
  if (!filename) return undefined
  // Try both `baseUrl` (older SDK) and `baseURL` (newer SDK) shapes, then env.
  const client = getPb() as { baseUrl?: string; baseURL?: string }
  const base = (
    client.baseUrl ||
    client.baseURL ||
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    ''
  ).replace(/\/$/, '')
  return `${base}/api/files/${collection}/${id}/${filename}`
}

function recordToSettings(rec: Record<string, unknown>): CommunitySettings {
  const id = rec.id as string
  const iconFile = rec.icon as string | undefined
  const coverFile = rec.cover as string | undefined
  return {
    id,
    name: (rec.name as string) || COMMUNITY_FALLBACK.name,
    description: (rec.description as string) || COMMUNITY_FALLBACK.description,
    url_slug: (rec.url_slug as string) || COMMUNITY_FALLBACK.url_slug,
    icon_url: fileUrl('community_settings', id, iconFile),
    cover_url: fileUrl('community_settings', id, coverFile),
    is_public: Boolean(rec.is_public),
    support_email: (rec.support_email as string) || COMMUNITY_FALLBACK.support_email,
    show_classroom_tab: rec.show_classroom_tab !== false,
    show_calendar_tab: rec.show_calendar_tab !== false,
    show_map_tab: Boolean(rec.show_map_tab),
    show_members_tab: rec.show_members_tab !== false,
    show_about_tab: rec.show_about_tab !== false,
  }
}

export async function fetchCommunitySettings(): Promise<CommunitySettings> {
  try {
    const pb = getPb()
    const rec = await pb.collection('community_settings').getFirstListItem(
      `singleton_key="${SINGLETON_KEY}"`,
      { requestKey: 'community_settings_load' }
    )
    return recordToSettings(rec as unknown as Record<string, unknown>)
  } catch {
    return { ...COMMUNITY_FALLBACK }
  }
}

/**
 * Save text-only updates. File uploads (icon/cover) use updateFiles below
 * because they require FormData.
 */
export async function updateCommunitySettings(
  id: string,
  patch: Partial<Omit<CommunitySettings, 'id' | 'icon_url' | 'cover_url'>>
): Promise<CommunitySettings> {
  const pb = getPb()
  const rec = await pb.collection('community_settings').update(id, patch)
  return recordToSettings(rec as unknown as Record<string, unknown>)
}

export async function updateCommunityFiles(
  id: string,
  files: { icon?: File; cover?: File }
): Promise<CommunitySettings> {
  const pb = getPb()
  const form = new FormData()
  if (files.icon) form.append('icon', files.icon)
  if (files.cover) form.append('cover', files.cover)
  const rec = await pb.collection('community_settings').update(id, form)
  return recordToSettings(rec as unknown as Record<string, unknown>)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}
