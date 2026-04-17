export default function VerifyEmail() {
  return (
    <div className="min-h-screen galaxy-bg relative overflow-hidden flex items-center justify-center px-4">
      <div className="blob blob-purple" />
      <div className="blob blob-rose" />
      <div className="stars" aria-hidden="true" />

      <div className="relative z-10 glass-card max-w-sm w-full rounded-2xl px-8 py-10 text-center flex flex-col gap-5">
        <div className="text-5xl animate-float">✉️</div>
        <h1 className="font-display text-white/90 text-xl font-normal tracking-wide">
          Revisa tu correo
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Te hemos enviado un enlace mágico. Haz clic en él para entrar
          a tu espacio en el universo.
        </p>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="text-white/30 text-xs">
          ¿No lo ves? Revisa tu carpeta de spam ✦
        </p>
        <a
          href="/"
          className="mt-2 text-rose-200/50 text-xs hover:text-rose-200/80 transition-colors"
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  )
}
