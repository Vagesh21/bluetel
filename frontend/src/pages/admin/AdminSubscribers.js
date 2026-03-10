import React, { useState, useEffect } from 'react';
import { Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api, { API_BASE } from '@/lib/api';

export default function AdminSubscribers() {
  const [subs, setSubs] = useState([]);

  const fetch = () => api.get('/newsletter/subscribers').then(r => setSubs(r.data || [])).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Remove this subscriber?')) return;
    try { await api.delete(`/newsletter/subscribers/${id}`); toast.success('Removed'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const exportCSV = () => {
    const token = localStorage.getItem('admin_token');
    window.open(`${API_BASE}/newsletter/export-csv?token=${token}`, '_blank');
  };

  return (
    <div data-testid="admin-subscribers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-white">Newsletter Subscribers</h1>
          <p className="text-gray-600 text-sm">{subs.length} subscriber{subs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="border-white/10 text-gray-400 hover:text-white rounded-none text-xs h-9 uppercase tracking-widest" data-testid="export-csv-btn">
          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="bg-blues-surface border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4">Name</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4">Email</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Date</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {subs.map((sub) => (
              <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`subscriber-${sub.id}`}>
                <td className="py-3 px-4 text-sm text-white">{sub.first_name} {sub.last_name}</td>
                <td className="py-3 px-4 text-sm text-gray-400">{sub.email}</td>
                <td className="py-3 px-4 text-xs text-gray-600 font-mono hidden md:table-cell">{sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString() : ''}</td>
                <td className="py-3 px-4">
                  <button onClick={() => remove(sub.id)} className="text-gray-500 hover:text-red-400" data-testid={`remove-subscriber-${sub.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && <p className="text-gray-600 text-center py-8">No subscribers yet.</p>}
      </div>
    </div>
  );
}
