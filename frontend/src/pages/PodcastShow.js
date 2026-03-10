import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Search, Clock, Heart, MessageCircle, Send } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ShareButtons from '@/components/ShareButtons';

const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

function EpisodeEngagement({ episodeId }) {
  const [engagement, setEngagement] = useState({ likes_count: 0, user_liked: false, comments: [], comments_count: 0 });
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState({ name: '', email: '', text: '' });
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('blues_user_email') || '');

  const fetchEngagement = useCallback(() => {
    api.get(`/episodes/${episodeId}/engagement?email=${encodeURIComponent(userEmail)}`).then(r => setEngagement(r.data)).catch(() => {});
  }, [episodeId, userEmail]);

  useEffect(() => { fetchEngagement(); }, [fetchEngagement]);

  const toggleLike = async () => {
    if (!userEmail) { toast.error('Enter your email to like episodes'); setShowComments(true); return; }
    try {
      if (engagement.user_liked) {
        await api.delete(`/episodes/${episodeId}/like?email=${encodeURIComponent(userEmail)}`);
      } else {
        await api.post(`/episodes/${episodeId}/like`, { email: userEmail });
      }
      fetchEngagement();
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.name || !comment.email || !comment.text) { toast.error('Fill all fields'); return; }
    try {
      await api.post(`/episodes/${episodeId}/comments`, comment);
      toast.success('Comment posted');
      localStorage.setItem('blues_user_email', comment.email);
      setUserEmail(comment.email);
      setComment({ ...comment, text: '' });
      fetchEngagement();
    } catch { toast.error('Failed to post comment'); }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-4">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-xs transition-colors ${engagement.user_liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`} data-testid={`like-btn-${episodeId}`} aria-label="Like">
          <Heart className={`w-3.5 h-3.5 ${engagement.user_liked ? 'fill-current' : ''}`} /> {engagement.likes_count}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors" data-testid={`comments-toggle-${episodeId}`}>
          <MessageCircle className="w-3.5 h-3.5" /> {engagement.comments_count}
        </button>
        <ShareButtons title={`Listen to this episode`} className="ml-auto" />
      </div>

      {showComments && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 border-t border-white/5 pt-4">
          {/* Comment form */}
          <form onSubmit={handleComment} className="mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input value={comment.name} onChange={(e) => setComment({ ...comment, name: e.target.value })} placeholder="Name" required
                className="bg-blues-bg border-white/10 text-white rounded-none h-8 text-xs" data-testid={`comment-name-${episodeId}`} />
              <Input value={comment.email} onChange={(e) => { setComment({ ...comment, email: e.target.value }); setUserEmail(e.target.value); }} placeholder="Email" type="email" required
                className="bg-blues-bg border-white/10 text-white rounded-none h-8 text-xs" data-testid={`comment-email-${episodeId}`} />
            </div>
            <div className="flex gap-2">
              <Textarea value={comment.text} onChange={(e) => setComment({ ...comment, text: e.target.value })} placeholder="Write a comment..." required rows={2}
                className="bg-blues-bg border-white/10 text-white rounded-none text-xs resize-none flex-1" data-testid={`comment-text-${episodeId}`} />
              <Button type="submit" className="bg-amber text-black hover:brightness-110 rounded-none h-auto px-3 self-end" data-testid={`comment-submit-${episodeId}`}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {engagement.comments.map((c) => (
              <div key={c.id} className="text-xs" data-testid={`comment-${c.id}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-amber font-semibold">{c.name}</span>
                  <span className="text-gray-700 font-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-gray-400">{c.text}</p>
              </div>
            ))}
            {engagement.comments.length === 0 && <p className="text-gray-600 text-xs">No comments yet. Be the first!</p>}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function PodcastShow() {
  const { slug } = useParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [search, setSearch] = useState('');
  const { playEpisode, episode: currentEp, isPlaying } = usePlayer();

  useEffect(() => {
    api.get(`/shows/${slug}`).then(r => setShow(r.data)).catch(() => {});
    api.get(`/episodes?show_slug=${slug}&limit=100`).then(r => setEpisodes(r.data.episodes || [])).catch(() => {});
  }, [slug]);

  const filtered = episodes.filter(ep =>
    ep.title.toLowerCase().includes(search.toLowerCase()) ||
    ep.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (!show) return <div className="pt-32 text-center text-gray-500">Loading...</div>;

  return (
    <div className="pt-16">
      {/* Show Header */}
      <section className="py-16 md:py-24 bg-blues-paper" data-testid="show-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <img src={show.cover_art_url} alt={show.name} className="w-full aspect-square object-cover rounded-sm shadow-2xl" data-testid="show-cover" />
            </motion.div>
            <motion.div {...fadeUp} className="pt-4">
              <p className="text-amber text-sm uppercase tracking-widest mb-2 font-body">Podcast Show</p>
              <h1 className="font-heading text-3xl md:text-4xl text-white mb-4" data-testid="show-title">{show.name}</h1>
              <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-2xl">{show.description}</p>
              <p className="text-gray-600 text-sm font-mono">{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Episode List */}
      <section className="py-16 md:py-24" data-testid="episode-list-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Search */}
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <Input
                placeholder="Search episodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12 pl-10"
                data-testid="episode-search"
              />
            </div>
          </div>

          {/* Episodes */}
          <div className="space-y-3">
            {filtered.map((ep, i) => {
              const isCurrentPlaying = currentEp?.id === ep.id && isPlaying;
              const audioAvailable = ep.audio_url || ep.external_audio_url;
              return (
                <div key={ep.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                  className={`flex items-center gap-4 p-4 rounded-sm transition-all duration-200 group ${
                    isCurrentPlaying ? 'bg-amber/10 border border-amber/20' : 'bg-blues-surface border border-white/5 hover:border-white/10'
                  }`}
                  data-testid={`episode-item-${ep.id}`}
                >
                  {/* Play button */}
                  <button
                    onClick={() => audioAvailable && playEpisode(ep, filtered)}
                    disabled={!audioAvailable}
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                      isCurrentPlaying ? 'bg-amber text-black' : audioAvailable ? 'bg-white/10 text-white group-hover:bg-amber group-hover:text-black' : 'bg-white/5 text-gray-700 cursor-not-allowed'
                    }`}
                    data-testid={`play-btn-${ep.id}`}
                    aria-label={`Play ${ep.title}`}
                  >
                    <Play className={`w-4 h-4 ${isCurrentPlaying ? '' : 'ml-0.5'}`} />
                  </button>

                  {/* Cover art (small) */}
                  <img
                    src={ep.cover_art_url || ep.show_cover_art_url}
                    alt=""
                    className="w-10 h-10 object-cover rounded-sm flex-shrink-0 hidden sm:block"
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-body font-semibold truncate ${isCurrentPlaying ? 'text-amber' : 'text-white'}`}>{ep.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{ep.description}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-600 font-mono flex-shrink-0">
                    <span>{ep.published_at ? new Date(ep.published_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor((ep.duration_seconds || 0) / 60)}m</span>
                  </div>
                </motion.div>
                {/* Engagement section below the episode row */}
                <div className="px-4 pb-3 -mt-1 bg-blues-surface border border-t-0 border-white/5 rounded-b-sm">
                  <EpisodeEngagement episodeId={ep.id} />
                </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-gray-600 text-center py-8">
                {search ? 'No episodes match your search.' : 'No episodes yet. Stay tuned.'}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
