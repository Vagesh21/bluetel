import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PodcastPlayer from './PodcastPlayer';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Layout() {
  const { isVisible } = usePlayer();

  return (
    <div className="min-h-screen bg-blues-bg noise-overlay">
      <Navbar />
      <main className={`${isVisible ? 'pb-24' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <PodcastPlayer />
    </div>
  );
}
