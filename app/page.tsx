"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SignInCard from "@/components/auth/SignInCard"

export default function LandingPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/community")
    }
  }, [status, router])

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen galaxy-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen galaxy-bg relative overflow-hidden flex flex-col items-center justify-center px-4">

      {/* Watercolor blobs */}
      <div className="blob blob-purple" />
      <div className="blob blob-teal" />
      <div className="blob blob-rose" />
      <div className="blob blob-gold" />
      <div className="blob blob-violet" />

      {/* Star field */}
      <div className="stars" aria-hidden="true" />
      <div className="stars stars-2" aria-hidden="true" />
      <div className="stars stars-3" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">

        {/* Hero */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-5xl mb-2 select-none animate-float" aria-hidden="true">✦</div>
          <h1 className="font-display text-4xl sm:text-5xl font-normal tracking-wide text-white/90 leading-tight">
            Mi Alma
            <br />
            <span className="text-rose-200/80 italic">en el Universo</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base tracking-[0.2em] uppercase font-light">
            Un espacio para despertar y transformar
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-white/30 text-xs tracking-widest">☽ ✦ ☾</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Auth card */}
        <SignInCard />

        <p className="text-white/25 text-xs text-center tracking-wide">
          Un espacio seguro · Solo por invitación
        </p>
      </div>
    </div>
  )
}
