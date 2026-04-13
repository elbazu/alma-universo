'use client'
import { useState } from 'react'
import { ThumbsUp, MessageCircle, Pin, PlayCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import communityData from '@/content/community.json'
import type { Post } from '@/lib/types'

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)

  const category = communityData.categories.find(c => c.id === post.category)
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { locale: es, addSuffix: true })

  const handleLike = () => {
    setLiked(!liked)
    setLikes(l => liked ? l - 1 : l + 1)
  }

  return (
    <div className="post-card p-4 fade-in">
      {/* Pin badge */}
      {post.pinned && (
        <div className="pin-badge mb-3">
          <Pin size={11} />
          Destacado
        </div>
      )}

      <div className="flex gap-3">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <div className="avatar w-9 h-9 bg-brand-100 text-brand-600 text-sm font-semibold">
                {post.author.name.charAt(0)}
              </div>
              <span className="level-badge">{post.author.level}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-900">{post.author.name}</span>
                {post.author.isOwner && <span className="text-xs">🚀</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>{timeAgo}</span>
                {category && (
                  <>
                    <span>•</span>
                    <span style={{ color: category.color }}>{category.label}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h3 className="font-medium text-gray-900 mb-1 text-[0.9375rem] leading-snug">{post.title}</h3>
          )}

          {/* Content preview */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-3">{post.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition ${liked ? 'text-brand-500' : 'text-gray-400 hover:text-brand-400'}`}
            >
              <ThumbsUp size={15} className={liked ? 'fill-current' : ''} />
              <span>{likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
              <MessageCircle size={15} />
              <span>{post.comments}</span>
            </button>
          </div>
        </div>

        {/* Thumbnail */}
        {post.videoUrl && (
          <div className="video-placeholder w-24 h-16 flex-shrink-0">
            <PlayCircle size={24} />
            <span className="text-xs font-medium">Video</span>
          </div>
        )}
        {post.image && !post.videoUrl && (
          <div className="img-placeholder w-24 h-16 flex-shrink-0 text-xs text-gray-400">
            📷
          </div>
        )}
      </div>
    </div>
  )
}
