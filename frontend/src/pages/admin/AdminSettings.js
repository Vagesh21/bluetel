import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data || {})).catch(() => {});
  }, []);

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', { settings });
      toast.success('Settings saved');
    } catch { toast.error('Save failed'); }
    setLoading(false);
  };

  const handleTestEmail = async () => {
    try {
      await api.post('/settings/test-email');
      toast.success('Test email sent! Check your inbox.');
    } catch (err) { toast.error(err.response?.data?.detail || 'Test email failed'); }
  };

  const Field = ({ label, sKey, type = 'text', placeholder = '' }) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <Input
        type={type}
        value={settings[sKey] || ''}
        onChange={(e) => update(sKey, e.target.value)}
        placeholder={placeholder}
        className="bg-blues-surface border-white/10 text-white rounded-none h-10"
        data-testid={`setting-${sKey}`}
      />
    </div>
  );

  return (
    <div data-testid="admin-settings">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl text-white">Settings</h1>
        <Button onClick={handleSave} disabled={loading} className="bg-amber text-black hover:brightness-110 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="save-settings-btn">
          {loading ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      <div className="space-y-10 max-w-2xl">
        {/* Site Settings */}
        <div>
          <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Site Information</h2>
          <div className="space-y-4">
            <Field label="Site Title" sKey="site_title" />
            <Field label="Tagline" sKey="site_tagline" />
            <Field label="Contact Email" sKey="contact_email" type="email" />
            <Field label="Contact Phone" sKey="contact_phone" />
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Social Links */}
        <div>
          <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Social Media</h2>
          <div className="space-y-4">
            <Field label="Facebook" sKey="social_facebook" placeholder="https://facebook.com/..." />
            <Field label="Instagram" sKey="social_instagram" placeholder="https://instagram.com/..." />
            <Field label="YouTube" sKey="social_youtube" placeholder="https://youtube.com/..." />
            <Field label="Bluesky" sKey="social_bluesky" placeholder="https://bsky.app/..." />
            <Field label="LinkedIn" sKey="social_linkedin" placeholder="https://linkedin.com/..." />
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Demo Mode */}
        <div>
          <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Demo Mode</h2>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.demo_mode === 'true'}
              onCheckedChange={(v) => update('demo_mode', v ? 'true' : 'false')}
              data-testid="demo-mode-toggle"
            />
            <div>
              <label className="text-sm text-white">Demo Mode</label>
              <p className="text-xs text-gray-600">When enabled, uses Captivate.fm RSS feeds as audio sources for demo episodes.</p>
            </div>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* SMTP Settings */}
        <div>
          <h2 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">SMTP Email Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SMTP Host" sKey="smtp_host" placeholder="smtp.gmail.com" />
              <Field label="SMTP Port" sKey="smtp_port" placeholder="587" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SMTP Username" sKey="smtp_username" placeholder="your@email.com" />
              <div>
                <label className="block text-sm text-gray-400 mb-1">SMTP Password</label>
                <Input
                  type="password"
                  value={settings.smtp_password || ''}
                  onChange={(e) => update('smtp_password', e.target.value)}
                  className="bg-blues-surface border-white/10 text-white rounded-none h-10"
                  data-testid="setting-smtp_password"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="From Name" sKey="smtp_from_name" placeholder="The Blues Hotel" />
              <Field label="From Email" sKey="smtp_from_email" placeholder="noreply@theblueshotel.com.au" />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={settings.smtp_secure === 'true'}
                onCheckedChange={(v) => update('smtp_secure', v ? 'true' : 'false')}
                data-testid="smtp-secure-toggle"
              />
              <label className="text-sm text-gray-400">Use TLS/SSL</label>
            </div>
            <Button onClick={handleTestEmail} variant="outline" className="border-white/10 text-gray-400 hover:text-white rounded-none text-xs h-9 uppercase tracking-widest" data-testid="test-email-btn">
              Send Test Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
