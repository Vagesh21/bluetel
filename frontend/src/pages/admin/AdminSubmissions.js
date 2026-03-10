import React, { useState, useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetch = () => api.get('/submissions').then(r => setSubmissions(r.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    try { await api.put(`/submissions/${id}/read`); fetch(); } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try { await api.delete(`/submissions/${id}`); toast.success('Deleted'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.type === filter);

  return (
    <div data-testid="admin-submissions">
      <h1 className="font-heading text-2xl text-white mb-6">Submissions</h1>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="bg-blues-surface border border-white/5 h-9">
          <TabsTrigger value="all" className="text-xs uppercase tracking-widest data-[state=active]:bg-amber data-[state=active]:text-black rounded-none">All</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs uppercase tracking-widest data-[state=active]:bg-amber data-[state=active]:text-black rounded-none">Contact</TabsTrigger>
          <TabsTrigger value="submit_music" className="text-xs uppercase tracking-widest data-[state=active]:bg-amber data-[state=active]:text-black rounded-none">Music</TabsTrigger>
          <TabsTrigger value="share_story" className="text-xs uppercase tracking-widest data-[state=active]:bg-amber data-[state=active]:text-black rounded-none">Stories</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map((sub) => (
          <div key={sub.id} className={`p-4 bg-blues-surface border rounded-sm ${sub.read ? 'border-white/5' : 'border-amber/20'}`} data-testid={`submission-${sub.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {!sub.read && <div className="w-2 h-2 rounded-full bg-amber flex-shrink-0" />}
                  <p className="text-sm text-white font-semibold">{sub.name}</p>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-sm">{sub.type?.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{sub.email} {sub.subject && `\u2014 ${sub.subject}`}</p>
                {sub.artist_name && <p className="text-xs text-amber mb-1">Artist: {sub.artist_name}</p>}
                <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">{sub.message}</p>
                {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-electric hover:underline mt-1 block">View attached file</a>}
                <p className="text-xs text-gray-700 mt-2 font-mono">{sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!sub.read && (
                  <button onClick={() => markRead(sub.id)} className="text-gray-500 hover:text-amber p-1" title="Mark as read" data-testid={`mark-read-${sub.id}`}>
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => remove(sub.id)} className="text-gray-500 hover:text-red-400 p-1" data-testid={`delete-submission-${sub.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-600 text-center py-8">No submissions yet.</p>}
      </div>
    </div>
  );
}
