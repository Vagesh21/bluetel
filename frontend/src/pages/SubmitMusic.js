import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function SubmitMusic() {
  const [form, setForm] = useState({ name: '', artist_name: '', email: '', message: '', file_url: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/community/submit-music', form);
      toast.success('Music submission received! We\'ll be in touch.');
      setForm({ name: '', artist_name: '', email: '', message: '', file_url: '' });
    } catch {
      toast.error('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="pt-16">
      <section className="py-24 md:py-32" data-testid="submit-music-page">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <motion.div {...fadeUp}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center bg-amber/10 text-amber rounded-sm">
                <Music className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-3xl md:text-4xl text-white">
                Submit <span className="text-amber italic">Music.</span>
              </h1>
            </div>
            <p className="text-gray-400 text-base leading-relaxed mb-10">
              Got a track you want us to hear? We're always looking for fresh independent blues. Share your music and tell us your story.
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
                  data-testid="submit-music-name" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Artist Name</label>
                <Input value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })}
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="submit-music-artist" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-body">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="submit-music-email" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-body">Link to Music (SoundCloud, YouTube, etc.)</label>
              <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://"
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                data-testid="submit-music-link" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-body">Message</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4}
                className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none resize-none"
                data-testid="submit-music-message" />
            </div>
            <Button type="submit" disabled={loading}
              className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-none h-12 px-8"
              data-testid="submit-music-btn">
              <Upload className="w-4 h-4 mr-2" />{loading ? 'Sending...' : 'Submit Music'}
            </Button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
