import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/activity-log').then(r => setLogs(r.data || [])).catch(() => {});
  }, []);

  return (
    <div data-testid="admin-activity-log">
      <h1 className="font-heading text-2xl text-white mb-6">Activity Log</h1>
      <div className="bg-blues-surface border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4">Timestamp</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4">Action</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`log-${log.id}`}>
                <td className="py-3 px-4 text-xs text-gray-500 font-mono whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                <td className="py-3 px-4 text-sm text-white">{log.action}</td>
                <td className="py-3 px-4 text-xs text-gray-600 font-mono hidden md:table-cell">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-gray-600 text-center py-8">No activity recorded yet.</p>}
      </div>
    </div>
  );
}
