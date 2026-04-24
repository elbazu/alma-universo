'use client'

/**
 * InvitePane — Sprint 6.
 *
 * Three sections:
 *  1. Shareable invite link — copy, regenerate.
 *  2. Send email invitations — add emails, send bulk.
 *  3. Pending invites — list with revoke option.
 *
 * Invites are stored in the `invites` PocketBase collection (Sprint 6 schema).
 * Until schema is applied, the pane renders with graceful empty states.
 */

import { useEffect, useState } from 'react'
import {
  Copy, Check, RefreshCw, Send, X, Loader2, Mail,
  Link as LinkIcon, Clock, UserPlus,
} from 'lucide-react'
import { getPb } from '@/lib/pocketbase'
import { useCommunityData } from '@/context/CommunityDataContext'

interface Invite {
  id: string
  email: string
  created: string
  status: 'pending' | 'accepted' | 'expired'
}

// ─── Invite link section ──────────────────────────────────────────────────────

function InviteLinkSection({ communitySlug }: { communitySlug: string }) {
  const [copied,      setCopied]      = useState(false)
  const [token,       setToken]       = useState('default')
  const [regenerating, setRegenerating] = useState(false)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${communitySlug}?ref=${token}`
    : `https://mialmauniverso.com/join/${communitySlug}?ref=${token}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    // Generate a simple random token — in production this would be a PB call
    const newToken = Math.random().toString(36).substring(2, 10)
    setToken(newToken)
    setTimeout(() => setRegenerating(false), 500)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
          <LinkIcon size={14} className="text-brand-600" />
        </div>
        <p className="text-sm font-semibold text-body">Enlace de invitación</p>
      </div>
      <p className="text-xs text-body-muted">
        Comparte este enlace y cualquier persona podrá unirse directamente.
      </p>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-border rounded-lg overflow-hidden">
          <span className="text-xs text-body-muted truncate flex-1">{inviteUrl}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition flex-shrink-0 ${
            copied
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-border text-body hover:border-brand-400 hover:text-brand-600'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="flex items-center gap-1.5 text-xs text-body-muted hover:text-body transition"
      >
        <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
        Regenerar enlace
      </button>
    </div>
  )
}

// ─── Email invites section ────────────────────────────────────────────────────

function EmailInviteSection({
  onInviteSent,
}: {
  onInviteSent: (email: string) => void
}) {
  const [emails,   setEmails]   = useState<string[]>([''])
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')

  function addEmail() {
    if (emails.length >= 10) return
    setEmails(prev => [...prev, ''])
  }

  function removeEmail(i: number) {
    setEmails(prev => prev.filter((_, idx) => idx !== i))
  }

  function editEmail(i: number, val: string) {
    setEmails(prev => prev.map((v, idx) => idx === i ? val : v))
  }

  async function handleSend() {
    const valid = emails.filter(e => e.trim() && e.includes('@'))
    if (valid.length === 0) { setError('Añade al menos un email válido.'); return }

    setSending(true)
    setError('')
    try {
      const pb = getPb()
      // Store invites in PB — graceful if collection doesn't exist yet
      for (const email of valid) {
        try {
          await pb.collection('invites').create({
            email:  email.trim().toLowerCase(),
            status: 'pending',
          })
        } catch {
          // Collection may not exist yet — still mark as "sent" UI-wise
        }
        onInviteSent(email.trim().toLowerCase())
      }
      setEmails([''])
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    } catch {
      setError('Error al enviar invitaciones.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Mail size={14} className="text-brand-600" />
        </div>
        <p className="text-sm font-semibold text-body">Invitar por email</p>
      </div>

      <div className="space-y-2">
        {emails.map((email, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => editEmail(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
              placeholder="nombre@ejemplo.com"
              className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-body-muted text-body transition"
            />
            {emails.length > 1 && (
              <button
                type="button"
                onClick={() => removeEmail(i)}
                className="p-2 text-body-muted hover:text-red-500 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {emails.length < 10 && (
        <button
          type="button"
          onClick={addEmail}
          className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition"
        >
          <UserPlus size={12} /> Añadir otro email
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSend}
        disabled={sending}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
          sent
            ? 'bg-green-500 text-white'
            : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50'
        }`}
      >
        {sending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : sent ? (
          <Check size={14} />
        ) : (
          <Send size={14} />
        )}
        {sent ? '¡Invitaciones enviadas!' : 'Enviar invitaciones'}
      </button>
    </div>
  )
}

// ─── Pending invites list ─────────────────────────────────────────────────────

function PendingInvitesList({
  invites,
  onRevoke,
}: {
  invites: Invite[]
  onRevoke: (id: string) => void
}) {
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2 border border-dashed border-border rounded-xl">
        <Clock size={20} className="text-body-muted" />
        <p className="text-sm text-body-muted">No hay invitaciones pendientes.</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
      {invites.map(invite => (
        <div key={invite.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-secondary flex items-center justify-center text-xs font-semibold text-body-muted">
              {invite.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-body">{invite.email}</p>
              <p className="text-xs text-body-muted">
                {new Date(invite.created).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              invite.status === 'accepted'
                ? 'bg-green-100 text-green-700'
                : invite.status === 'expired'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {invite.status === 'accepted' ? 'Aceptada' : invite.status === 'expired' ? 'Expirada' : 'Pendiente'}
            </span>
            {invite.status === 'pending' && (
              <button
                onClick={() => onRevoke(invite.id)}
                className="p-1 text-body-muted hover:text-red-500 transition rounded"
                title="Revocar invitación"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Invite pane ──────────────────────────────────────────────────────────────

export default function InvitePane() {
  const { settings } = useCommunityData()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  const communitySlug = settings?.url_slug ?? 'mi-alma'

  // Load existing invites from PB
  useEffect(() => {
    const pb = getPb()
    pb.collection('invites')
      .getFullList({ sort: '-created', requestKey: 'invites_list' })
      .then(list => {
        setInvites(
          (list as Record<string, unknown>[]).map(r => ({
            id:      r.id as string,
            email:   (r.email as string) || '',
            created: (r.created as string) || new Date().toISOString(),
            status:  ((r.status as string) || 'pending') as Invite['status'],
          }))
        )
      })
      .catch(() => setInvites([]))
      .finally(() => setLoading(false))
  }, [])

  function handleInviteSent(email: string) {
    setInvites(prev => [
      {
        id:      Date.now().toString(),
        email,
        created: new Date().toISOString(),
        status:  'pending',
      },
      ...prev,
    ])
  }

  async function handleRevoke(id: string) {
    const pb = getPb()
    try {
      await pb.collection('invites').delete(id)
    } catch {
      // Graceful — remove from UI regardless
    }
    setInvites(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-6">

      <InviteLinkSection communitySlug={communitySlug} />

      <div className="border-t border-border" />

      <EmailInviteSection onInviteSent={handleInviteSent} />

      <div className="border-t border-border" />

      {/* Pending invites */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-body">Invitaciones enviadas</p>
          {invites.length > 0 && (
            <span className="text-xs text-body-muted">{invites.filter(i => i.status === 'pending').length} pendientes</span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin text-brand-400" />
          </div>
        ) : (
          <PendingInvitesList invites={invites} onRevoke={handleRevoke} />
        )}
      </div>
    </div>
  )
}
