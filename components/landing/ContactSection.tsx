export default function ContactSection() {
  return (
    <section
      id="contacto"
      className="relative border-t border-red-950/60 bg-black py-12 sm:py-16"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500 sm:text-xs">
          Contacto
        </p>

        <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
          CONTACTO
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60 sm:mt-6 sm:text-base">
          ¿Tienes dudas sobre un evento o quieres reservar una zona privada?
          Escríbenos.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="https://instagram.com/stuffalounge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-2xl shadow-red-900/40 transition hover:from-red-600 hover:to-red-500 sm:w-auto"
          >
            <span className="text-base"></span>
            Instagram
          </a>

          <a
            href="https://wa.me/584146662623"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-950/60 bg-black/40 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white/80 backdrop-blur transition hover:border-red-800 hover:text-white sm:w-auto"
          >
            <span className="text-base"></span>
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}