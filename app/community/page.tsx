'use client'

/**
 * app/community/page.tsx — Community feed.
 *
 * Sprint 1 upgrade: live PocketBase feed replacing static JSON,
 * PostComposer for authenticated users, category filter strip.
 */

import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, ThumbsUp, Pin, Loader2, AlertCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PostComposer from '@/components/community/PostComposer'
import { listCommunityPosts } from '@/lib/posts'
import { listHubCategories } from '@/lib/categories'
import { getPb } from '@/lib/pocketbase'
import type { PostRecord } from '@/lib/posts'
import type { CategoryRecord } from '@/lib/categories'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'justo ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

// ─── Post card ──────────────────────────────────────────────────────────────

function PostCard({ post }: { post: PostRecord }) {
  return (
    <article className="post-card p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-3">
        {post.author_avatar_url ? (
          <img
            src={post.author_avatar_url}
            alt={post.author_name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 text-sm font-semibold flex items-center justify-center flex-shrink-0">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-body">{post.author_name}</span>
            {post.category_name && (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                {post.category_emoji && `${post.category_emoji} `}{post.category_name}
              </span>
            )}
            {post.is_pinned && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Pin size={11} />Fijado
              </span>
            )}
          </div>
          <p className="text-xs text-body-muted mt-0.5">{timeAgo(post.created)}</p>
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{post.title}</h3>
        {post.content && (
          <div
            className="mt-1 text-sm text-body leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </div>

      {/* Attached image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Imagen adjunta"
          className="w-full max-h-80 object-cover rounded-xl border border-border"
        />
      )}

      {/* Attached video */}
      {post.video_url && (
        <div className="rounded-xl overflow-hidden border border-border bg-surface-secondary">
          {post.video_url.includes('youtube') || post.video_url.includes('youtu.be') ? (
            <iframe
              src={post.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
              className="w-full aspect-video"
              allowFullScreen
              title="Video"
            />
          ) : post.video_url.includes('vimeo') ? (
            <iframe
              src={post.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
              className="w-full aspect-video"
              allowFullScreen
              title="Video"
            />
          ) : (
            <a href={post.video_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 text-sm text-brand-600 hover:underline">
              Ver video →
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <button className="flex items-center gap-1.5 text-xs text-body-muted hover:text-brand-600 transition">
          <ThumbsUp size={14} />
          <span>{post.like_count || ''}</span>
          <span>Me gusta</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-body-muted hover:text-brand-600 transition">
          <MessageCircle size={14} />
          <span>{post.comment_count || ''}</span>
          <span>Comentar</span>
        </button>
      </div>
    </article>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [activeCat, setActiveCat] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const pb = getPb()
  const user = pb.authStore.record as { name?: string; email?: string; id?: string } | null

  // Derive display name from PB auth record (Sprint 4 added user_profiles but name lives on auth record too)
  const displayName = user?.name || user?.email || 'Tú'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [cats, postsData] = await Promise.all([
        listHubCategories(),
        listCommunityPosts(activeCat !== 'all' ? activeCat : undefined),
      ])
      setCategories(cats)
      setPosts(postsData)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [activeCat])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="font-display text-3xl font-light mb-6" style={{ color: '#2C1F0E' }}>Comunidad</h1>
        <div className="space-y-4">

            {/* Post composer — only for logged-in users */}
            {user && (
              <PostComposer
                categories={categories}
                authorName={displayName}
                onPosted={loadData}
              />
            )}

            {/* Category filter strip */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveCat('all')}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                    activeCat === 'all'
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-secondary text-body-muted hover:bg-brand-50 hover:text-brand-600'
                  }`}
                >
                  Todos
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                      activeCat === cat.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-secondary text-body-muted hover:bg-brand-50 hover:text-brand-600'
                    }`}
                  >
                    {cat.emoji && `${cat.emoji} `}{cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Feed */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-brand-400" />
              </div>
            ) : error ? (
              <div className="post-card p-8 text-center text-body-muted">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
                <p className="text-sm">No se pudo cargar el feed. Revisa tu conexión.</p>
                <button onClick={loadData} className="mt-3 text-xs text-brand-600 hover:underline">
                  Reintentar
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="post-card p-12 text-center">
                <div className="text-4xl mb-3">✨</div>
                <p className="font-medium text-body">Todavía no hay publicaciones</p>
                <p className="text-sm text-body-muted mt-1">
                  {user ? '¡Sé la primera en publicar algo!' : 'Inicia sesión para publicar.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
        </div>
      </main>
    </AppShell>
  )
}
