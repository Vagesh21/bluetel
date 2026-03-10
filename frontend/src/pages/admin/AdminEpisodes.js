import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminEpisodes() {
  const [episodes, setEpisodes] = useState([]);
  const [shows, setShows] = useState([]);
  const [editing, setEditing] = useState(null); // null = list, 'new' = create, episode object = edit
  const [form, setForm] = useState({ show_slug: '', title: '', description: '', external_audio_url: '', audio_url: '', cover_art_url: '', youtube_url: '', spotify_url: '', tags: '', duration_seconds: 0, published: true });
  const [uploading, setUploading] = useState(false);

  const fetchEpisodes = () => api.get('/episodes?published_only=false&limit=200').then(r => setEpisodes(r.data.episodes || [])).catch(() => {});
  const fetchShows = () => api.get('/shows').then(r => setShows(r.data || [])).catch(() => {});

  useEffect(() => { fetchEpisodes(); fetchShows(); }, []);

  const resetForm = () => {
    setForm({ show_slug: '', title: '', description: '', external_audio_url: '', audio_url: '', cover_art_url: '', youtube_url: '', spotify_url: '', tags: '', duration_seconds: 0, published: true });
    setEditing(null);
  };

  const startEdit = (ep) => {
    setForm({ show_slug: ep.show_slug, title: ep.title, description: ep.description || '', external_audio_url: ep.external_audio_url || '', audio_url: ep.audio_url || '', cover_art_url: ep.cover_art_url || '', youtube_url: ep.youtube_url || '', spotify_url: ep.spotify_url || '', tags: (ep.tags || []).join(', '), duration_seconds: ep.duration_seconds || 0, published: ep.published });
    setEditing(ep);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, audio_url: res.data.url });
      toast.success('Audio uploaded');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ ...form, cover_art_url: res.data.url });
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
  };

  const handleSave = async () => {
    if (!form.title || !form.show_slug) { toast.error('Title and show are required'); return; }
    const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [], duration_seconds: parseInt(form.duration_seconds) || 0 };
    try {
      if (editing === 'new') {
        await api.post('/episodes', payload);
        toast.success('Episode created');
      } else {
        await api.put(`/episodes/${editing.id}`, payload);
        toast.success('Episode updated');
      }
      resetForm();
      fetchEpisodes();
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this episode?')) return;
    try { await api.delete(`/episodes/${id}`); toast.success('Deleted'); fetchEpisodes(); }
    catch { toast.error('Delete failed'); }
  };

  // FORM VIEW
  if (editing !== null) {
    return (
      <div data-testid="admin-episode-form">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl text-white">{editing === 'new' ? 'New Episode' : 'Edit Episode'}</h1>
          <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Show *</label>
            <Select value={form.show_slug} onValueChange={(v) => setForm({ ...form, show_slug: v })}>
              <SelectTrigger className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="episode-show-select">
                <SelectValue placeholder="Select show" />
              </SelectTrigger>
              <SelectContent className="bg-blues-surface border-white/10">
                {shows.map(s => <SelectItem key={s.slug} value={s.slug} className="text-white">{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="episode-title" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
              className="bg-blues-surface border-white/10 text-white rounded-none resize-none" data-testid="episode-description" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Upload Audio</label>
              <input type="file" accept=".mp3,.wav,.m4a,.ogg" onChange={handleAudioUpload}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-amber file:text-black"
                data-testid="episode-audio-upload" />
              {uploading && <p className="text-xs text-amber mt-1">Uploading...</p>}
              {form.audio_url && <p className="text-xs text-green-400 mt-1">Uploaded: {form.audio_url}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">External Audio URL</label>
              <Input value={form.external_audio_url} onChange={(e) => setForm({ ...form, external_audio_url: e.target.value })} placeholder="https://"
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="episode-external-url" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cover Art</label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
              data-testid="episode-cover-upload" />
            {form.cover_art_url && <p className="text-xs text-gray-500 mt-1">{form.cover_art_url}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">YouTube URL</label>
              <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Spotify URL</label>
              <Input value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="episode-tags" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
              <Input type="number" value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: e.target.value })}
                className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="episode-duration" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} data-testid="episode-published-toggle" />
            <label className="text-sm text-gray-400">Published</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="bg-amber text-black hover:brightness-110 rounded-none h-10 px-6 uppercase tracking-widest text-xs font-bold" data-testid="episode-save-btn">
              {editing === 'new' ? 'Create Episode' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={resetForm} className="border-white/10 text-gray-400 rounded-none h-10 px-6 text-xs uppercase tracking-widest">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div data-testid="admin-episodes-list">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-white">Episodes</h1>
        <Button onClick={() => setEditing('new')} className="bg-amber text-black hover:brightness-110 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="new-episode-btn">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Episode
        </Button>
      </div>
      <div className="space-y-2">
        {episodes.map((ep) => (
          <div key={ep.id} className="flex items-center gap-4 p-3 bg-blues-surface border border-white/5 rounded-sm" data-testid={`admin-episode-${ep.id}`}>
            <img src={ep.cover_art_url || ep.show_cover_art_url} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{ep.title}</p>
              <p className="text-xs text-gray-600">{ep.show_name} {!ep.published && <span className="text-amber ml-2">DRAFT</span>}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(ep)} className="text-gray-500 hover:text-white p-1" data-testid={`edit-episode-${ep.id}`}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(ep.id)} className="text-gray-500 hover:text-red-400 p-1" data-testid={`delete-episode-${ep.id}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {episodes.length === 0 && <p className="text-gray-600 text-center py-8">No episodes yet.</p>}
      </div>
    </div>
  );
}
