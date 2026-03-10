import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };

const TIMELINE = [
  { title: 'Where It All Began', text: 'Raised on the raw soul, grit, and truth of classic 50s and 60s blues. The music wasn\'t background noise — it was the foundation. From Muddy Waters to Howlin\' Wolf, the sounds of the Delta and Chicago became a language unto themselves.' },
  { title: 'Learning the Craft', text: 'Trained at the Melbourne Radio School under Gary Mac in radio broadcasting. This was where the technical skills met the passion — learning to shape stories through audio, understanding pacing, tone, and how to hold a listener\'s attention.' },
  { title: 'From Audio Editor to Host', text: 'Joined MITE Radio in Perth, WA as an audio editor, then became host of The Blues Hotel on Sunday 7:00 PM. The shift from behind the desk to behind the mic was natural — the stories needed a voice, and the blues needed a home.' },
  { title: 'Just Talkin\' Blues', text: 'Created Just Talkin\' Blues for unedited, full-length artist conversations — raw, real, unscripted. No soundbites. No corporate polish. Just two people and a shared love of the blues.' },
  { title: 'Blues Moments in Time', text: 'Created Blues Moments in Time as a daily history podcast — one moment, one story, one day at a time. Because every day in blues history matters, and the stories behind the dates are as powerful as the music itself.' },
];

const SHOWS = [
  { name: 'The Blues Hotel', slug: 'the-blues-hotel', description: 'The music, the legends, the stories behind the songs — and the fresh independent blues.', cover: 'https://artwork.captivate.fm/54cfbaea-c458-423b-b446-bc25cc63985a/TBHC-TBH-POCAST.png' },
  { name: "Just Talkin' Blues", slug: 'just-talkin-blues', description: 'Conversations with the artists — unfiltered, unscripted, and real.', cover: 'https://artwork.captivate.fm/c808ca2b-b9d1-4e69-85cf-33a0591eca37/TBHC-JTB-PODCAST.jpg' },
  { name: 'Blues Moments in Time', slug: 'blues-moments-in-time', description: 'The history — one moment at a time. A daily podcast exploring blues birthdays, anniversaries, and historic performances.', cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&h=400&fit=crop' },
];

export default function About() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden" data-testid="about-hero">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/9419393/pexels-photo-9419393.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blues-bg/90 via-blues-bg/80 to-blues-bg" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
              About the <span className="text-amber italic">Collective.</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-3xl">
              The Blues Hotel Collective is a storytelling-driven podcast network dedicated to preserving, celebrating, and reimagining the world of blues music. Built for listeners who crave depth, authenticity, and connection, our platform brings together creators, musicians, historians, and fans who believe the blues is more than a genre — it's a living archive of human experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Extended About */}
      <section className="py-16 md:py-24" data-testid="about-story">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Through a growing lineup of original blues podcasts, we explore the roots of the music, the legends who shaped it, and the modern voices carrying the tradition forward. Our episodes blend artist interviews, cultural history, behind-the-scenes stories, and immersive audio experiences that highlight the soul, struggle, and spirit behind the sound.
            </p>
            <p className="text-gray-400 text-base leading-relaxed">
              We're committed to building a community where blues fans, creators, and storytellers can come together. Every show is crafted with care, honoring the past while spotlighting the artists and narratives shaping the future of blues culture. From deep-dive conversations to curated features and creative audio segments, we aim to keep the blues alive, accessible, and evolving for generations to come.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Bio */}
      <section className="py-24 md:py-32 bg-blues-paper" data-testid="founder-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img
                src="https://theblueshotel.com.au/wp-content/uploads/2025/12/JSW0507.jpg"
                alt="Kelvin Huggins - Founder & Creative Director"
                className="w-full max-w-md rounded-sm shadow-2xl"
                data-testid="founder-image"
              />
            </motion.div>
            <motion.div {...fadeUp}>
              <p className="text-amber text-sm uppercase tracking-widest mb-2 font-body">Founder & Creative Director</p>
              <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">
                Kelvin <span className="text-amber italic">Huggins</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                Raised on the raw soul, grit, and truth of classic 50s and 60s blues. Trained at the Melbourne Radio School under Gary Mac in radio broadcasting. What started as a deep personal connection to the music became a mission to preserve and share its stories with the world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 md:py-32 relative" data-testid="timeline-section">
        <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
          <motion.div {...fadeUp} className="mb-16 text-center">
            <h2 className="font-heading text-3xl md:text-4xl text-white">
              The <span className="text-amber italic">Journey.</span>
            </h2>
          </motion.div>
          <div className="relative">
            <div className="timeline-line" />
            <div className="space-y-16">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`relative flex ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-start gap-8`}
                  data-testid={`timeline-item-${i}`}
                >
                  <div className="hidden md:block w-1/2" />
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber border-4 border-blues-bg z-10 hidden md:block" />
                  <div className="md:w-1/2 pl-12 md:pl-0">
                    <div className="bg-blues-surface border border-white/5 p-6 rounded-sm">
                      <h3 className="font-heading text-lg text-amber mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Three Shows */}
      <section className="py-24 md:py-32 bg-blues-paper" data-testid="shows-overview">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-2">
              Our <span className="text-amber italic">Shows.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SHOWS.map((show) => (
              <motion.div
                key={show.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Link
                  to={`/podcasts/${show.slug}`}
                  className="block bg-blues-surface border border-white/5 hover:border-amber/20 transition-all duration-300 rounded-sm overflow-hidden group"
                  data-testid={`show-card-${show.slug}`}
                >
                  <img src={show.cover} alt={show.name} className="w-full aspect-square object-cover group-hover:brightness-110 transition-all" />
                  <div className="p-5">
                    <h3 className="font-heading text-lg text-white mb-2 group-hover:text-amber transition-colors">{show.name}</h3>
                    <p className="text-gray-500 text-sm">{show.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
