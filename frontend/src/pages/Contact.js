import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const SOCIALS = [
  { icon: Facebook, url: 'https://facebook.com/theblueshotel/', label: 'Facebook' },
  { icon: Instagram, url: 'https://instagram.com/theblueshotel/', label: 'Instagram' },
  { icon: Youtube, url: 'https://youtube.com/@theblueshotel', label: 'YouTube' },
  { icon: Linkedin, url: 'https://www.linkedin.com/in/the-blues-hotel-collective', label: 'LinkedIn' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="pt-16">
      <section className="py-24 md:py-32" data-testid="contact-page">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div {...fadeUp}>
              <h1 className="font-heading text-4xl sm:text-5xl text-white mb-6">
                Get in <span className="text-amber italic">Touch.</span>
              </h1>
              <p className="text-gray-400 text-base leading-relaxed mb-10">
                Whether you have a question, want to collaborate, or just want to talk blues — we'd love to hear from you.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-amber/10 text-amber rounded-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Email</p>
                    <a href="mailto:admin@theblueshotel.com.au" className="text-white hover:text-amber transition-colors" data-testid="contact-email-link">
                      admin@theblueshotel.com.au
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-amber/10 text-amber rounded-sm">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Phone</p>
                    <p className="text-white">0482 170 801</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-amber/10 text-amber rounded-sm">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Location</p>
                    <p className="text-white">Surry Hills, NSW, Australia</p>
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <p className="text-gray-500 text-sm mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      data-testid={`contact-social-${s.label.toLowerCase()}`}
                      className="w-10 h-10 flex items-center justify-center border border-white/10 text-gray-500 hover:text-amber hover:border-amber/30 transition-all"
                    >
                      <s.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="contact-name" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="contact-email" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none h-12"
                  data-testid="contact-subject" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 font-body">Message *</label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} required
                  className="bg-blues-surface border-white/10 focus:border-amber/30 text-white placeholder:text-gray-600 rounded-none resize-none"
                  data-testid="contact-message" />
              </div>
              <Button type="submit" disabled={loading}
                className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest rounded-none h-12 px-8"
                data-testid="contact-submit-btn">
                <Send className="w-4 h-4 mr-2" />{loading ? 'Sending...' : 'Send Message'}
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}
