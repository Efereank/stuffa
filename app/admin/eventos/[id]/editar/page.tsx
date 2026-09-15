import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '@/components/admin/AdminHeader';
import EventForm, { type EventFormData } from '@/components/admin/EventForm';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isStaff } = await supabase.rpc('is_staff').returns<boolean>();
  if (!isStaff) redirect('/admin');

  // Evento
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) notFound();

  // Ticket types (tomamos el primero)
  const { data: tickets } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', id)
    .order('sort_order')
    .limit(1);

  const ticket = tickets?.[0];

  const initialData: EventFormData = {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description ?? '',
    cover_url: event.cover_url,
    event_date: event.event_date,
    event_time: event.event_time,
    doors_open_at: event.doors_open_at ?? '',
    venue: event.venue,
    city: event.city,
    is_active: event.is_active,
    is_featured: event.is_featured,
    is_sold_out: event.is_sold_out,
    ticket_name: ticket?.name ?? 'GENERAL',
    ticket_description: ticket?.description ?? '',
    ticket_price_usd: Number(ticket?.price_usd ?? 3),
    ticket_capacity: ticket?.capacity ?? 100,
    ticket_benefits: ticket?.benefits ?? [],
    ticket_id: ticket?.id,
    ticket_sold: ticket?.sold ?? 0,
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/admin/eventos/${id}`}
          className="mb-4 inline-block text-xs text-white/50 transition hover:text-white"
        >
          ← Volver al evento
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Editar evento
          </h1>
          <p className="mt-1 text-sm text-white/50">{event.name}</p>
        </div>

        <EventForm mode="edit" initialData={initialData} />
      </main>
    </div>
  );
}