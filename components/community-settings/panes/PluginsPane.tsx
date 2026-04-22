'use client'

/**
 * PluginsPane — Sprint 3.
 *
 * Shows a grid of plugin cards. Some are free, some are Pro-gated.
 * "Upgrade to Pro" modal is UI-only — no Stripe yet.
 */

import { useState } from 'react'
import {
  X, Check, Zap, Bell, MessageSquare, Calendar, Map,
  BarChart2, Users, Globe, Mail, Video, Puzzle, Lock,
} from 'lucide-react'

interface Plugin {
  id: string
  name: string
  desc: string
  icon: React.ReactNode
  pro: boolean
  enabled: boolean
}

const PLUGINS: Plugin[] = [
  { id: 'notifications', name: 'Notificaciones avanzadas', desc: 'Push, email y notificaciones in-app personalizadas.', icon: <Bell size={18} />,         pro: false, enabled: true  },
  { id: 'chat',          name: 'Chat directo',             desc: 'Mensajes directos entre miembros.',                 icon: <MessageSquare size={18} />, pro: false, enabled: true  },
  { id: 'calendar',      name: 'Eventos y calendario',     desc: 'Sesiones en vivo, webinars y eventos recurrentes.', icon: <Calendar size={18} />,     pro: false, enabled: false },
  { id: 'map',           name: 'Mapa de miembros',         desc: 'Visualiza dónde están tus miembros en el mundo.',   icon: <Map size={18} />,           pro: true,  enabled: false },
  { id: 'analytics',     name: 'Analytics avanzados',      desc: 'Conversiones, churn, MRR y embudos de crecimiento.', icon: <BarChart2 size={18} />,   pro: true,  enabled: false },
  { id: 'affiliates',    name: 'Programa de afiliados',    desc: 'Deja que tus miembros refieran y ganen comisión.',  icon: <Users size={18} />,         pro: true,  enabled: false },
  { id: 'custom_domain', name: 'Dominio personalizado',    desc: 'Conecta tu propio dominio a tu comunidad.',         icon: <Globe size={18} />,         pro: true,  enabled: false },
  { id: 'email',         name: 'Campañas de email',        desc: 'Secuencias automáticas y newsletters integrados.',  icon: <Mail size={18} />,          pro: true,  enabled: false },
  { id: 'live',          name: 'Streaming en vivo',        desc: 'Transmite sesiones en vivo directamente.',          icon: <Video size={18} />,         pro: true,  enabled: false },
  { id: 'zapier',        name: 'Zapier / Webhooks',        desc: 'Conecta con más de 5,000 apps externas.',           icon: <Zap size={18} />,           pro: true,  enabled: false },
]

// ─── Upgrade to Pro modal ─────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl border border-border p-6 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base">Elige tu plan</h3>
          <button onClick={onClose} className="p-1 text-body-muted hover:text-body rounded">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Hobby */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <div>
              <p className="font-semibold text-body">Hobby</p>
              <p className="text-2xl font-bold text-body mt-1">Gratis</p>
              <p className="text-xs text-body-muted">Para siempre</p>
            </div>
            <ul className="space-y-2 text-sm">
              {['Comunidad ilimitada', 'Classroom básico', 'Notificaciones', 'Chat directo', 'Hasta 100 miembros'].map(f => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <Check size={13} className="text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-2 text-sm rounded-lg border border-border text-body-muted cursor-not-allowed opacity-50"
            >
              Plan actual
            </button>
          </div>

          {/* Pro */}
          <div className="border-2 border-brand-500 rounded-xl p-4 space-y-3 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Recomendado
              </span>
            </div>
            <div>
              <p className="font-semibold text-body">Pro</p>
              <p className="text-2xl font-bold text-body mt-1">$99<span className="text-sm font-normal text-body-muted">/mes</span></p>
              <p className="text-xs text-body-muted">Facturado mensualmente</p>
            </div>
            <ul className="space-y-2 text-sm">
              {['Todo lo de Hobby', 'Miembros ilimitados', 'Analytics avanzados', 'Afiliados', 'Dominio propio', 'Email campaigns', 'Plugins Pro', 'Soporte prioritario'].map(f => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <Check size={13} className="text-brand-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-2 text-sm rounded-lg bg-brand-500 text-white opacity-50 cursor-not-allowed"
            >
              Disponible en Sprint 7
            </button>
          </div>
        </div>

        <p className="text-xs text-body-muted text-center mt-4">
          El pago con Stripe se activará en Sprint 7. Por ahora todas las funciones Pro están disponibles en beta.
        </p>
      </div>
    </div>
  )
}

// ─── Plugin card ──────────────────────────────────────────────────────────────

function PluginCard({
  plugin,
  onToggle,
  onUpgrade,
}: {
  plugin: Plugin
  onToggle: () => void
  onUpgrade: () => void
}) {
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-3 transition ${
      plugin.enabled ? 'border-brand-300 bg-brand-50/30' : 'border-border bg-surface'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          plugin.pro ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-600'
        }`}>
          {plugin.icon}
        </div>
        {plugin.pro && (
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
            <Lock size={9} /> Pro
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-body">{plugin.name}</p>
        <p className="text-xs text-body-muted mt-0.5 leading-relaxed">{plugin.desc}</p>
      </div>
      {plugin.pro ? (
        <button
          onClick={onUpgrade}
          className="w-full py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
        >
          Activar con Pro
        </button>
      ) : (
        <button
          onClick={onToggle}
          className={`w-full py-1.5 text-xs font-medium rounded-lg border transition ${
            plugin.enabled
              ? 'border-brand-300 bg-brand-500 text-white hover:bg-brand-600'
              : 'border-border text-body hover:border-brand-400 hover:text-brand-600'
          }`}
        >
          {plugin.enabled ? 'Desactivar' : 'Activar'}
        </button>
      )}
    </div>
  )
}

// ─── Plugins pane ─────────────────────────────────────────────────────────────

export default function PluginsPane() {
  const [plugins, setPlugins] = useState<Plugin[]>(PLUGINS)
  const [showUpgrade, setShowUpgrade] = useState(false)

  function togglePlugin(id: string) {
    setPlugins(prev =>
      prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    )
  }

  const free = plugins.filter(p => !p.pro)
  const pro  = plugins.filter(p => p.pro)

  return (
    <div className="space-y-6">
      {/* Beta note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Modo beta:</span> Todos los plugins están disponibles sin costo. Los plugins Pro requerirán plan de pago cuando se active Stripe en Sprint 7.
        </p>
      </div>

      {/* Free plugins */}
      <div>
        <p className="text-xs font-semibold text-body-muted uppercase tracking-wide mb-3">Incluidos en Hobby</p>
        <div className="grid grid-cols-2 gap-3">
          {free.map(p => (
            <PluginCard
              key={p.id}
              plugin={p}
              onToggle={() => togglePlugin(p.id)}
              onUpgrade={() => setShowUpgrade(true)}
            />
          ))}
        </div>
      </div>

      {/* Pro plugins */}
      <div>
        <p className="text-xs font-semibold text-body-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Puzzle size={12} /> Plugins Pro
        </p>
        <div className="grid grid-cols-2 gap-3">
          {pro.map(p => (
            <PluginCard
              key={p.id}
              plugin={p}
              onToggle={() => togglePlugin(p.id)}
              onUpgrade={() => setShowUpgrade(true)}
            />
          ))}
        </div>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
