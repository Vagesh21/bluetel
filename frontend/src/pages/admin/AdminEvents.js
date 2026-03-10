import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', venue: '', address: '', city: '', ticket_url: '', ticket_price: 0, cover_image_url: '', published: true });

  const fetchEvents = () => api.get('/events?published_only=false').then(r => setEvents(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  useEffect(() => { fetchEvents(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', date: '', time: '', venue: '', address: '', city: '', ticket_url: '', ticket_price: 0, cover_image_url: '', published: true });
    setEditing(null);
  };

  const startEdit = (ev) => {
    setForm({ title: ev.title, description: ev.description || '', date: ev.date, time: ev.time || '', venue: ev.venue || '', address: ev.address || '', city: ev.city || '', ticket_url: ev.ticket_url || '', ticket_price: ev.ticket_price || 0, cover_image_url: ev.cover_image_url || '', published: ev.published });
    setEditing(ev);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, cover_image_url: res.data.url });
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
  };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return; }
    const payload = { ...form, ticket_price: parseFloat(form.ticket_price) || 0 };
    try {
      if (editing === 'new') { await api.post('/events', payload); toast.success('Event created'); }
      else { await api.put(`/events/${editing.id}`, payload); toast.success('Event updated'); }
      resetForm();
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/events/${id}`); toast.success('Deleted'); fetchEvents(); }
    catch { toast.error('Delete failed'); }
  };

  if (editing !== null) {
    return (
      <div data-testid="admin-event-form">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl text-white">{editing === 'new' ? 'New Event' : 'Edit Event'}</h1>
          <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="event-title" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="bg-blues-surface border-white/10 text-white rounded-none resize-none" data-testid="event-description" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date *</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="event-date" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time</label>
              <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="19:00"
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="event-time" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Venue</label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ticket URL</label>
              <Input value={form.ticket_url} onChange={(e) => setForm({ ...form, ticket_url: e.target.value })} placeholder="https://"
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ticket Price (AUD)</label>
              <Input type="number" step="0.01" value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="event-price" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cover Image</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white" />
            {form.cover_image_url && <p className="text-xs text-gray-500 mt-1">{form.cover_image_url}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} data-testid="event-published-toggle" />
            <label className="text-sm text-gray-400">Published</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="bg-amber text-black hover:brightness-110 rounded-none h-10 px-6 uppercase tracking-widest text-xs font-bold" data-testid="event-save-btn">
              {editing === 'new' ? 'Create Event' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={resetForm} className="border-white/10 text-gray-400 rounded-none h-10 px-6 text-xs uppercase tracking-widest">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-events-list">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-white">Events</h1>
        <Button onClick={() => setEditing('new')} className="bg-amber text-black hover:brightness-110 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="new-event-btn">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Event
        </Button>
      </div>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-4 p-3 bg-blues-surface border border-white/5 rounded-sm" data-testid={`admin-event-${ev.id}`}>
            {ev.cover_image_url && <img src={ev.cover_image_url} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{ev.title}</p>
              <p className="text-xs text-gray-600 font-mono">{ev.date} {ev.time && `at ${ev.time}`} {ev.venue && `\u2014 ${ev.venue}`}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(ev)} className="text-gray-500 hover:text-white p-1" data-testid={`edit-event-${ev.id}`}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(ev.id)} className="text-gray-500 hover:text-red-400 p-1" data-testid={`delete-event-${ev.id}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-gray-600 text-center py-8">No events yet.</p>}
      </div>
    </div>
  );
}
