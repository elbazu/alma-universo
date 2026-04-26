'use client'

/**
 * MemberMap — vanilla Leaflet initialized inside useEffect.
 *
 * We bypass react-leaflet entirely because react-leaflet v5 has
 * incompatibilities with Next.js 14 App Router that cause a
 * "r is not a function" crash regardless of dynamic-import tricks.
 *
 * Instead: mount a plain <div>, then imperatively build the Leaflet
 * map inside useEffect (runs only in the browser, never on the server).
 *
 * Privacy: each pin is offset ±0.15° (~10 miles) from the stored
 * coordinate using a deterministic hash of the record id.
 */

import { useEffect, useRef, useState } from 'react'
import { getPb } from '@/lib/pocketbase'
import { Users } from 'lucide-react'

// ─── Privacy offset ───────────────────────────────────────────────────────────

function privacyOffset(id: string, val: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const norm = (hash % 10000) / 10000   // 0..1
  return val + (norm - 0.5) * 0.30      // ±0.15°
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapMember {
  id: string
  name: string
  lat: number
  lng: number
  locationText: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MemberMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let map: import('leaflet').Map | null = null

    async function init() {
      // 1. Dynamically import Leaflet (browser only, never SSR)
      const L = (await import('leaflet')).default

      // 2. Load members from PocketBase
      let members: MapMember[] = []
      try {
        const pb = getPb()
        const records = await pb.collection('user_profiles').getFullList({
          filter: 'show_location=true && location_lat!=0 && location_lng!=0',
          fields: 'id,first_name,last_name,username,location_text,location_lat,location_lng',
          requestKey: 'map_members',
        })
        members = (records as Record<string, unknown>[])
          .filter(r => r.location_lat && r.location_lng)
          .map(r => {
            const id  = r.id as string
            const lat = privacyOffset(id + 'lat', r.location_lat as number)
            const lng = privacyOffset(id + 'lng', r.location_lng as number)
            const name =
              [r.first_name, r.last_name].filter(Boolean).join(' ') ||
              (r.username as string) || 'Miembro'
            return { id, name: name as string, lat, lng, locationText: (r.location_text as string) || '' }
          })
      } catch {
        members = []
      }

      setMemberCount(members.length)
      setLoading(false)

      // 3. Guard: container must still be mounted
      if (!containerRef.current) return

      // 4. Build the map
      map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([20, 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      // 5. Custom SVG pin icon
      const pinIcon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
                fill="#7c3aed" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="4.5" fill="white"/>
        </svg>`,
        className: '',
        iconSize:    [24, 36],
        iconAnchor:  [12, 36],
        popupAnchor: [0, -38],
      })

      // 6. Add markers
      const latLngs: [number, number][] = []
      members.forEach(m => {
        latLngs.push([m.lat, m.lng])
        const popup = `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;min-width:140px">
            <div style="width:32px;height:32px;border-radius:50%;background:#ede9fe;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#6d28d9;flex-shrink:0">
              ${m.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style="margin:0;font-weight:600;font-size:13px;line-height:1.3">${m.name}</p>
              ${m.locationText ? `<p style="margin:4px 0 0;font-size:11px;color:#6b7280">${m.locationText}</p>` : ''}
            </div>
          </div>`
        L.marker([m.lat, m.lng], { icon: pinIcon })
          .bindPopup(popup)
          .addTo(map!)
      })

      // 7. Fit bounds to members
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 5)
      } else if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48], maxZoom: 8 })
      }
    }

    init()

    // Cleanup on unmount
    return () => { map?.remove() }
  }, [])

  return (
    <div className="space-y-3">
      {/* Member count pill */}
      {!loading && memberCount !== null && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full w-fit">
          <Users size={13} className="text-brand-600" />
          <span className="text-xs font-medium text-brand-700">
            {memberCount} {memberCount === 1 ? 'miembro visible' : 'miembros visibles'}
          </span>
        </div>
      )}

      {/* Map container — Leaflet mounts into this div */}
      <div className="relative rounded-2xl border border-border overflow-hidden shadow-sm" style={{ height: 520 }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface z-10">
            <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-body-muted">Cargando mapa…</span>
          </div>
        )}
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Privacy notice */}
      <p className="text-xs text-body-muted text-center">
        🔒 Los pins están desplazados ~10 millas por privacidad.
        Configura tu ubicación en{' '}
        <a href="/members" className="underline hover:text-body transition">tu perfil</a>.
      </p>
    </div>
  )
}
