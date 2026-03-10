import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };
const stagger = { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: '-50px' }, variants: { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } } };
const fadeChild = { variants: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } } };

export default function Home() {
  const [episodes, setEpisodes] = useState([]);
  const [events, setEvents] = useState([]);
  const [newsletter, setNewsletter] = useState({ first_name: '', last_name: '', email: '' });
  const { playEpisode } = usePlayer();

  useEffect(() => {
    api.get('/episodes?limit=6').then(r => setEpisodes(r.data.episodes || [])).catch(() => {});
    api.get('/events?upcoming=true').then(r => setEvents(Array.isArray(r.data) ? r.data.slice(0, 3) : [])).catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      await api.post('/newsletter/subscribe', newsletter);
      toast.success('Subscribed! Welcome to the Quarterly Catch-Up.');
      setNewsletter({ first_name: '', last_name: '', email: '' });
    } catch { toast.error('Could not subscribe. Try again.'); }
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1765741836925-5363bbaa6507?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-blues-bg" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <img
              src="https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png"
              alt="The Blues Hotel"
              className="h-20 md:h-28 w-auto mx-auto mb-8"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6 neon-amber"
          >
            Welcome to<br />
            <span className="text-amber italic">The Blues Hotel Collective</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            We celebrate the music, the makers, and the moments that shape the blues. Step inside for artist interviews, deep-cut histories, and soulful storytelling that keeps the tradition alive.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/podcasts">
              <Button data-testid="hero-start-listening" className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-none px-8 py-3 h-auto text-sm">
                Start Listening
              </Button>
            </Link>
            <Link to="/events">
              <Button data-testid="hero-explore-events" variant="outline" className="border-white/20 text-white hover:border-white/50 hover:bg-white/5 uppercase tracking-widest rounded-none px-8 py-3 h-auto text-sm">
                Explore Events
              </Button>
            </Link>
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber/60 text-sm italic font-heading"
        >
          "Listen. Learn. Feel the blues."
        </motion.p>
      </section>

      {/* ABOUT SNIPPET */}
      <section className="py-24 md:py-32" data-testid="about-snippet-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp} className="max-w-3xl">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">
              About the <span className="text-amber italic">Collective.</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              The Blues Hotel Collective is a storytelling-driven podcast network dedicated to preserving, celebrating, and reimagining the world of blues music. Built for listeners who crave depth, authenticity, and connection, our platform brings together creators, musicians, historians, and fans who believe the blues is more than a genre &mdash; it's a living archive of human experience.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 text-amber hover:text-amber-dark transition-colors text-sm uppercase tracking-widest font-body font-semibold" data-testid="about-read-more">
              Read Our Story <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LATEST EPISODES */}
      <section className="py-24 md:py-32 bg-blues-paper" data-testid="latest-episodes-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-2">
              Latest <span className="text-amber italic">Episodes.</span>
            </h2>
            <p className="text-gray-500 text-base">Fresh from the lobby.</p>
          </motion.div>
          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((ep) => (
              <motion.div key={ep.id} {...fadeChild} className="bg-blues-surface border border-white/5 hover:border-white/10 transition-all duration-300 group rounded-sm overflow-hidden" data-testid={`episode-card-${ep.id}`}>
                <div className="relative">
                  <img src={ep.cover_art_url || ep.show_cover_art_url} alt={ep.title} className="w-full h-48 object-cover group-hover:brightness-110 transition-all" />
                  <button
                    onClick={() => playEpisode(ep, episodes)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`play-episode-${ep.id}`}
                    aria-label={`Play ${ep.title}`}
                  >
                    <div className="w-14 h-14 flex items-center justify-center bg-amber text-black rounded-full">
                      <Play className="w-6 h-6 ml-1" />
                    </div>
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-amber text-xs uppercase tracking-widest mb-2 font-body">{ep.show_name}</p>
                  <h3 className="font-heading text-lg text-white mb-2 line-clamp-2 group-hover:text-amber transition-colors">{ep.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{ep.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600 font-mono">
                    <span>{ep.published_at ? new Date(ep.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    <span>{Math.floor((ep.duration_seconds || 0) / 60)} min</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
          {episodes.length > 0 && (
            <motion.div {...fadeUp} className="mt-10 text-center">
              <Link to="/podcasts" className="inline-flex items-center gap-2 text-amber hover:text-amber-dark transition-colors text-sm uppercase tracking-widest font-body font-semibold" data-testid="view-all-episodes">
                View All Shows <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* EVENTS TEASER */}
      <section className="py-24 md:py-32" data-testid="events-teaser-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-2">
              Upcoming <span className="text-amber italic">Events.</span>
            </h2>
          </motion.div>
          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <motion.div key={ev.id} {...fadeChild}>
                <Link to="/events" className="block bg-blues-surface border border-white/5 hover:border-amber/20 transition-all duration-300 rounded-sm overflow-hidden group" data-testid={`event-card-${ev.id}`}>
                  {ev.cover_image_url && (
                    <img src={ev.cover_image_url} alt={ev.title} className="w-full h-40 object-cover group-hover:brightness-110 transition-all" />
                  )}
                  <div className="p-5">
                    <h3 className="font-heading text-lg text-white mb-2 group-hover:text-amber transition-colors">{ev.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.date}</span>
                      {ev.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2">{ev.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
          {events.length === 0 && (
            <p className="text-gray-600 text-center">No upcoming events. Check back soon.</p>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section
        className="py-24 md:py-32 relative overflow-hidden"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1644171131222-78eccdafadd4?crop=entropy&cs=srgb&fm=jpg&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        data-testid="newsletter-section"
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
              Check In for the <span className="text-amber italic">Quarterly Catch-Up.</span>
            </h2>
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Every few months, we send a laid-back conversation from the lobby &mdash; artist spotlights, new music releases, behind-the-scenes stories, and upcoming events worth circling on your calendar. No spam, only the good stuff!
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                placeholder="First Name"
                value={newsletter.first_name}
                onChange={(e) => setNewsletter({ ...newsletter, first_name: e.target.value })}
                required
                className="bg-black/50 border-white/10 focus:border-amber/50 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="newsletter-first-name"
              />
              <Input
                placeholder="Last Name"
                value={newsletter.last_name}
                onChange={(e) => setNewsletter({ ...newsletter, last_name: e.target.value })}
                required
                className="bg-black/50 border-white/10 focus:border-amber/50 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="newsletter-last-name"
              />
              <Input
                type="email"
                placeholder="Email"
                value={newsletter.email}
                onChange={(e) => setNewsletter({ ...newsletter, email: e.target.value })}
                required
                className="bg-black/50 border-white/10 focus:border-amber/50 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="newsletter-email"
              />
              <Button type="submit" className="bg-amber text-black hover:brightness-110 font-bold uppercase tracking-widest rounded-none h-12 px-6 whitespace-nowrap" data-testid="newsletter-submit">
                Join
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
