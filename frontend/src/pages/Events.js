import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events').then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const handleBuyTicket = async (ev) => {
    if (ev.ticket_url) {
      window.open(ev.ticket_url, '_blank');
      return;
    }
    if (ev.ticket_price && ev.ticket_price > 0) {
      try {
        const origin = window.location.origin;
        const res = await api.post('/payments/checkout', { event_id: ev.id, origin_url: origin });
        if (res.data.url) window.location.href = res.data.url;
      } catch (err) {
        console.error('Checkout error:', err);
      }
    }
  };

  const upcoming = events.filter(e => new Date(e.date) >= new Date());
  const past = events.filter(e => new Date(e.date) < new Date());

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden" data-testid="events-hero">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1765224747205-3c9c23f0553c?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blues-bg/90 via-blues-bg/80 to-blues-bg" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
              <span className="text-amber italic">Events.</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl">
              Live blues, conversations, and community gatherings.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="py-16 md:py-24" data-testid="upcoming-events">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="font-heading text-2xl md:text-3xl text-white mb-8">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-600">No upcoming events. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-blues-surface border border-white/5 rounded-sm overflow-hidden group hover:border-amber/20 transition-all"
                  data-testid={`event-${ev.id}`}
                >
                  {ev.cover_image_url && (
                    <img src={ev.cover_image_url} alt={ev.title} className="w-full h-48 object-cover group-hover:brightness-110 transition-all" />
                  )}
                  <div className="p-6">
                    <h3 className="font-heading text-xl text-white mb-3 group-hover:text-amber transition-colors">{ev.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1 font-mono"><Calendar className="w-3.5 h-3.5" />{ev.date}</span>
                      {ev.time && <span className="flex items-center gap-1 font-mono"><Clock className="w-3.5 h-3.5" />{ev.time}</span>}
                      {ev.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ev.venue}, {ev.city}</span>}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{ev.description}</p>
                    {(ev.ticket_url || (ev.ticket_price && ev.ticket_price > 0)) && (
                      <Button
                        onClick={() => handleBuyTicket(ev)}
                        className="bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none text-xs h-10"
                        data-testid={`buy-ticket-${ev.id}`}
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        {ev.ticket_price ? `Get Tickets — $${ev.ticket_price.toFixed(2)}` : 'Get Tickets'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="py-16 md:py-24 bg-blues-paper" data-testid="past-events">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <h2 className="font-heading text-2xl md:text-3xl text-white mb-8">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {past.map((ev) => (
                <div key={ev.id} className="bg-blues-surface border border-white/5 rounded-sm p-5 opacity-70">
                  <h3 className="font-heading text-lg text-white mb-2">{ev.title}</h3>
                  <p className="text-gray-600 text-xs font-mono mb-2">{ev.date}</p>
                  <p className="text-gray-500 text-sm">{ev.venue}, {ev.city}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
