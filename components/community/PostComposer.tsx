'use client'

/**
 * PostComposer — create a new community post.
 *
 * Spec: title, body, attach (image / video URL / link), category selector,
 * "send email" toggle, Cancel / Publicar.
 * Only shown to authenticated users.
 */

import { useRef, useState } from 'react'
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Smile,
  BarChart2,
  Loader2,
  X,
  ChevronDown,
} from 'lucide-react'
import { createPost } from '@/lib/posts'
import type { CategoryRecord } from '@/lib/categories'

interface Props {
  categories: CategoryRecord[]
  authorName: string
  authorAvatarUrl?: string
  onPosted: () => void
}

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

type AttachMode = 'none' | 'image' | 'video' | 'link'

export default function PostComposer({ categories, authorName, authorAvatarUrl, onPosted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [attachMode, setAttachMode] = useState<AttachMode>('none')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle('')
    setBody('')
    setCategoryId('')
    setSendEmail(false)
    setAttachMode('none')
    setImageFile(null)
    setImagePreview(null)
    setVideoUrl('')
    setLinkUrl('')
    setError('')
    setExpanded(false)
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  function toggleAttach(mode: AttachMode) {
    if (attachMode === mode) {
      setAttachMode('none')
    } else {
      setAttachMode(mode)
      if (mode === 'image') setTimeout(() => fileRef.current?.click(), 50)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await createPost({
        title: title.trim(),
        content: body.trim() || undefined,
        category: categoryId || undefined,
        image: imageFile || undefined,
        video_url: (attachMode === 'video' && videoUrl.trim()) ? videoUrl.trim() : undefined,
      })
      if (!result) throw new Error('No se pudo publicar.')
      reset()
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar.')
    } finally {
      setSaving(false)
    }
  }

  // Collapsed trigger
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full post-card px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-secondary transition group"
      >
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt={authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm font-semibold flex items-center justify-center flex-shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-body-muted group-hover:text-body transition">
          Escribe algo para la comunidad...
        </span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="post-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt={authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-sm font-semibold flex items-center justify-center flex-shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-body">{authorName}</span>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Título (obligatorio)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={180}
        className={INPUT_CLASS}
        autoFocus
      />

      {/* Body */}
      <textarea
        placeholder="Comparte algo con la comunidad... (opcional)"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        className={INPUT_CLASS + ' resize-none'}
      />

      {/* Attachment area */}
      {attachMode === 'image' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleImagePick}
          />
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-brand-600 hover:underline"
            >
              Elegir imagen…
            </button>
          )}
        </div>
      )}

      {attachMode === 'video' && (
        <input
          type="url"
          placeholder="URL del video (YouTube, Vimeo…)"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          className={INPUT_CLASS}
        />
      )}

      {attachMode === 'link' && (
        <input
          type="url"
          placeholder="https://..."
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          className={INPUT_CLASS}
        />
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Attach icons */}
        <div className="flex items-center gap-1">
          {[
            { mode: 'image' as AttachMode, icon: <ImageIcon size={16} />, label: 'Imagen' },
            { mode: 'video' as AttachMode, icon: <Video size={16} />, label: 'Video' },
            { mode: 'link' as AttachMode, icon: <LinkIcon size={16} />, label: 'Link' },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              type="button"
              title={label}
              onClick={() => toggleAttach(mode)}
              className={`p-1.5 rounded-lg transition ${
                attachMode === mode
                  ? 'bg-brand-100 text-brand-600'
                  : 'text-body-muted hover:text-brand-600 hover:bg-brand-50'
              }`}
            >
              {icon}
            </button>
          ))}
          {/* Stub buttons — coming in Sprint 5 */}
          {[
            { icon: <Smile size={16} />, label: 'Emoji (próximamente)' },
            { icon: <BarChart2 size={16} />, label: 'Encuesta (próximamente)' },
          ].map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              disabled
              className="p-1.5 rounded-lg text-body-muted opacity-40 cursor-not-allowed"
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Category selector + Email toggle + Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {categories.length > 0 && (
            <div className="relative">
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-surface-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 text-body cursor-pointer"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-body-muted pointer-events-none" />
            </div>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="w-3.5 h-3.5 accent-brand-500"
            />
            <span className="text-xs text-body-muted">Enviar email</span>
          </label>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={reset}
          disabled={saving}
          className="px-4 py-1.5 text-sm text-body-muted hover:text-body transition rounded-lg hover:bg-surface-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-5 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Publicar
        </button>
      </div>
    </form>
  )
}
