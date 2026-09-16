import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-red-950/60 bg-black/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + Tagline */}
          <div className="sm:col-span-2 lg:col-span-1">
<div
  className="stuffa-protected relative h-12 w-40"
  style={{ colorScheme: 'only light', isolation: 'isolate' }}
>
  <Image
    src="/stuffa-logo.png"
    alt="Stuffa Disco & Lounge"
    fill
    sizes="160px"
    className="object-contain object-left"
  />
</div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/50">
              Somos los dueños de la rumba los fines de semana. Reserva tu mesa
              y vive la experiencia Stuffa.
            </p>
          </div>

          {/* Horario */}
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
              Horario
            </h3>
            <ul className="space-y-1.5 text-xs text-white/70 sm:text-sm">
              <li className="flex items-center gap-2">
                <span>Viernes y Sábados</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base"></span>
                <span>10:00 PM – 4:00 AM</span>
              </li>
              <li className="mt-2 text-[11px] text-red-400">
                + Eventos especiales
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
              Contacto
            </h3>
            <ul className="space-y-2 text-xs text-white/70 sm:text-sm">
              <li>
                <a
                  href="https://wa.me/584120000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <span className="text-base"></span>
                  <span>WhatsApp</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/stuffalounge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <span className="text-base"></span>
                  <span>@stuffalounge</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition hover:text-white"
                >
                  <span className="text-base">📍</span>
                  <span>Cómo llegar</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
              Info
            </h3>
            <ul className="space-y-2 text-xs text-white/70 sm:text-sm">
              <li>
                <Link
                  href="/privacidad"
                  className="transition hover:text-white"
                >
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="transition hover:text-white"
                >
                  Acceso staff
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-red-950/60 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[11px] text-white/40">
            © {new Date().getFullYear()} Stuffa Disco &amp; Lounge. Todos los
            derechos reservados.
          </p>
          <p className="text-[11px] text-white/30">
            Hecho con 🍾 en Venezuela
          </p>
        </div>
      </div>
    </footer>
  );
}