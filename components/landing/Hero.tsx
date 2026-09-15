export default function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-black pt-48 pb-8 sm:min-h-[100svh] sm:pb-0 sm:pt-20">
      {/* Fondo con video */}
      <div className="absolute inset-0 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/videos/hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src="/videos/hero.webm" type="video/webm" />
        </video>

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Gradiente rojo radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.35),_transparent_60%)]" />

        {/* Gradiente oscuro abajo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

        {/* Patrón de puntos */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(220,38,38,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center sm:px-6">
        <div className="mx-auto mb-6 flex w-fit max-w-[90vw] items-center gap-2 rounded-full border border-red-500/30 bg-black/60 px-3 py-1.5 backdrop-blur sm:px-4">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
          <span className="truncate text-[10px] font-bold uppercase tracking-wider text-red-300 sm:text-xs sm:tracking-widest">
            Maracaibo
          </span>
        </div>

        <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
          VIVE LA NOCHE
          <br />
          <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-800 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(220,38,38,0.5)]">
            STUFFA
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-white/80 sm:mt-8 sm:text-base md:text-lg">
          Música, luces y energía en el corazón de Maracaibo. Los viernes y
          sábados más esperados del fin de semana.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <a
            href="#eventos"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-2xl shadow-red-900/60 transition hover:from-red-600 hover:to-red-500 sm:w-auto"
          >
            Comprar entradas
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <a
            href="#experiencia"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-black/50 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white/90 backdrop-blur transition hover:border-white/40 hover:bg-black/70 hover:text-white sm:w-auto"
          >
            Conoce más
          </a>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:mt-16">
          <div>
            <p className="text-2xl font-black text-white drop-shadow sm:text-3xl">500</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-xs">Capacidad</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white drop-shadow sm:text-3xl">2</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-xs">Noches / Semana</p>
          </div>
          <div>
            <p className="text-2xl font-black text-white drop-shadow sm:text-3xl">100%</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/50 sm:text-xs">Rumba</p>
          </div>
        </div>
      </div>
    </section>
  );
}