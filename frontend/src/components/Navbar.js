import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PushNotificationOptIn } from './PushNotification';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  {
    label: 'Podcasts', path: '/podcasts',
    children: [
      { label: 'All Shows', path: '/podcasts' },
      { label: 'Where to Listen', path: '/podcasts/where-to-listen' },
      { label: 'The Blues Hotel', path: '/podcasts/the-blues-hotel' },
      { label: "Just Talkin' Blues", path: '/podcasts/just-talkin-blues' },
      { label: 'Blues Moments in Time', path: '/podcasts/blues-moments-in-time' },
    ],
  },
  { label: 'Events', path: '/events' },
  {
    label: 'Community', path: '/community/submit-music',
    children: [
      { label: 'Submit Music', path: '/community/submit-music' },
      { label: 'Share a Story', path: '/community/share-a-story' },
    ],
  },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('blues_user');
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [location]);

  return (
    <nav
      data-testid="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
          <img
            src="https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png"
            alt="The Blues Hotel"
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className="relative group"
              onMouseEnter={() => link.children && setOpenDropdown(link.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to={link.path}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`font-body text-sm uppercase tracking-widest transition-colors duration-300 flex items-center gap-1 ${
                  location.pathname === link.path ? 'text-amber' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
                {link.children && <ChevronDown className="w-3 h-3" />}
              </Link>
              {link.children && openDropdown === link.label && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 mt-2 w-56 glass rounded-sm py-2 shadow-2xl"
                >
                  {link.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      data-testid={`nav-dropdown-${child.label.toLowerCase().replace(/['\s]+/g, '-')}`}
                      className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
          {/* User + Push */}
          <div className="flex items-center gap-3 ml-2">
            <PushNotificationOptIn />
            {user ? (
              <Link to="/profile" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors" data-testid="nav-user-profile">
                <User className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">{user.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-xs uppercase tracking-widest font-body" data-testid="nav-login">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          data-testid="mobile-menu-toggle"
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/5 overflow-hidden"
            data-testid="mobile-menu"
          >
            <div className="px-6 py-6 space-y-4">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <Link
                    to={link.path}
                    className="block text-lg font-heading text-gray-300 hover:text-amber transition-colors py-1"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="pl-4 mt-1 space-y-1">
                      {link.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block text-sm text-gray-500 hover:text-white transition-colors py-1"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
