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
 */

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { getPb } from '@/lib/pocketbase'
import { Users, MapPin } from 'lucide-react'

// ─── Fix default icon paths broken by webpack ────────────────────────────────

// Leaflet's default icon uses image URLs that webpack mangles.
// We replace them with a custom SVG pin so no external images are needed.
function buildIcon(color = '#7c3aed') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -38],
  })
}

const PIN_ICON  = buildIcon('#7c3aed')  // brand purple
const SELF_ICON = buildIcon('#059669')  // green for current user

// ─── Privacy offset ───────────────────────────────────────────────────────────

/** Add a deterministic but pseudo-random offset ±0.15° based on the record id */
function privacyOffset(id: string, val: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  // map to [-0.15, +0.15]
  const norm = (hash % 10000) / 10000   // 0..1
  return val + (norm - 0.5) * 0.30
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MapMember {
  id: string
  name: string
  avatarUrl?: string
  lat: number
  lng: number
  locationText: string
}

// ─── Fit-bounds helper ───────────────────────────────────────────────────────

function FitBounds({ members }: { members: MapMember[] }) {
  const map = useMap()
  useEffect(() => {
    if (members.length === 0) return
    if (members.length === 1) {
      map.setView([members[0].lat, members[0].lng], 5)
      return
    }
    const bounds = L.latLngBounds(members.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 })
  }, [members, map])
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberMap() {
  const [members,  setMembers]  = useState<MapMember[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function load() {
      try {
        const pb = getPb()
        const records = await pb.collection('user_profiles').getFullList({
          filter: 'show_location=true && location_lat!=0 && location_lng!=0',
          fields: 'id,first_name,last_name,username,avatar,location_text,location_lat,location_lng',
          requestKey: 'map_members',
        })

        const parsed: MapMember[] = (records as Record<string, unknown>[])
          .filter(r => r.location_lat && r.location_lng)
          .map(r => {
            const id  = r.id as string
            const lat = privacyOffset(id + 'lat', r.location_lat as number)
            const lng = privacyOffset(id + 'lng', r.location_lng as number)
            const first = (r.first_name as string) || ''
            const last  = (r.last_name  as string) || ''
            const name  = [first, last].filter(Boolean).join(' ') || (r.username as string) || 'Miembro'
            return { id, name, lat, lng, locationText: (r.location_text as string) || '' }
          })

        setMembers(parsed)
      } catch {
        // Graceful — collection may not have lat/lng yet
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

  const defaultCenter: [number, number] = [20, 0]
  const defaultZoom = 2

  return (
    <div className="space-y-3">
      {/* Member count pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-full">
          <Users size={13} className="text-brand-600" />
          <span className="text-xs font-medium text-brand-700">
            {members.length} {members.length === 1 ? 'miembro visible' : 'miembros visibles'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm" style={{ height: 520 }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {members.length > 0 && <FitBounds members={members} />}

          {members.map(member => (
            <Marker
              key={member.id}
              position={[member.lat, member.lng]}
              icon={PIN_ICON}
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

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Privacy notice */}
      <p className="text-xs text-body-muted text-center">
        🔒 Los pins están desplazados ~10 millas por privacidad.
        Configura tu ubicación en <a href="/members" className="underline hover:text-body transition">tu perfil</a>.
      </p>
    </div>
  )
}
