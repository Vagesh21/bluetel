import React from 'react';
import { motion } from 'framer-motion';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const PLATFORMS = [
  { name: 'Apple Podcasts', url: 'https://podcasts.apple.com/au/podcast/the-blues-hotel/id1741207812', icon: 'https://player.captivate.fm/images/apple-podcasts.svg' },
  { name: 'Spotify', url: 'https://open.spotify.com/show/6UYPEsFG0nJpMd2H4rQCZP', icon: 'https://player.captivate.fm/images/spotify.svg' },
  { name: 'Amazon Music', url: 'https://music.amazon.com/podcasts/73168581-7fc3-4467-9476-a54991c8bba6/the-blues-hotel', icon: 'https://player.captivate.fm/images/amazon_music.svg' },
  { name: 'Overcast', url: 'https://overcast.fm/itunes1741207812', icon: 'https://player.captivate.fm/images/overcast.svg' },
  { name: 'Pocket Casts', url: 'https://pca.st/slms3ko6', icon: 'https://player.captivate.fm/images/pocketcasts.svg' },
  { name: 'Castro', url: 'https://castro.fm/itunes/1741207812', icon: 'https://player.captivate.fm/images/castro.svg' },
  { name: 'Goodpods', url: 'https://www.goodpods.com/podcasts-aid/1741207812', icon: 'https://player.captivate.fm/images/goodpods.svg' },
  { name: 'iHeart Radio', url: 'https://www.iheart.com/podcast/1333-the-blues-hotel-183385486/', icon: 'https://player.captivate.fm/images/custom.svg' },
  { name: 'RSS Feed (TBH)', url: 'https://feeds.captivate.fm/the-blues-hotel', icon: null },
  { name: 'RSS Feed (JTB)', url: 'https://feeds.captivate.fm/just-talkin-blues', icon: null },
];

export default function WhereToListen() {
  return (
    <div className="pt-16">
      <section className="py-24 md:py-32" data-testid="where-to-listen-page">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <h1 className="font-heading text-4xl sm:text-5xl text-white mb-4">
              Where to <span className="text-amber italic">Listen.</span>
            </h1>
            <p className="text-gray-400 text-base mb-12 max-w-xl leading-relaxed">
              Our podcasts are available on all major platforms. Choose your favourite and start listening.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PLATFORMS.map((p, i) => (
              <motion.a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-blues-surface border border-white/5 hover:border-amber/20 hover:bg-white/5 transition-all duration-300 rounded-sm group"
                data-testid={`platform-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {p.icon ? (
                  <img src={p.icon} alt={p.name} className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center text-amber text-lg font-heading">RSS</div>
                )}
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors text-center">{p.name}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
