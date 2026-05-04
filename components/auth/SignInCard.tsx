'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPb } from '@/lib/pocketbase'

type Step = 'initial' | 'otp-verify'
type Tab = 'login' | 'register'

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid #E0C070',
  borderRadius: '20px',
  boxShadow: '0 8px 40px rgba(180, 130, 40, 0.15)',
}

const GOLD_BTN_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #C8942A, #E07B2A)',
}

export default function SignInCard() {
  const [step, setStep] = useState<Step>('initial')
  const [activeTab, setActiveTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpId, setOtpId] = useState('')
  const [loading, setLoading] = useState<'google' | 'email' | 'verify' | 'register' | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  // ── Google OAuth ────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading('google')
    setError('')
    try {
      const pb = getPb()
      await pb.collection('users').authWithOAuth2({ provider: 'google' })
      router.push('/community')
    } catch {
      setError('No se pudo conectar con Google. Intenta de nuevo.')
      setLoading(null)
    }
  }

  // ── Request OTP (login) ─────────────────────────────────────────
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading('email')
    setError('')
    try {
      const pb = getPb()
      const result = await pb.collection('users').requestOTP(email)
      setOtpId(result.otpId)
      setStep('otp-verify')
    } catch {
      setError('No pudimos enviar el código. Verifica tu correo.')
    } finally {
      setLoading(null)
    }
  }

  // ── Register + send OTP ─────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !firstName) return
    setLoading('register')
    setError('')
    try {
      const pb = getPb()
      await pb.collection('users').create({
        email,
        name: `${firstName} ${lastName}`.trim(),
        emailVisibility: true,
      })
      const result = await pb.collection('users').requestOTP(email)
      setOtpId(result.otpId)
      setStep('otp-verify')
    } catch {
      setError('No pudimos crear tu cuenta. El correo puede ya estar registrado.')
    } finally {
      setLoading(null)
    }
  }

  // ── Verify OTP ──────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otpCode || !otpId) return
    setLoading('verify')
    setError('')
    try {
      const pb = getPb()
      await pb.collection('users').authWithOTP(otpId, otpCode)
      router.push('/community')
    } catch {
      setError('Código incorrecto o expirado. Intenta de nuevo.')
      setLoading(null)
    }
  }

  // ── OTP verification screen ─────────────────────────────────────
  if (step === 'otp-verify') {
    return (
      <div className="w-full px-8 py-8 flex flex-col gap-6" style={CARD_STYLE}>
        <BrandHeader />
        <div className="text-center flex flex-col gap-2">
          <div className="text-3xl animate-float">✉️</div>
          <p className="font-display text-amber-900 text-lg">Revisa tu correo</p>
          <p className="text-amber-800/60 text-sm leading-relaxed">
            Enviamos un código de 6 dígitos a{' '}
            <span className="text-amber-700 font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            autoFocus
            className="w-full border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-900 placeholder:text-amber-300 text-center text-2xl tracking-[0.5em] outline-none transition-all bg-white"
          />
          <button
            type="submit"
            disabled={loading === 'verify' || otpCode.length < 6}
            className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={GOLD_BTN_STYLE}
          >
            {loading === 'verify' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              'Entrar ✦'
            )}
          </button>
        </form>

        {error && <p className="text-red-500/80 text-xs text-center">{error}</p>}

        <button
          onClick={() => { setStep('initial'); setOtpCode(''); setError('') }}
          className="text-amber-700/40 text-xs hover:text-amber-700/70 transition-colors text-center"
        >
          ← Volver
        </button>
      </div>
    )
  }

  // ── Initial screen ──────────────────────────────────────────────
  return (
    <div className="w-full px-8 py-8 flex flex-col gap-5" style={CARD_STYLE}>
      <BrandHeader />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-amber-50 rounded-xl">
        <TabButton active={activeTab === 'login'} onClick={() => { setActiveTab('login'); setError('') }}>
          Iniciar Sesión
        </TabButton>
        <TabButton active={activeTab === 'register'} onClick={() => { setActiveTab('register'); setError('') }}>
          Registrarse
        </TabButton>
      </div>

      {activeTab === 'login' ? (
        <>
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-amber-900 text-sm font-light tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <span className="w-4 h-4 border border-amber-400/40 border-t-amber-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-100" />
            <span className="text-amber-400 text-xs tracking-widest">o</span>
            <div className="flex-1 h-px bg-amber-100" />
          </div>

          {/* Email OTP */}
          <form onSubmit={handleRequestOTP} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              disabled={loading !== null}
              className="w-full border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-900 placeholder:text-amber-300 text-sm outline-none transition-all bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading !== null || !email}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={GOLD_BTN_STYLE}
            >
              {loading === 'email' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Recibir código ✦'
              )}
            </button>
          </form>
        </>
      ) : (
        <>
          {/* Register form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Nombre"
                required
                disabled={loading !== null}
                className="flex-1 border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-900 placeholder:text-amber-300 text-sm outline-none transition-all bg-white disabled:opacity-50"
              />
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Apellido"
                disabled={loading !== null}
                className="flex-1 border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-900 placeholder:text-amber-300 text-sm outline-none transition-all bg-white disabled:opacity-50"
              />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              disabled={loading !== null}
              className="w-full border border-amber-200 focus:border-amber-400 rounded-xl px-4 py-3 text-amber-900 placeholder:text-amber-300 text-sm outline-none transition-all bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading !== null || !email || !firstName}
              className="w-full py-3 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={GOLD_BTN_STYLE}
            >
              {loading === 'register' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta ✦'
              )}
            </button>
          </form>
          <p className="text-xs text-amber-800/60 text-center">
            Al registrarte aceptas nuestros{' '}
            <a href="/terms" className="underline hover:text-amber-700">Términos</a> y{' '}
            <a href="/privacy" className="underline hover:text-amber-700">Política de Privacidad</a>.
          </p>
        </>
      )}

      {error && <p className="text-red-500/80 text-xs text-center">{error}</p>}
    </div>
  )
}

function BrandHeader() {
  return (
    <div className="text-center mb-1">
      <h1 className="font-cinzel text-xl font-semibold tracking-widest text-amber-900 uppercase">
        Mi Alma en el Universo
      </h1>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-white shadow text-amber-900'
          : 'text-amber-700/60 hover:text-amber-800'
      }`}
    >
      {children}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
