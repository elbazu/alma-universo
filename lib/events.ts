import { getPb } from '@/lib/pocketbase'

/**
 * Events data layer — Sprint 7.
 *
 * Events are stored in the PocketBase `events` collection.
 * The calendar page falls back to content/events.json when PB
 * is unreachable or the collection doesn't exist yet.
 */

export interface CommunityEvent {
  id?: string
  title: string
  description: string
  date: string          // YYYY-MM-DD
  time: string          // HH:MM
  timezone: string
  duration: string
  type: 'live' | 'meditation' | 'workshop'
  meeting_url: string
  recurring: boolean
  recurring_day?: string
  created?: string
  updated?: string
}

const COLLECTION = 'events'

function recordToEvent(rec: Record<string, unknown>): CommunityEvent {
  return {
    id:            rec.id as string,
    title:         (rec.title        as string) || '',
    description:   (rec.description  as string) || '',
    date:          (rec.date         as string) || '',
    time:          (rec.time         as string) || '09:00',
    timezone:      (rec.timezone     as string) || 'America/New_York',
    duration:      (rec.duration     as string) || '60 min',
    type:          ((rec.type        as string) || 'live') as CommunityEvent['type'],
    meeting_url:   (rec.meeting_url  as string) || '',
    recurring:     Boolean(rec.recurring),
    recurring_day: (rec.recurring_day as string) || undefined,
    created:       rec.created as string,
    updated:       rec.updated as string,
  }
}

export async function fetchEvents(): Promise<CommunityEvent[]> {
  try {
    const pb = getPb()
    const records = await pb.collection(COLLECTION).getFullList({
      sort: 'date,time',
      requestKey: 'events_list',
    })
    return (records as Record<string, unknown>[]).map(recordToEvent)
  } catch {
    return []
  }
}

export async function createEvent(
  data: Omit<CommunityEvent, 'id' | 'created' | 'updated'>
): Promise<CommunityEvent> {
  const pb = getPb()
  const rec = await pb.collection(COLLECTION).create(data)
  return recordToEvent(rec as unknown as Record<string, unknown>)
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<CommunityEvent, 'id' | 'created' | 'updated'>>
): Promise<CommunityEvent> {
  const pb = getPb()
  const rec = await pb.collection(COLLECTION).update(id, data)
  return recordToEvent(rec as unknown as Record<string, unknown>)
}

export async function deleteEvent(id: string): Promise<void> {
  const pb = getPb()
  await pb.collection(COLLECTION).delete(id)
}
