import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, LogOut, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/contexts/PlayerContext';
import api from '@/lib/api';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playEpisode } = usePlayer();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { navigate('/login'); return; }
    api.get('/users/me').then(r => { setProfile(r.data); setLoading(false); })
      .catch(() => { navigate('/login'); });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('blues_user');
    navigate('/');
  };

  if (loading) return <div className="pt-32 text-center text-gray-500 min-h-screen">Loading...</div>;
  if (!profile) return null;

  return (
    <div className="pt-16 min-h-screen" data-testid="user-profile-page">
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="font-heading text-3xl md:text-4xl text-white mb-1">{profile.name}</h1>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                <p className="text-gray-700 text-xs font-mono mt-1">Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : ''}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="border-white/10 text-gray-400 hover:text-white rounded-none text-xs h-9 uppercase tracking-widest" data-testid="user-logout">
                <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
              </Button>
            </div>

            {/* Liked Episodes */}
            <div className="mb-12">
              <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" /> Liked Episodes ({profile.liked_episodes?.length || 0})
              </h2>
              {profile.liked_episodes && profile.liked_episodes.length > 0 ? (
                <div className="space-y-2">
                  {profile.liked_episodes.map((ep) => (
                    <div key={ep.id} className="flex items-center gap-4 p-3 bg-blues-surface border border-white/5 rounded-sm group hover:border-white/10 transition-all" data-testid={`liked-ep-${ep.id}`}>
                      <button
                        onClick={() => (ep.audio_url || ep.external_audio_url) && playEpisode(ep)}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-amber group-hover:text-black transition-all"
                        aria-label={`Play ${ep.title}`}
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                      <img src={ep.cover_art_url || ep.show_cover_art_url} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0 hidden sm:block" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{ep.title}</p>
                        <p className="text-xs text-gray-500">{ep.show_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No liked episodes yet. <Link to="/podcasts" className="text-amber hover:underline">Browse shows</Link></p>
              )}
            </div>

            {/* Recent Comments */}
            <div>
              <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Your Comments ({profile.comments?.length || 0})
              </h2>
              {profile.comments && profile.comments.length > 0 ? (
                <div className="space-y-3">
                  {profile.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-blues-surface border border-white/5 rounded-sm" data-testid={`user-comment-${c.id}`}>
                      <p className="text-sm text-gray-300">{c.text}</p>
                      <p className="text-xs text-gray-600 mt-1 font-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No comments yet. <Link to="/podcasts" className="text-amber hover:underline">Start a conversation</Link></p>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
