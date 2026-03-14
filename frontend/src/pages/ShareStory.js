import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function ShareStory() {
  const [form, setForm] = useState({ name: '', email: '', message: '', audio_url: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/community-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, audio_url: res.data.url }));
      toast.success('Audio file uploaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Audio upload failed');
    }
    setUploadingAudio(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/community/share-story', form);
      toast.success('Story received! Thank you for sharing.');
      setForm({ name: '', email: '', message: '', audio_url: '' });
    } catch {
      toast.error('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="pt-16">
      <section className="py-24 md:py-32" data-testid="share-story-page">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center bg-amber/10 text-amber rounded-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-white">
                Share a <span className="text-amber italic">Story.</span>
              </h1>
            </div>
            <p className="text-gray-400 text-base leading-relaxed mb-10">
              Everyone has a blues story. A song that changed your life, a gig you'll never forget, a moment where the music said what words couldn't. We'd love to hear yours.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Your Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="share-story-name" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="share-story-email" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-body">Your Story *</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={8} required
                placeholder="Tell us your blues story..."
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none resize-none"
                data-testid="share-story-message" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-body">Attach Audio (optional)</label>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg"
                onChange={handleAudioUpload}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-amber file:text-black"
                data-testid="share-story-audio-upload"
              />
              {uploadingAudio && <p className="text-xs text-amber mt-1">Uploading...</p>}
              {form.audio_url && (
                <div className="mt-2">
                  <audio controls className="w-full" src={resolveMediaUrl(form.audio_url)} />
                </div>
              )}
            </div>
            <Button type="submit" disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-none h-12 px-8"
              data-testid="share-story-btn">
              <Send className="w-4 h-4 mr-2" />{loading ? 'Sending...' : 'Share Your Story'}
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
