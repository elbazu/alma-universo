'use client'

/**
 * MemberMap — renders a Leaflet map with member pins.
 *
 * Each displayed pin is offset ±0.15° from the stored coordinate
 * (≈ 10 miles / 16 km) so no precise location is ever shown.
 *
 * Only members who have:
 *   • show_location === true
 *   • location_lat and location_lng set (non-zero)
 * appear on the map.
 *
 * Icons are created lazily inside the component (not at module level)
 * to avoid Leaflet initialising before the browser is ready.
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { getPb } from '@/lib/pocketbase'
import { Users, MapPin } from 'lucide-react'

// ─── Privacy offset ───────────────────────────────────────────────────────────

function privacyOffset(id: string, val: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const norm = (hash % 10000) / 10000
  return val + (norm - 0.5) * 0.30
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapMember {
  id: string
  name: string
  lat: number
  lng: number
  locationText: string
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberMap() {
  const [members, setMembers] = useState<MapMember[]>([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<LeafletMap | null>(null)

  // Build SVG pin icons lazily — must be inside component, not module scope
  const pinIcon = useMemo(() => {
    // Dynamic require keeps Leaflet out of SSR bundle entirely
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
            fill="#7c3aed" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>`
    return L.divIcon({ html: svg, className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38] })
  }, [])

  // Fit map to pins once both map and members are ready
  useEffect(() => {
    if (!mapRef.current || members.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    if (members.length === 1) {
      mapRef.current.setView([members[0].lat, members[0].lng], 5)
    } else {
      const bounds = L.latLngBounds(members.map(m => [m.lat, m.lng] as [number, number]))
      mapRef.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 })
    }
  }, [members])

  useEffect(() => {
    async function load() {
      try {
        const pb = getPb()
        const records = await pb.collection('user_profiles').getFullList({
          filter: 'show_location=true && location_lat!=0 && location_lng!=0',
          fields: 'id,first_name,last_name,username,location_text,location_lat,location_lng',
          requestKey: 'map_members',
        })

        const parsed: MapMember[] = (records as Record<string, unknown>[])
          .filter(r => r.location_lat && r.location_lng)
          .map(r => {
            const id  = r.id as string
            const lat = privacyOffset(id + 'lat', r.location_lat as number)
            const lng = privacyOffset(id + 'lng', r.location_lng as number)
            const name = [r.first_name, r.last_name].filter(Boolean).join(' ') as string
              || (r.username as string) || 'Miembro'
            return { id, name, lat, lng, locationText: (r.location_text as string) || '' }
          })

        setMembers(parsed)
      } catch {
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-border bg-surface flex items-center justify-center"
           style={{ height: 520 }}>
        <div className="flex flex-col items-center gap-2 text-body-muted">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Cargando miembros…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Member count */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full w-fit">
        <Users size={13} className="text-brand-600" />
        <span className="text-xs font-medium text-brand-700">
          {members.length} {members.length === 1 ? 'miembro visible' : 'miembros visibles'}
        </span>
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm" style={{ height: 520 }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {members.map(member => (
            <Marker
              key={member.id}
              position={[member.lat, member.lng]}
              icon={pinIcon}
            >
              <Popup>
                <div className="flex items-start gap-2 py-1 min-w-[140px]">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-snug">{member.name}</p>
                    {member.locationText && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {member.locationText}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Privacy notice */}
      <p className="text-xs text-body-muted text-center">
        🔒 Los pins están desplazados ~10 millas por privacidad.
        Configura tu ubicación en <a href="/members" className="underline hover:text-body transition">tu perfil</a>.
      </p>
    </div>
  )
}
