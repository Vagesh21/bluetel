import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer data-testid="main-footer" className="bg-blues-bg border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <img
              src="https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png"
              alt="The Blues Hotel"
              className="h-12 w-auto mb-4"
            />
            <p className="text-gray-500 text-sm leading-relaxed">
              Your home for everything blues. Celebrating the music, the makers, and the moments.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-amber font-heading text-sm uppercase tracking-widest mb-4">Explore</h4>
            <div className="space-y-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'About', path: '/about' },
                { label: 'Podcasts', path: '/podcasts' },
                { label: 'Events', path: '/events' },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-gray-500 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-amber font-heading text-sm uppercase tracking-widest mb-4">Community</h4>
            <div className="space-y-2">
              {[
                { label: 'Submit Music', path: '/community/submit-music' },
                { label: 'Share a Story', path: '/community/share-a-story' },
                { label: 'Contact Us', path: '/contact' },
                { label: 'Where to Listen', path: '/podcasts/where-to-listen' },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-gray-500 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-amber font-heading text-sm uppercase tracking-widest mb-4">Connect</h4>
            <div className="flex gap-4 mb-4">
              {[
                { icon: Facebook, url: 'https://facebook.com/theblueshotel/', label: 'Facebook' },
                { icon: Instagram, url: 'https://instagram.com/theblueshotel/', label: 'Instagram' },
                { icon: Youtube, url: 'https://youtube.com/@theblueshotel', label: 'YouTube' },
                { icon: Linkedin, url: 'https://www.linkedin.com/in/the-blues-hotel-collective', label: 'LinkedIn' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  data-testid={`footer-social-${social.label.toLowerCase()}`}
                  className="w-10 h-10 flex items-center justify-center border border-white/10 text-gray-500 hover:text-amber hover:border-amber/30 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-600">admin@theblueshotel.com.au</p>
            <p className="text-sm text-gray-600">0482 170 801</p>
            <p className="text-sm text-gray-600 mt-1">Surry Hills, NSW, Australia</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} The Blues Hotel Collective. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-use" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
