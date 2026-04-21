/**
 * lib/posts.ts — PocketBase CRUD helpers for the `posts` collection.
 *
 * Posts live on the community feed. Any logged-in user can create a post;
 * only the author can update/delete their own posts (enforced by PB rules).
 */
import { getPb } from '@/lib/pocketbase'

export interface PostRecord {
  id: string
  created: string
  title: string
  content: string
  author: string
  author_name: string
  author_avatar_url?: string
  category: string
  category_name: string
  category_emoji: string
  course: string
  is_pinned: boolean
  image_url?: string
  video_url?: string
  like_count: number
  comment_count: number
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

function recordToPost(rec: Record<string, unknown>): PostRecord {
  const expand = (rec.expand as Record<string, unknown>) ?? {}
  const authorRec = (expand['author'] as Record<string, unknown>) ?? {}
  const authorProfileRec = (expand['author.profile'] as Record<string, unknown>) ?? {}
  const categoryRec = (expand['category'] as Record<string, unknown>) ?? {}

  // Resolve author display name: prefer user_profiles.display_name, then users.name, then email
  const authorName =
    (authorProfileRec.display_name as string) ||
    (authorRec.name as string) ||
    (authorRec.email as string) ||
    'Miembro'

  // Resolve author avatar
  const authorAvatar =
    fileUrl('user_profiles', authorProfileRec.id as string, authorProfileRec.avatar as string | undefined) ||
    fileUrl('users', authorRec.id as string, authorRec.avatar as string | undefined)

  return {
    id: rec.id as string,
    created: rec.created as string,
    title: (rec.title as string) || '',
    content: (rec.content as string) || '',
    author: (rec.author as string) || '',
    author_name: authorName,
    author_avatar_url: authorAvatar,
    category: (rec.category as string) || '',
    category_name: (categoryRec.name as string) || '',
    category_emoji: (categoryRec.emoji as string) || '',
    course: (rec.course as string) || '',
    is_pinned: Boolean(rec.is_pinned),
    image_url: fileUrl('posts', rec.id as string, rec.image as string | undefined),
    video_url: (rec.video_url as string) || undefined,
    like_count: (rec.like_count as number) || 0,
    comment_count: (rec.comment_count as number) || 0,
  }
}

/** List community posts (no course filter). Pinned first, then newest. */
export async function listCommunityPosts(categoryId?: string): Promise<PostRecord[]> {
  try {
    const pb = getPb()
    const filter = [
      'course = ""',
      categoryId ? `category = "${categoryId}"` : '',
    ]
      .filter(Boolean)
      .join(' && ')

    const list = await pb.collection('posts').getList(1, 50, {
      filter: filter || 'course = ""',
      sort: '-is_pinned,-created',
      expand: 'author,category',
      requestKey: `posts_community_${categoryId ?? 'all'}`,
    })
    return (list.items as unknown as Record<string, unknown>[]).map(recordToPost)
  } catch {
    return []
  }
}

export interface CreatePostData {
  title: string
  content?: string
  category?: string
  course?: string
  image?: File
  video_url?: string
}

/** Create a new post. Caller must be authenticated. */
export async function createPost(data: CreatePostData): Promise<PostRecord | null> {
  try {
    const pb = getPb()
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Not authenticated')

    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('author', userId)
    if (data.content) formData.append('content', data.content)
    if (data.category) formData.append('category', data.category)
    if (data.course) formData.append('course', data.course)
    if (data.image) formData.append('image', data.image)
    if (data.video_url) formData.append('video_url', data.video_url)

    const rec = await pb.collection('posts').create(formData)
    return recordToPost(rec as unknown as Record<string, unknown>)
  } catch (err) {
    console.error('createPost error:', err)
    return null
  }
}

/** Delete a post (only the author can delete; enforced by PB). */
export async function deletePost(id: string): Promise<boolean> {
  try {
    await getPb().collection('posts').delete(id)
    return true
  } catch {
    return false
  }
}
