'use client'

/**
 * DiscoveryPane — Sprint 6.
 *
 * Controls whether the community appears in discovery / search results.
 *
 * Checklist items must all be complete before the community can go Listed.
 * Keywords (up to 11) improve searchability.
 * The UNLISTED / Listed badge reflects current status.
 */

import { useEffect, useState } from 'react'
import {
  Check, X, Loader2, Globe, EyeOff, Plus, Tag,
} from 'lucide-react'
import { useCommunityData } from '@/context/CommunityDataContext'

const MAX_KEYWORDS = 11

// ─── Checklist definition ─────────────────────────────────────────────────────

interface CheckItem {
  id: string
  label: string
  hint: string
}

const CHECKLIST: CheckItem[] = [
  { id: 'has_icon',        label: 'Icono del hub subido',           hint: 'Ve a General → Icono.' },
  { id: 'has_cover',       label: 'Foto de portada subida',         hint: 'Ve a General → Portada.' },
  { id: 'has_name',        label: 'Nombre del hub configurado',     hint: 'Ve a General → Nombre.' },
  { id: 'has_description', label: 'Descripción escrita',            hint: 'Ve a General → Descripción (mín. 20 caracteres).' },
  { id: 'has_course',      label: 'Al menos un curso publicado',    hint: 'Ve a Classroom y publica tu primer curso.' },
  { id: 'has_post',        label: 'Al menos un post en comunidad',  hint: 'Escribe tu primer post en la sección Comunidad.' },
  { id: 'has_pricing',     label: 'Modelo de precios configurado',  hint: 'Ve a Precios y elige un modelo.' },
]

// ─── Keyword chip ─────────────────────────────────────────────────────────────

function KeywordChip({
  value,
  onRemove,
}: {
  value: string
  onRemove: () => void
}) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs rounded-full font-medium">
      {value}
      <button
        type="button"
        onClick={onRemove}
        className="text-brand-400 hover:text-brand-700 transition ml-0.5"
      >
        <X size={11} />
      </button>
    </span>
  )
}

// ─── Discovery pane ───────────────────────────────────────────────────────────

export default function DiscoveryPane() {
  const { settings, save, refresh } = useCommunityData()

  // Derive checklist completion from current settings
  const checks: Record<string, boolean> = {
    has_icon:        Boolean(settings?.icon_url),
    has_cover:       Boolean(settings?.cover_url),
    has_name:        (settings?.name?.length ?? 0) > 2,
    has_description: (settings?.description?.length ?? 0) >= 20,
    has_course:      Boolean(settings?.has_published_course),
    has_post:        Boolean(settings?.has_published_post),
    has_pricing:     (settings?.pricing_model ?? 'free') !== '',
  }

  const allDone     = CHECKLIST.every(item => checks[item.id])
  const doneCount   = CHECKLIST.filter(item => checks[item.id]).length

  // Keywords
  const [keywords,    setKeywords]    = useState<string[]>([])
  const [kwInput,     setKwInput]     = useState('')
  const [isListed,    setIsListed]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!settings) return
    const raw = settings.discovery_keywords
    if (raw) {
      try { setKeywords(JSON.parse(raw)) } catch { setKeywords([]) }
    }
    setIsListed(Boolean(settings.is_listed))
  }, [settings])

  function addKeyword() {
    const kw = kwInput.trim().toLowerCase().replace(/[^a-záéíóúüñ0-9\s-]/gi, '')
    if (!kw || keywords.includes(kw) || keywords.length >= MAX_KEYWORDS) return
    setKeywords(prev => [...prev, kw])
    setKwInput('')
  }

  function removeKeyword(kw: string) {
    setKeywords(prev => prev.filter(k => k !== kw))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      // Can only go Listed if checklist is complete
      const newListed = allDone ? isListed : false
      await save({
        discovery_keywords: JSON.stringify(keywords),
        is_listed: newListed,
      } as Record<string, unknown>)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Status badge ──────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
        isListed && allDone
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 border-border'
      }`}>
        <div className="flex items-center gap-2.5">
          {isListed && allDone ? (
            <Globe size={16} className="text-green-600" />
          ) : (
            <EyeOff size={16} className="text-gray-400" />
          )}
          <div>
            <p className={`text-sm font-semibold ${isListed && allDone ? 'text-green-700' : 'text-body'}`}>
              {isListed && allDone ? 'Listada' : 'UNLISTED'}
            </p>
            <p className="text-xs text-body-muted">
              {isListed && allDone
                ? 'Tu comunidad aparece en búsquedas y discovery.'
                : 'Tu comunidad no es visible para nuevos usuarios.'}
            </p>
          </div>
        </div>

        {/* Toggle — only enabled when checklist complete */}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={!allDone}
            onClick={() => allDone && setIsListed(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isListed && allDone ? 'bg-green-500' : 'bg-gray-300'
            } ${!allDone ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isListed && allDone ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
          {!allDone && (
            <span className="text-[10px] text-body-muted">Completa la lista primero</span>
          )}
        </div>
      </div>

      {/* ── Completeness checklist ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-body">Checklist de completitud</p>
          <span className="text-xs text-body-muted font-medium">
            {doneCount}/{CHECKLIST.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {CHECKLIST.map(item => {
            const done = checks[item.id]
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition ${
                  done ? 'border-green-200 bg-green-50/50' : 'border-border bg-surface'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  done ? 'bg-green-500' : 'border-2 border-border'
                }`}>
                  {done && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${done ? 'text-green-800 line-through opacity-70' : 'text-body'}`}>
                    {item.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-body-muted mt-0.5">{item.hint}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Keywords ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-body flex items-center gap-1.5">
            <Tag size={14} /> Palabras clave
          </label>
          <span className="text-xs text-body-muted">{keywords.length}/{MAX_KEYWORDS}</span>
        </div>
        <p className="text-xs text-body-muted mb-3">
          Ayudan a que nuevos miembros encuentren tu comunidad en búsquedas.
        </p>

        {/* Chips */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {keywords.map(kw => (
              <KeywordChip key={kw} value={kw} onRemove={() => removeKeyword(kw)} />
            ))}
          </div>
        )}

        {/* Input */}
        {keywords.length < MAX_KEYWORDS && (
          <div className="flex gap-2">
            <input
              value={kwInput}
              onChange={e => setKwInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
              placeholder="Ej: meditación, bienestar, chakras…"
              className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-body-muted text-body transition"
            />
            <button
              type="button"
              onClick={addKeyword}
              disabled={!kwInput.trim()}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-border text-body hover:border-brand-400 hover:text-brand-600 disabled:opacity-40 transition flex items-center gap-1"
            >
              <Plus size={14} /> Añadir
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
