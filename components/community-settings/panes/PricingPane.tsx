'use client'

/**
 * PricingPane — Sprint 3.
 *
 * Lets the admin choose a pricing model for the community:
 *   Free · Subscription · Freemium · Tiers · 1-time
 *
 * With paywall_enabled = false (beta), all models behave as Free.
 * The selected model + prices are saved to community_settings but not enforced.
 */

import { useEffect, useState } from 'react'
import {
  Check, ChevronDown, ChevronUp, Loader2, Plus, Trash2, X,
} from 'lucide-react'
import { useCommunityData } from '@/context/CommunityDataContext'

type PricingModel = 'free' | 'subscription' | 'freemium' | 'tiers' | 'one_time'

interface Tier {
  name: string
  price_cents: number
  billing: 'monthly' | 'annual' | 'one_time'
  benefits: string[]
  trial_days: number
}

const MODEL_OPTIONS: { key: PricingModel; label: string; desc: string }[] = [
  { key: 'free',         label: 'Free',         desc: 'Acceso gratuito para todos.' },
  { key: 'subscription', label: 'Suscripción',  desc: 'Cobra mensual, anual, o ambos.' },
  { key: 'freemium',     label: 'Freemium',     desc: 'Gratis con 1–2 niveles de pago.' },
  { key: 'tiers',        label: 'Tiers',        desc: '2–3 niveles de pago.' },
  { key: 'one_time',     label: 'Pago único',   desc: 'Un solo pago para acceso de por vida.' },
]

const INPUT = 'w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-body-muted text-body transition'

// ─── Set Price modal ──────────────────────────────────────────────────────────

function SetPriceModal({
  tier,
  model,
  onSave,
  onClose,
}: {
  tier: Tier
  model: PricingModel
  onSave: (updated: Tier) => void
  onClose: () => void
}) {
  const [name,       setName]       = useState(tier.name)
  const [price,      setPrice]      = useState(String(tier.price_cents / 100))
  const [billing,    setBilling]    = useState(tier.billing)
  const [trialDays,  setTrialDays]  = useState(tier.trial_days)
  const [benefits,   setBenefits]   = useState<string[]>(tier.benefits.length ? tier.benefits : [''])
  const [trialOn,    setTrialOn]    = useState(tier.trial_days > 0)

  function addBenefit()  { setBenefits(b => [...b, '']) }
  function removeBenefit(i: number) { setBenefits(b => b.filter((_, idx) => idx !== i)) }
  function editBenefit(i: number, val: string) {
    setBenefits(b => b.map((v, idx) => idx === i ? val : v))
  }

  function handleSave() {
    onSave({
      name:        name.trim() || tier.name,
      price_cents: Math.round(parseFloat(price || '0') * 100),
      billing,
      benefits:    benefits.filter(b => b.trim()),
      trial_days:  trialOn ? (trialDays || 7) : 0,
    })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl shadow-2xl border border-border p-6 w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Configurar precio</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded"><X size={15} /></button>
        </div>

        {/* Tier name */}
        {(model === 'freemium' || model === 'tiers') && (
          <div>
            <label className="block text-xs font-medium text-body mb-1">Nombre del nivel</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pro, Premium…" className={INPUT} />
          </div>
        )}

        {/* Price */}
        {model !== 'free' && (
          <div>
            <label className="block text-xs font-medium text-body mb-1">Precio (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-muted text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={INPUT + ' pl-7'}
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Billing cycle */}
        {(model === 'subscription' || model === 'freemium' || model === 'tiers') && (
          <div>
            <label className="block text-xs font-medium text-body mb-2">Ciclo de cobro</label>
            <div className="flex gap-2">
              {(['monthly', 'annual', 'one_time'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBilling(opt)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition font-medium ${
                    billing === opt
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-border text-body-muted hover:border-brand-300'
                  }`}
                >
                  {opt === 'monthly' ? 'Mensual' : opt === 'annual' ? 'Anual' : 'Único'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7-day trial */}
        {(model === 'subscription' || model === 'freemium' || model === 'tiers') && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-body">Período de prueba</p>
              <p className="text-xs text-body-muted">Días gratis antes del primer cobro.</p>
            </div>
            <div className="flex items-center gap-2">
              {trialOn && (
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={trialDays}
                  onChange={e => setTrialDays(Number(e.target.value))}
                  className="w-14 px-2 py-1 text-sm text-center border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              )}
              <button
                type="button"
                onClick={() => setTrialOn(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${trialOn ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${trialOn ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-body">Beneficios incluidos</label>
            <button
              type="button"
              onClick={addBenefit}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
            >
              <Plus size={12} /> Añadir
            </button>
          </div>
          <div className="space-y-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={b}
                  onChange={e => editBenefit(i, e.target.value)}
                  placeholder={`Beneficio ${i + 1}`}
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(i)}
                  className="p-2 text-body-muted hover:text-red-500 transition flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-body-muted hover:text-body rounded-lg hover:bg-surface-secondary transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Model card ───────────────────────────────────────────────────────────────

function ModelCard({
  option,
  selected,
  onSelect,
  tiers,
  onEditTier,
}: {
  option: (typeof MODEL_OPTIONS)[0]
  selected: boolean
  onSelect: () => void
  tiers: Tier[]
  onEditTier: (idx: number) => void
}) {
  const [expanded, setExpanded] = useState(selected)

  useEffect(() => { if (selected) setExpanded(true) }, [selected])

  const showTiers = option.key !== 'free' && selected

  return (
    <div
      className={`border rounded-xl overflow-hidden transition ${
        selected ? 'border-brand-400 shadow-sm' : 'border-border'
      }`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
          selected ? 'bg-brand-50' : 'bg-surface hover:bg-surface-secondary'
        }`}
      >
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
          selected ? 'border-brand-500 bg-brand-500' : 'border-border'
        }`}>
          {selected && <Check size={9} className="text-white" strokeWidth={3} />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${selected ? 'text-brand-700' : 'text-body'}`}>
            {option.label}
          </p>
          <p className="text-xs text-body-muted mt-0.5">{option.desc}</p>
        </div>
        {selected && option.key !== 'free' && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            className="text-body-muted hover:text-body transition p-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </button>

      {/* Tier rows */}
      {showTiers && expanded && (
        <div className="border-t border-border divide-y divide-border bg-surface">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-body">{tier.name || `Nivel ${i + 1}`}</p>
                <p className="text-xs text-body-muted">
                  {tier.price_cents === 0
                    ? 'Gratis'
                    : `$${(tier.price_cents / 100).toFixed(2)} / ${
                        tier.billing === 'monthly' ? 'mes' : tier.billing === 'annual' ? 'año' : 'única vez'
                      }`}
                  {tier.trial_days > 0 ? ` · ${tier.trial_days} días gratis` : ''}
                </p>
                {tier.benefits.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {tier.benefits.map((b, j) => (
                      <li key={j} className="flex items-center gap-1.5 text-xs text-body-muted">
                        <Check size={10} className="text-green-500 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEditTier(i)}
                className="ml-4 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-body hover:border-brand-400 hover:text-brand-600 transition flex-shrink-0"
              >
                Configurar precio
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Default tiers per model ──────────────────────────────────────────────────

function defaultTiers(model: PricingModel): Tier[] {
  const base: Tier = { name: '', price_cents: 0, billing: 'monthly', benefits: [], trial_days: 0 }
  switch (model) {
    case 'subscription': return [{ ...base, name: 'Miembro' }]
    case 'freemium':     return [{ ...base, name: 'Pro', price_cents: 2900 }]
    case 'tiers':        return [
      { ...base, name: 'Básico',   price_cents: 900 },
      { ...base, name: 'Pro',      price_cents: 2900 },
      { ...base, name: 'Premium',  price_cents: 4900 },
    ]
    case 'one_time':     return [{ ...base, name: 'Acceso completo', billing: 'one_time', price_cents: 9700 }]
    default:             return []
  }
}

// ─── Pricing pane ─────────────────────────────────────────────────────────────

export default function PricingPane() {
  const { settings, save, refresh } = useCommunityData()

  const [model, setModel] = useState<PricingModel>(
    ((settings?.pricing_model) as PricingModel | undefined) ?? 'free'
  )
  const [tiersByModel, setTiersByModel] = useState<Record<PricingModel, Tier[]>>({
    free:         [],
    subscription: defaultTiers('subscription'),
    freemium:     defaultTiers('freemium'),
    tiers:        defaultTiers('tiers'),
    one_time:     defaultTiers('one_time'),
  })

  // Which tier is being edited
  const [editingTier, setEditingTier] = useState<{ modelKey: PricingModel; idx: number } | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    if (!settings) return
    if (settings.pricing_model) setModel((settings.pricing_model) as PricingModel)
  }, [settings])

  function selectModel(key: PricingModel) {
    setModel(key)
    // Seed tiers with defaults if empty
    if (key !== 'free' && tiersByModel[key].length === 0) {
      setTiersByModel(prev => ({ ...prev, [key]: defaultTiers(key) }))
    }
  }

  function saveTier(updated: Tier) {
    if (!editingTier) return
    const { modelKey, idx } = editingTier
    setTiersByModel(prev => ({
      ...prev,
      [modelKey]: prev[modelKey].map((t, i) => i === idx ? updated : t),
    }))
    setEditingTier(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await save({
        pricing_model: model,
        pricing_tiers: JSON.stringify(tiersByModel[model]),
      } as Record<string, unknown>)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const editingTierData = editingTier ? tiersByModel[editingTier.modelKey][editingTier.idx] : null

  return (
    <div className="space-y-5">
      {/* Beta banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Modo beta:</span> La configuración se guarda pero no se aplica hasta que se active el paywall en Sprint 7 (Stripe).
        </p>
      </div>

      <p className="text-sm text-body-muted">Elige el modelo de acceso a tu comunidad.</p>

      <div className="space-y-3">
        {MODEL_OPTIONS.map(option => (
          <ModelCard
            key={option.key}
            option={option}
            selected={model === option.key}
            onSelect={() => selectModel(option.key)}
            tiers={tiersByModel[option.key]}
            onEditTier={idx => setEditingTier({ modelKey: option.key, idx })}
          />
        ))}
      </div>

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

      {editingTier && editingTierData && (
        <SetPriceModal
          tier={editingTierData}
          model={editingTier.modelKey}
          onSave={saveTier}
          onClose={() => setEditingTier(null)}
        />
      )}
    </div>
  )
}
