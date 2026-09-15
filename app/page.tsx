import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/layout/SiteHeader';
import Hero from '@/components/landing/Hero';
import EventsSection from '@/components/landing/EventsSection';
import ExperienceSection from '@/components/landing/ExperienceSection';
import ContactSection from '@/components/landing/ContactSection';
import type { EventSummary } from '@/lib/types';
import Footer from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const { data } = await supabase
    .rpc('get_upcoming_events', { p_limit: 6 })
    .returns<EventSummary[]>();

  const events: EventSummary[] = Array.isArray(data) ? data : [];

  return (
    <>
      <SiteHeader />

        <main className="relative bg-black">
        <Hero />
        <EventsSection events={events} />
        <ExperienceSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
}