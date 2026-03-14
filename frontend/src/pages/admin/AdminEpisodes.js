import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/api';

const formatDateInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const todayDateInput = () => new Date().toISOString().slice(0, 10);

export default function AdminEpisodes() {
  const [episodes, setEpisodes] = useState([]);
  const [shows, setShows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ show_slug: '', title: '', description: '', external_audio_url: '', audio_url: '', cover_art_url: '', youtube_url: '', spotify_url: '', tags: '', duration_seconds: 0, published: true, publish_date: todayDateInput() });
  const [showEditing, setShowEditing] = useState(null);
  const [showForm, setShowForm] = useState({ name: '', slug: '', description: '', cover_art_url: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadingShowCover, setUploadingShowCover] = useState(false);

  const fetchEpisodes = () => api.get('/episodes?published_only=false&limit=200').then(r => setEpisodes(r.data.episodes || [])).catch(() => {});
  const fetchShows = () => api.get('/shows').then(r => setShows(r.data || [])).catch(() => {});

  useEffect(() => { fetchEpisodes(); fetchShows(); }, []);

  const resetForm = () => {
    setForm({ show_slug: '', title: '', description: '', external_audio_url: '', audio_url: '', cover_art_url: '', youtube_url: '', spotify_url: '', tags: '', duration_seconds: 0, published: true, publish_date: todayDateInput() });
    setEditing(null);
  };

  const startEdit = (ep) => {
    setForm({ show_slug: ep.show_slug, title: ep.title, description: ep.description || '', external_audio_url: ep.external_audio_url || '', audio_url: ep.audio_url || '', cover_art_url: ep.cover_art_url || '', youtube_url: ep.youtube_url || '', spotify_url: ep.spotify_url || '', tags: (ep.tags || []).join(', '), duration_seconds: ep.duration_seconds || 0, published: ep.published, publish_date: formatDateInput(ep.published_at) || formatDateInput(ep.created_at) || todayDateInput() });
    setEditing(ep);
  };

  const resetShowForm = () => {
    setShowForm({ name: '', slug: '', description: '', cover_art_url: '' });
    setShowEditing(null);
  };

  const startShowEdit = (show) => {
    setShowForm({
      name: show.name || '',
      slug: show.slug || '',
      description: show.description || '',
      cover_art_url: show.cover_art_url || '',
    });
    setShowEditing(show);
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

  const handleShowImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingShowCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm((prev) => ({ ...prev, cover_art_url: res.data.url }));
      toast.success('Show cover uploaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
    setUploadingShowCover(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.show_slug) { toast.error('Title and show are required'); return; }
    const publishedAt = form.publish_date ? new Date(`${form.publish_date}T00:00:00`).toISOString() : undefined;
    const payload = {
      ...form,
      published_at: publishedAt,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      duration_seconds: parseInt(form.duration_seconds) || 0,
    };
    delete payload.publish_date;
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

  const handleShowSave = async () => {
    if (!showForm.name.trim()) {
      toast.error('Show name is required');
      return;
    }
    const payload = {
      name: showForm.name.trim(),
      slug: showForm.slug.trim() || undefined,
      description: showForm.description,
      cover_art_url: showForm.cover_art_url,
    };
    try {
      if (showEditing === 'new') {
        await api.post('/shows', payload);
        toast.success('Show created');
      } else {
        await api.put(`/shows/${showEditing.id}`, payload);
        toast.success('Show updated');
      }
      resetShowForm();
      fetchShows();
      fetchEpisodes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to save show');
    }
  };

  const handleShowDelete = async (showId) => {
    if (!window.confirm('Delete this show? It must have no episodes.')) return;
    try {
      await api.delete(`/shows/${showId}`);
      toast.success('Show deleted');
      fetchShows();
      fetchEpisodes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to delete show');
    }
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
          <div>
            <label className="block text-sm text-gray-400 mb-1">Episode Date (optional)</label>
            <Input
              type="date"
              value={form.publish_date || ''}
              onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
              className="bg-blues-surface border-white/10 text-white rounded-none h-10"
              data-testid="episode-publish-date"
            />
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

      <div className="mt-10 border-t border-white/5 pt-8" data-testid="admin-shows-list">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-white flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-amber" /> Shows
          </h2>
          <Button onClick={() => setShowEditing('new')} className="bg-white/10 text-white hover:bg-white/20 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="new-show-btn">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Show
          </Button>
        </div>

        {showEditing !== null && (
          <div className="mb-6 p-4 bg-blues-surface border border-white/5 rounded-sm" data-testid="admin-show-form">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm uppercase tracking-widest">{showEditing === 'new' ? 'Create Show' : 'Edit Show'}</h3>
              <button onClick={resetShowForm} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <Input value={showForm.name} onChange={(e) => setShowForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-blues-bg border-white/10 text-white rounded-none h-10" data-testid="show-name-input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug</label>
                  <Input value={showForm.slug} onChange={(e) => setShowForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="auto-from-name"
                    className="bg-blues-bg border-white/10 text-white rounded-none h-10" data-testid="show-slug-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <Textarea value={showForm.description} onChange={(e) => setShowForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3} className="bg-blues-bg border-white/10 text-white rounded-none resize-none" data-testid="show-description-input" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cover Art URL</label>
                <Input value={showForm.cover_art_url} onChange={(e) => setShowForm((prev) => ({ ...prev, cover_art_url: e.target.value }))}
                  className="bg-blues-bg border-white/10 text-white rounded-none h-10 mb-2" data-testid="show-cover-url-input" />
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleShowImageUpload}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white"
                  data-testid="show-cover-upload" />
                {uploadingShowCover && <p className="text-xs text-amber mt-1">Uploading...</p>}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleShowSave} className="bg-amber text-black hover:brightness-110 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="show-save-btn">
                  {showEditing === 'new' ? 'Create Show' : 'Save Show'}
                </Button>
                <Button variant="outline" onClick={resetShowForm} className="border-white/10 text-gray-400 rounded-none text-xs h-9 uppercase tracking-widest">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {shows.map((show) => (
            <div key={show.id || show.slug} className="flex items-center gap-4 p-3 bg-blues-surface border border-white/5 rounded-sm" data-testid={`admin-show-${show.slug}`}>
              <img src={show.cover_art_url || '/placeholder.jpg'} alt="" className="w-10 h-10 object-cover rounded-sm flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{show.name}</p>
                <p className="text-xs text-gray-600">/{show.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startShowEdit(show)} className="text-gray-500 hover:text-white p-1" data-testid={`edit-show-${show.slug}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleShowDelete(show.id)} className="text-gray-500 hover:text-red-400 p-1" data-testid={`delete-show-${show.slug}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {shows.length === 0 && <p className="text-gray-600 text-center py-4">No shows yet.</p>}
        </div>
      </div>
    </div>
  );
}
