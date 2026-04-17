"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInCard() {
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [error, setError] = useState("")

  async function handleGoogle() {
    setLoading("google")
    setError("")
    await signIn("google", { callbackUrl: "/community" })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading("email")
    setError("")
    try {
      const result = await signIn("email", {
        email,
        callbackUrl: "/community",
        redirect: false,
      })
      if (result?.error) {
        setError("Hubo un problema. Intenta de nuevo.")
      } else {
        setEmailSent(true)
      }
    } catch {
      setError("Hubo un problema. Intenta de nuevo.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="glass-card w-full rounded-2xl px-8 py-8 flex flex-col gap-6">
      {emailSent ? (
        <div className="text-center flex flex-col gap-3 py-2">
          <div className="text-3xl">✉️</div>
          <p className="font-display text-white/90 text-lg font-normal">
            Revisa tu correo
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Te enviamos un enlace mágico a{" "}
            <span className="text-rose-200/80">{email}</span>.
            Haz clic en él para entrar a tu espacio.
          </p>
          <button
            onClick={() => { setEmailSent(false); setEmail("") }}
            className="mt-2 text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            Usar otro correo
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-white/60 text-sm font-light tracking-wide">
              Entra a tu espacio sagrado
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/90 text-sm font-light tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "google" ? (
              <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs tracking-widest">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email magic link */}
          <form onSubmit={handleEmail} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              disabled={loading !== null}
              className="w-full bg-white/5 border border-white/15 focus:border-rose-300/40 focus:bg-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/25 text-sm outline-none transition-all duration-300 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading !== null || !email}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-400/30 to-purple-500/30 hover:from-rose-400/50 hover:to-purple-500/50 border border-rose-300/20 hover:border-rose-300/40 text-white/90 text-sm font-light tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === "email" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                "Recibir enlace mágico ✦"
              )}
            </button>
          </form>

          {error && (
            <p className="text-rose-300/70 text-xs text-center">{error}</p>
          )}
        </>
      )}
    </div>
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
