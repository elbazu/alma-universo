/**
 * lib/downloads.ts — PocketBase helpers for the `downloads` collection.
 *
 * PocketBase schema needed (create in PB Admin → Collections → New):
 *   Collection name: downloads
 *   Fields:
 *     title          (text, required)
 *     title_en       (text)
 *     description    (text)
 *     description_en (text)
 *     file           (file, required, single)
 *     thumbnail      (file, single)
 *     is_free        (bool, default true)
 *     required_course (relation → courses, optional)
 *     sort_order     (number, default 0)
 *     active         (bool, default true)
 */

import { getPb } from './pocketbase'

export interface DownloadRecord {
  id:               string
  title:            string
  title_en:         string
  description:      string
  description_en:   string
  file:             string   // raw PB filename
  file_url:         string   // computed full URL
  thumbnail:        string
  thumbnail_url:    string
  is_free:          boolean
  required_course:  string   // relation ID (empty = no restriction)
  required_course_name?: string
  sort_order:       number
  active:           boolean
  created:          string
  updated:          string
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listDownloads(): Promise<DownloadRecord[]> {
  const pb = getPb()
  try {
    const records = await pb.collection('downloads').getFullList({
      filter: 'active = true',
      sort:   'sort_order,created',
      expand: 'required_course',
    })
    return records.map(r => mapRecord(pb, r))
  } catch {
    return []
  }
}

export async function listAllDownloads(): Promise<DownloadRecord[]> {
  const pb = getPb()
  try {
    const records = await pb.collection('downloads').getFullList({
      sort: 'sort_order,created',
      expand: 'required_course',
    })
    return records.map(r => mapRecord(pb, r))
  } catch {
    return []
  }
}

// ─── Write (admin only) ───────────────────────────────────────────────────────

export interface DownloadPayload {
  title:            string
  title_en:         string
  description:      string
  description_en:   string
  file?:            File | null
  thumbnail?:       File | null
  is_free:          boolean
  required_course:  string
  sort_order:       number
  active:           boolean
}

export async function createDownload(payload: DownloadPayload): Promise<DownloadRecord | null> {
  const pb = getPb()
  try {
    const data = buildFormData(payload)
    const record = await pb.collection('downloads').create(data)
    return mapRecord(pb, record)
  } catch (e) {
    console.error('createDownload failed', e)
    return null
  }
}

export async function updateDownload(
  id: string,
  payload: Partial<DownloadPayload>
): Promise<DownloadRecord | null> {
  const pb = getPb()
  try {
    const data = buildFormData(payload)
    const record = await pb.collection('downloads').update(id, data)
    return mapRecord(pb, record)
  } catch (e) {
    console.error('updateDownload failed', e)
    return null
  }
}

export async function deleteDownload(id: string): Promise<boolean> {
  const pb = getPb()
  try {
    await pb.collection('downloads').delete(id)
    return true
  } catch {
    return false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(pb: ReturnType<typeof getPb>, r: any): DownloadRecord {
  return {
    id:             r.id,
    title:          r.title ?? '',
    title_en:       r.title_en ?? '',
    description:    r.description ?? '',
    description_en: r.description_en ?? '',
    file:           r.file ?? '',
    file_url:       r.file ? pb.files.getUrl(r, r.file) : '',
    thumbnail:      r.thumbnail ?? '',
    thumbnail_url:  r.thumbnail ? pb.files.getUrl(r, r.thumbnail) : '',
    is_free:        r.is_free ?? true,
    required_course: r.required_course ?? '',
    required_course_name: r.expand?.required_course?.title,
    sort_order:     r.sort_order ?? 0,
    active:         r.active ?? true,
    created:        r.created ?? '',
    updated:        r.updated ?? '',
  }
}

function buildFormData(payload: Partial<DownloadPayload>): FormData {
  const fd = new FormData()
  if (payload.title            !== undefined) fd.append('title',            payload.title)
  if (payload.title_en         !== undefined) fd.append('title_en',         payload.title_en)
  if (payload.description      !== undefined) fd.append('description',      payload.description)
  if (payload.description_en   !== undefined) fd.append('description_en',   payload.description_en)
  if (payload.is_free          !== undefined) fd.append('is_free',          String(payload.is_free))
  if (payload.required_course  !== undefined) fd.append('required_course',  payload.required_course)
  if (payload.sort_order       !== undefined) fd.append('sort_order',       String(payload.sort_order))
  if (payload.active           !== undefined) fd.append('active',           String(payload.active))
  if (payload.file)                           fd.append('file',             payload.file)
  if (payload.thumbnail)                      fd.append('thumbnail',        payload.thumbnail)
  return fd
}
