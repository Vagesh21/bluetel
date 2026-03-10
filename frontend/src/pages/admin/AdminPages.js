import React, { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import TiptapEditor from '@/components/TiptapEditor';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content_html: '' });

  const fetchPages = () => api.get('/admin/pages').then(r => setPages(r.data || [])).catch(() => {});
  useEffect(() => { fetchPages(); }, []);

  const startEdit = (page) => {
    setForm({ title: page.title || '', content_html: page.content_html || '' });
    setEditing(page);
  };

  const handleSave = async () => {
    try {
      await api.put(`/pages/${editing.slug}`, form);
      toast.success('Page updated');
      setEditing(null);
      fetchPages();
    } catch { toast.error('Save failed'); }
  };

  if (editing) {
    return (
      <div data-testid="admin-page-editor">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl text-white">Edit: {editing.title || editing.slug}</h1>
          <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 max-w-3xl">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Page Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-blues-surface border-white/10 text-white rounded-none h-10" data-testid="page-title-input" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Content</label>
            <TiptapEditor content={form.content_html} onChange={(html) => setForm({ ...form, content_html: html })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-amber text-black hover:brightness-110 rounded-none h-10 px-6 uppercase tracking-widest text-xs font-bold" data-testid="page-save-btn">Save Page</Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="border-white/10 text-gray-400 rounded-none h-10 px-6 text-xs uppercase tracking-widest">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-pages-list">
      <h1 className="font-heading text-2xl text-white mb-6">Pages</h1>
      <div className="space-y-2">
        {pages.map((page) => (
          <div key={page.slug} className="flex items-center gap-4 p-4 bg-blues-surface border border-white/5 rounded-sm" data-testid={`page-item-${page.slug}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">{page.title || page.slug}</p>
              <p className="text-xs text-gray-600 font-mono">/{page.slug}</p>
            </div>
            <p className="text-xs text-gray-600 hidden md:block">{page.updated_at ? new Date(page.updated_at).toLocaleDateString() : ''}</p>
            <button onClick={() => startEdit(page)} className="text-gray-500 hover:text-white p-1" data-testid={`edit-page-${page.slug}`}>
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        ))}
        {pages.length === 0 && <p className="text-gray-600 text-center py-8">No pages created yet.</p>}
      </div>
    </div>
  );
}
