import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import api from '@/lib/api';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };

export default function Podcasts() {
  const [shows, setShows] = useState([]);

  useEffect(() => {
    api.get('/shows').then(r => setShows(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden" data-testid="podcasts-hero">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1660760509404-012ee8e96774?crop=entropy&cs=srgb&fm=jpg&q=85)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blues-bg/90 via-blues-bg/80 to-blues-bg" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
              Our <span className="text-amber italic">Podcasts.</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-2xl">
              Three shows, one mission — keeping the blues alive through storytelling, interviews, and history.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shows Grid */}
      <section className="py-24 md:py-32" data-testid="shows-grid">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="space-y-20">
            {shows.map((show, i) => (
              <motion.div
                key={show.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'md:grid-flow-dense' : ''}`}
              >
                <div className={i % 2 === 1 ? 'md:col-start-2' : ''}>
                  <Link to={`/podcasts/${show.slug}`} className="block group" data-testid={`podcast-show-image-${show.slug}`}>
                    <div className="relative overflow-hidden rounded-sm">
                      <img
                        src={show.cover_art_url}
                        alt={show.name}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                  </Link>
                </div>
                <div className={i % 2 === 1 ? 'md:col-start-1 md:row-start-1' : ''}>
                  <p className="text-amber text-sm uppercase tracking-widest mb-3 font-body">Show {i + 1}</p>
                  <h2 className="font-heading text-2xl md:text-3xl text-white mb-4">{show.name}</h2>
                  <p className="text-gray-400 text-base leading-relaxed mb-6">{show.description}</p>
                  <Link
                    to={`/podcasts/${show.slug}`}
                    className="inline-flex items-center gap-2 text-amber hover:text-amber-dark transition-colors text-sm uppercase tracking-widest font-body font-semibold"
                    data-testid={`podcast-show-link-${show.slug}`}
                  >
                    View Episodes <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to Listen CTA */}
      <section className="py-16 bg-blues-paper" data-testid="where-to-listen-cta">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-heading text-2xl md:text-3xl text-white mb-4">
              Listen <span className="text-amber italic">Anywhere.</span>
            </h2>
            <p className="text-gray-500 mb-6">Available on all major podcast platforms.</p>
            <Link
              to="/podcasts/where-to-listen"
              className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-none px-8 py-3 text-sm transition-colors"
              data-testid="where-to-listen-btn"
            >
              Where to Listen <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
