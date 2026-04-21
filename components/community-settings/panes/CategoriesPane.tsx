'use client'

/**
 * CategoriesPane — manage community categories (hub-level, no course filter).
 * Admin only. Shown inside CommunitySettingsModal.
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, X, Check } from 'lucide-react'
import {
  listHubCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/lib/categories'
import type { CategoryRecord } from '@/lib/categories'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

// ─── Modal: add / edit category ──────────────────────────────────────────────

function CategoryModal({
  initial,
  sortOrder,
  onSave,
  onClose,
}: {
  initial?: CategoryRecord
  sortOrder: number
  onSave: (cat: CategoryRecord) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      let result: CategoryRecord | null
      if (initial) {
        result = await updateCategory(initial.id, {
          name: name.trim(),
          emoji: emoji.trim(),
          description: description.trim(),
        })
      } else {
        result = await createCategory(
          { name: name.trim(), emoji: emoji.trim(), description: description.trim() },
          sortOrder
        )
      }
      if (!result) throw new Error('No se pudo guardar.')
      onSave(result)
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
        className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-border p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button type="button" onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16">
              <label className="block text-xs font-medium text-body mb-1">Emoji</label>
              <input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                placeholder="🌿"
                maxLength={8}
                className={INPUT_CLASS + ' text-center text-base'}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-body mb-1">Nombre *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Nutrición"
                maxLength={60}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-body mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brevísima descripción de esta categoría"
              maxLength={200}
              rows={2}
              className={INPUT_CLASS + ' resize-none'}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1 border-t border-border">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !name.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Pane ────────────────────────────────────────────────────────────────────

export default function CategoriesPane() {
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CategoryRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listHubCategories()
    setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleMove(id: string, dir: 'up' | 'down') {
    const idx = categories.findIndex(c => c.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === categories.length - 1) return
    const next = [...categories]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    setCategories(next)
    await reorderCategories(next.map(c => c.id))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría? Los posts asociados perderán su categoría.')) return
    setDeletingId(id)
    const ok = await deleteCategory(id)
    if (ok) setCategories(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  function handleSaved(cat: CategoryRecord) {
    setCategories(prev => {
      const exists = prev.find(c => c.id === cat.id)
      return exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat]
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-body">Categorías</h3>
          <p className="text-xs text-body-muted mt-0.5">
            Organiza los posts de la comunidad en categorías.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition"
        >
          <Plus size={13} /> Agregar categoría
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-brand-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-body-muted">
          <p className="text-sm">Todavía no hay categorías.</p>
          <p className="text-xs mt-1">Crea la primera para organizar el feed.</p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-secondary transition group">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleMove(cat.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 text-body-muted hover:text-brand-600 disabled:opacity-20"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => handleMove(cat.id, 'down')}
                  disabled={idx === categories.length - 1}
                  className="p-0.5 text-body-muted hover:text-brand-600 disabled:opacity-20"
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Emoji */}
              {cat.emoji && (
                <span className="text-lg flex-shrink-0 w-7 text-center">{cat.emoji}</span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-body">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-body-muted truncate">{cat.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                <button
                  onClick={() => { setEditing(cat); setShowModal(true) }}
                  className="p-1.5 text-body-muted hover:text-brand-600 rounded"
                >
                  <Pencil size={13} />
                </button>
                <button
                  disabled={deletingId === cat.id}
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-body-muted hover:text-red-500 rounded disabled:opacity-40"
                >
                  {deletingId === cat.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          initial={editing ?? undefined}
          sortOrder={categories.length}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
