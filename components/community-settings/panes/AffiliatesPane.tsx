'use client'

/**
 * AffiliatesPane — Sprint 3.
 *
 * Lets the admin set an affiliate commission rate (Off, 10%–50%).
 * Saves to community_settings.affiliate_rate but not enforced until Sprint 7.
 */

import { useEffect, useState } from 'react'
import { Check, Loader2, Users, ExternalLink } from 'lucide-react'
import { useCommunityData } from '@/context/CommunityDataContext'

const RATES = ['off', '10', '20', '30', '40', '50'] as const
type Rate = (typeof RATES)[number]

export default function AffiliatesPane() {
  const { settings, save, refresh } = useCommunityData()

  const [rate,   setRate]   = useState<Rate>('off')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    if (!settings) return
    const r = settings.affiliate_rate
    setRate((r as Rate) ?? 'off')
  }, [settings])

  async function handleSave() {
    setSaving(true)
    try {
      await save({ affiliate_rate: rate } as Record<string, unknown>)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Beta banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Modo beta:</span> La tasa de afiliados se guarda pero no se aplica hasta que se active Stripe en Sprint 7.
        </p>
      </div>

      {/* Explainer */}
      <div className="flex items-start gap-3 bg-surface-secondary rounded-xl p-4">
        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-body">Programa de afiliados</p>
          <p className="text-xs text-body-muted mt-1 leading-relaxed">
            Tus miembros recibirán un enlace único para referir nuevos usuarios.
            Cuando alguien se una a través de ese enlace y pague, el afiliado recibe la comisión elegida.
          </p>
        </div>
      </div>

      {/* Rate selector */}
      <div>
        <label className="block text-sm font-medium text-body mb-3">Tasa de comisión</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {RATES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRate(r)}
              className={`py-2.5 rounded-xl border text-sm font-semibold transition ${
                rate === r
                  ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-border text-body-muted hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {r === 'off' ? 'Off' : `${r}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary when active */}
      {rate !== 'off' && (
        <div className="border border-green-200 bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800">
          Los afiliados recibirán <span className="font-semibold">{rate}%</span> de comisión por cada nuevo miembro que refieran y pague.
        </div>
      )}

      {rate === 'off' && (
        <div className="border border-border rounded-xl px-4 py-3 text-sm text-body-muted">
          El programa de afiliados está desactivado. Los miembros no podrán generar enlaces de referido.
        </div>
      )}

      {/* How it works */}
      <div className="border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-body">Cómo funciona</p>
        {[
          'Cada miembro verá su enlace de referido en su perfil.',
          'Cuando alguien se una con ese enlace y complete el pago, el afiliado acumula su comisión.',
          'Los cobros se liquidan mensualmente vía Stripe (disponible en Sprint 7).',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-body-muted">
            <span className="w-4 h-4 rounded-full bg-surface-secondary flex items-center justify-center text-[10px] font-bold text-body flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            {step}
          </div>
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
    </div>
  )
}
