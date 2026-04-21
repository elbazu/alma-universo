'use client'

/**
 * LessonEditModal — full lesson editor for admins.
 * Opens from the lesson row in app/classroom/page.tsx.
 * Supports: title, description, video_url, content_image upload,
 * content_url, duration_minutes, is_free, is_published.
 */

import { useRef, useState } from 'react'
import { X, Loader2, Upload, Trash2, ExternalLink } from 'lucide-react'
import { updateLesson } from '@/lib/classroom-crud'
import type { LessonRecord, LessonFormData } from '@/lib/classroom-crud'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

const TOGGLE_CLASS = (on: boolean) =>
  `relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
    on ? 'bg-brand-500' : 'bg-gray-200'
  }`

export default function LessonEditModal({
  lesson,
  onSave,
  onClose,
}: {
  lesson: LessonRecord
  onSave: (updated: LessonRecord) => void
  onClose: () => void
}) {
  const [title, setTitle]               = useState(lesson.title)
  const [description, setDescription]   = useState(lesson.description)
  const [videoUrl, setVideoUrl]         = useState(lesson.video_url)
  const [contentUrl, setContentUrl]     = useState(lesson.content_url)
  const [duration, setDuration]         = useState(lesson.duration_minutes)
  const [isFree, setIsFree]             = useState(lesson.is_free)
  const [isPublished, setIsPublished]   = useState(lesson.is_published)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(lesson.content_image_url || null)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      const patch: Partial<LessonFormData> = {
        title:            title.trim(),
        description:      description.trim(),
        video_url:        videoUrl.trim(),
        content_url:      contentUrl.trim(),
        duration_minutes: duration,
        is_free:          isFree,
        is_published:     isPublished,
      }
      if (imageFile) patch.content_image = imageFile

      const updated = await updateLesson(lesson.id, patch)
      if (!updated) throw new Error('No se pudo guardar.')
      onSave(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-border p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-surface pb-2 border-b border-border">
          <h3 className="font-semibold text-sm">Editar lección</h3>
          <button type="button" onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Título *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nombre de la lección"
              maxLength={180}
              className={INPUT_CLASS}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Explica de qué trata esta lección…"
              rows={4}
              className={INPUT_CLASS + ' resize-none'}
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Video (URL de YouTube o Vimeo)</label>
            <input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              type="url"
              className={INPUT_CLASS}
            />
            <p className="text-xs text-body-muted mt-0.5">Si hay video, se muestra en lugar de la imagen.</p>
          </div>

          {/* Content image */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Imagen de la lección</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full max-h-48 object-cover rounded-lg border border-border"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5"
                  >
                    <Upload size={12} /> Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1.5"
                  >
                    <Trash2 size={12} /> Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg py-6 flex flex-col items-center gap-2 text-body-muted hover:border-brand-300 hover:text-brand-600 transition"
              >
                <Upload size={20} />
                <span className="text-xs">Haz clic para subir una imagen</span>
                <span className="text-xs opacity-60">PNG, JPG, WebP · máx 10 MB</span>
              </button>
            )}
          </div>

          {/* External link */}
          <div>
            <label className="block text-xs font-medium text-body mb-1 flex items-center gap-1">
              <ExternalLink size={11} /> Enlace externo (opcional)
            </label>
            <input
              value={contentUrl}
              onChange={e => setContentUrl(e.target.value)}
              placeholder="https://..."
              type="url"
              className={INPUT_CLASS}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-body mb-1">Duración (minutos)</label>
            <input
              value={duration || ''}
              onChange={e => setDuration(Number(e.target.value) || 0)}
              placeholder="0"
              type="number"
              min="0"
              max="600"
              className={INPUT_CLASS}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setIsFree(v => !v)}
                className={TOGGLE_CLASS(isFree)}
                aria-label="Gratis"
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isFree ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-body">Gratis</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setIsPublished(v => !v)}
                className={TOGGLE_CLASS(isPublished)}
                aria-label="Publicada"
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-body">Publicada</span>
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border sticky bottom-0 bg-surface pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}
