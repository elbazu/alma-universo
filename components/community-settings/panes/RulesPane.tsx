'use client'

/**
 * RulesPane — manage community rules.
 * Admin only. Shown inside CommunitySettingsModal.
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, X, Link as LinkIcon } from 'lucide-react'
import { listHubRules, createRule, updateRule, deleteRule, reorderRules } from '@/lib/rules'
import type { RuleRecord } from '@/lib/rules'

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 ' +
  'placeholder:text-body-muted text-body transition'

// ─── Modal: add / edit rule ───────────────────────────────────────────────────

function RuleModal({
  initial,
  sortOrder,
  onSave,
  onClose,
}: {
  initial?: RuleRecord
  sortOrder: number
  onSave: (rule: RuleRecord) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (!body.trim()) { setError('La descripción es obligatoria.'); return }
    setSaving(true)
    setError('')
    try {
      let result: RuleRecord | null
      if (initial) {
        result = await updateRule(initial.id, { title: title.trim(), body: body.trim() })
      } else {
        result = await createRule({ title: title.trim(), body: body.trim() }, sortOrder)
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
          <h3 className="font-semibold text-sm">{initial ? 'Editar regla' : 'Nueva regla'}</h3>
          <button type="button" onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-body mb-1">Título *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Trato respetuoso"
              maxLength={120}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-body mb-1">Descripción *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Explica esta regla en detalle…"
              rows={4}
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
          <button type="submit" disabled={saving || !title.trim() || !body.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirm({ rule, onConfirm, onCancel }: {
  rule: RuleRecord
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-border p-5 space-y-4">
        <h3 className="font-semibold text-sm">¿Eliminar regla?</h3>
        <p className="text-sm text-body-muted">
          Se eliminará <strong>"{rule.title}"</strong> permanentemente.
        </p>
        <div className="flex justify-end gap-2 pt-1 border-t border-border">
          <button onClick={onCancel} className="px-4 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pane ────────────────────────────────────────────────────────────────────

export default function RulesPane() {
  const [rules, setRules] = useState<RuleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RuleRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<RuleRecord | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listHubRules()
    setRules(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleMove(id: string, dir: 'up' | 'down') {
    const idx = rules.findIndex(r => r.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === rules.length - 1) return
    const next = [...rules]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    setRules(next)
    await reorderRules(next.map(r => r.id))
  }

  function handleSaved(rule: RuleRecord) {
    setRules(prev => {
      const exists = prev.find(r => r.id === rule.id)
      return exists ? prev.map(r => r.id === rule.id ? rule : r) : [...prev, rule]
    })
  }

  async function handleDelete(rule: RuleRecord) {
    const ok = await deleteRule(rule.id)
    if (ok) setRules(prev => prev.filter(r => r.id !== rule.id))
    setConfirmDelete(null)
  }

  function copyLink(ruleId: string) {
    const url = `${window.location.origin}/community#rule-${ruleId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(ruleId)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-body">Reglas de la comunidad</h3>
          <p className="text-xs text-body-muted mt-0.5">
            Define las normas de convivencia de tu espacio.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition"
        >
          <Plus size={13} /> Nueva regla
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-brand-400" />
        </div>
      ) : rules.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-body-muted">
          <p className="text-sm">Todavía no hay reglas.</p>
          <p className="text-xs mt-1">Establece las normas de tu comunidad.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              id={`rule-${rule.id}`}
              className="flex items-start gap-3 px-4 py-3 border border-border rounded-xl bg-surface hover:bg-surface-secondary transition group"
            >
              {/* Number + reorder */}
              <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <button onClick={() => handleMove(rule.id, 'up')} disabled={idx === 0}
                  className="p-0.5 text-body-muted hover:text-brand-600 disabled:opacity-20">
                  <ChevronUp size={11} />
                </button>
                <button onClick={() => handleMove(rule.id, 'down')} disabled={idx === rules.length - 1}
                  className="p-0.5 text-body-muted hover:text-brand-600 disabled:opacity-20">
                  <ChevronDown size={11} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-body">{rule.title}</p>
                <p className="text-xs text-body-muted mt-1 leading-relaxed line-clamp-3">
                  {rule.body.replace(/<[^>]+>/g, '')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 pt-0.5">
                <button
                  onClick={() => copyLink(rule.id)}
                  title="Copiar link"
                  className="p-1.5 text-body-muted hover:text-brand-600 rounded"
                >
                  {copiedId === rule.id
                    ? <span className="text-xs text-green-600 font-medium">✓</span>
                    : <LinkIcon size={13} />
                  }
                </button>
                <button onClick={() => { setEditing(rule); setShowModal(true) }}
                  className="p-1.5 text-body-muted hover:text-brand-600 rounded">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setConfirmDelete(rule)}
                  className="p-1.5 text-body-muted hover:text-red-500 rounded">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RuleModal
          initial={editing ?? undefined}
          sortOrder={rules.length}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          rule={confirmDelete}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
