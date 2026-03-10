import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';

export function PushNotificationOptIn() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidRes = await api.get('/push/vapid-key');
      const applicationServerKey = urlBase64ToUint8Array(vapidRes.data.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const subJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });
      setSubscribed(true);
      toast.success('You\'ll be notified of new episodes and events!');
    } catch (err) {
      console.error('Push subscription error:', err);
      toast.error('Could not enable notifications. Check browser permissions.');
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      setSubscribed(false);
      toast.success('Notifications disabled.');
    } catch { toast.error('Could not unsubscribe.'); }
  };

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 text-xs uppercase tracking-widest transition-colors px-3 py-2 rounded-sm ${
        subscribed
          ? 'bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20'
          : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'
      }`}
      data-testid="push-notification-toggle"
      aria-label={subscribed ? 'Disable notifications' : 'Enable notifications'}
    >
      {subscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
      {loading ? 'Working...' : subscribed ? 'Notifications On' : 'Get Notified'}
    </button>
  );
}

export function AdminPushSender() {
  const [form, setForm] = useState({ title: '', body: '', url: '' });
  const [count, setCount] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/push/subscribers-count').then(r => setCount(r.data.count)).catch(() => {});
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) { toast.error('Title and body are required'); return; }
    setSending(true);
    try {
      const res = await api.post('/push/send', form);
      toast.success(res.data.message);
      setForm({ title: '', body: '', url: '' });
    } catch (err) { toast.error(err.response?.data?.detail || 'Send failed'); }
    setSending(false);
  };

  return (
    <div data-testid="admin-push-sender">
      <h3 className="text-white text-sm font-semibold mb-1 flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-gray-500" /> Push Notifications</h3>
      <p className="text-xs text-gray-600 mb-4">{count} subscriber{count !== 1 ? 's' : ''}</p>
      <form onSubmit={handleSend} className="space-y-3">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title"
          className="bg-blues-bg border-white/10 text-white rounded-none h-10 text-sm" data-testid="push-title" />
        <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Notification body" rows={2}
          className="bg-blues-bg border-white/10 text-white rounded-none resize-none text-sm" data-testid="push-body" />
        <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Link URL (optional)"
          className="bg-blues-bg border-white/10 text-white rounded-none h-10 text-sm" data-testid="push-url" />
        <Button type="submit" disabled={sending} className="bg-amber text-black hover:brightness-110 rounded-none h-9 text-xs uppercase tracking-widest font-bold" data-testid="push-send-btn">
          <Send className="w-3.5 h-3.5 mr-1" /> {sending ? 'Sending...' : 'Send Notification'}
        </Button>
      </form>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
