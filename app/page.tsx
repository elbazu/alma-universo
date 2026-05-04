'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SignInCard from '@/components/auth/SignInCard'
import MetatronCube from '@/components/landing/MetatronCube'

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/community')
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #FDF0D0, #EDD49A, #E0BC6E)' }}>
        <div className="w-8 h-8 border-2 border-amber-600/40 border-t-amber-700 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(145deg, #FDF0D0, #EDD49A, #E0BC6E)' }}>

      {/* Soft light overlays */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="pointer-events-none absolute bottom-[-5%] right-[-5%] w-[50vw] h-[50vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(196,88,122,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">

        {/* Sacred geometry */}
        <div className="block sm:hidden">
          <MetatronCube size={160} />
        </div>
        <div className="hidden sm:block">
          <MetatronCube size={260} />
        </div>

        {/* Auth card */}
        <SignInCard />

        <p className="text-amber-800/40 text-xs text-center tracking-wide">
          Un espacio seguro · Solo por invitación
        </p>
      </div>
    </div>
  )
}
