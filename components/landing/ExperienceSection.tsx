const ITEMS = [
  {
    title: 'DJ Elites',
    text: 'Los mejores DJs de Maracaibo creando una atmósfera inigualable con mezclas únicas de diversos géneros.',
    icon: '🎧',
  },
  {
    title: 'Iluminación Inmersiva',
    text: 'Espectáculo de luces de última generación sincronizado con la música para una experiencia visual impactante.',
    icon: '💡',
  },
  {
    title: 'Sonido Profesional',
    text: 'Sistema de audio de alta fidelidad que hará vibrar cada rincón del espacio con calidad de estudio.',
    icon: '🔊',
  },
];

export default function ExperienceSection() {
  return (
    <section
      id="experiencia"
      className="relative border-t border-red-950/60 bg-black py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500 sm:text-xs">
            Experiencia
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            LA EXPERIENCIA
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 sm:mt-6 sm:text-base">
            Producción + música + atmósfera. Todo en un solo sistema.
          </p>
        </div>

        {/* 🎬 Video en loop */}
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-red-950/60 bg-black shadow-2xl shadow-red-950/30 sm:mt-14">
          {/* Aspect ratio 16:9 */}
          <div className="relative aspect-video w-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/videos/experience-poster.jpg"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/videos/experience.webm" type="video/webm" />
            </video>

            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Gradiente arriba y abajo para integrarlo con el diseño */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Badge "EN VIVO" (opcional, solo visual) */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-red-500/40 bg-black/70 px-3 py-1.5 backdrop-blur sm:left-6 sm:top-6">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
                Maracaibo 
              </span>
            </div>

            {/* Texto abajo (opcional) */}
            <div className="absolute inset-x-0 bottom-0 p-5 text-center sm:p-8">
              <p className="text-xl font-black leading-tight text-white drop-shadow-2xl sm:text-3xl md:text-4xl">
                Vive la experiencia{' '}
                <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                  Stuffa
                </span>
              </p>
              <p className="mt-2 text-xs text-white/70 sm:text-sm">
                Viernes y sábados · 10PM — 5AM
              </p>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}