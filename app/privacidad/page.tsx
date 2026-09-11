import Link from 'next/link';

export const metadata = {
  title: 'Aviso de privacidad · Stuffa Disco & Lounge',
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white/80"
          >
            ← Volver
          </Link>
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-emerald-400 sm:text-xs">
            Stuffa Disco &amp; Lounge
          </p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
            Aviso de privacidad
          </h1>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-white/70">
          <p>
            En <strong className="text-white">Stuffa Disco &amp; Lounge</strong>{' '}
            recopilamos únicamente los datos necesarios para gestionar tu
            reserva: nombre, teléfono y notas opcionales.
          </p>

          <h2 className="text-base font-bold text-white">Uso de los datos</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Confirmar tu reserva y enviarte el código QR de acceso.</li>
            <li>Contactarte en caso de cambio o cancelación.</li>
            <li>Recordatorios de tu reserva (24h antes).</li>
          </ul>

          <h2 className="text-base font-bold text-white">Conservación</h2>
          <p>
            Guardamos tus datos por un máximo de 6 meses tras la fecha de la
            reserva. Después se anonimizan automáticamente.
          </p>

          <h2 className="text-base font-bold text-white">Tus derechos</h2>
          <p>
            Puedes solicitar la eliminación de tus datos escribiendo a{' '}
            <span className="text-emerald-400">hola@stuffa.com</span>. También
            puedes cancelar tu reserva directamente desde el código QR que
            recibes.
          </p>

          <h2 className="text-base font-bold text-white">Cookies</h2>
          <p>
            Usamos cookies técnicas esenciales para mantener la sesión del
            personal y el funcionamiento del sitio. No usamos cookies de
            publicidad.
          </p>
        </section>

        <p className="border-t border-white/10 pt-6 text-xs text-white/40">
          Última actualización: {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}