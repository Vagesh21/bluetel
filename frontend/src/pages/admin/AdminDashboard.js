import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, CalendarDays, Users, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-blues-surface border border-white/10 rounded-sm px-3 py-2 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="text-amber font-bold">{payload[0].value}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500">Loading dashboard...</div>;

  const cards = [
    { label: 'Episodes', value: stats.episodes_count, icon: Mic, link: '/admin/episodes', color: 'text-amber' },
    { label: 'Events', value: stats.events_count, icon: CalendarDays, link: '/admin/events', color: 'text-electric' },
    { label: 'Subscribers', value: stats.subscribers_count, icon: Users, link: '/admin/subscribers', color: 'text-green-400' },
    { label: 'Unread Messages', value: stats.unread_submissions, icon: MessageSquare, link: '/admin/submissions', color: 'text-red-400' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl text-white">Dashboard</h1>
          <p className="text-gray-600 text-sm">Welcome back to the CMS.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/episodes">
            <Button className="bg-amber text-black hover:brightness-110 rounded-none text-xs h-9 uppercase tracking-widest font-bold" data-testid="admin-add-episode">
              <Plus className="w-3.5 h-3.5 mr-1" /> Episode
            </Button>
          </Link>
          <Link to="/admin/events">
            <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white rounded-none text-xs h-9 uppercase tracking-widest" data-testid="admin-add-event">
              <Plus className="w-3.5 h-3.5 mr-1" /> Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-blues-surface border border-white/5 hover:border-white/10 transition-colors rounded-sm p-5" data-testid={`stat-${card.label.toLowerCase().replace(/\s+/g,'-')}`}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="font-heading text-2xl text-white">{card.value}</p>
            <p className="text-gray-600 text-xs uppercase tracking-wider mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Episodes by Show */}
        <div className="bg-blues-surface border border-white/5 rounded-sm p-5" data-testid="chart-episodes-by-show">
          <h3 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Episodes by Show</h3>
          {stats.episodes_by_show && stats.episodes_by_show.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.episodes_by_show} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#27272A' }} />
                <YAxis tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#27272A' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#FFB347" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-600 text-sm text-center py-8">No data yet</p>}
        </div>

        {/* Subscriber Growth */}
        <div className="bg-blues-surface border border-white/5 rounded-sm p-5" data-testid="chart-subscriber-growth">
          <h3 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Subscriber Growth</h3>
          {stats.subscriber_growth && stats.subscriber_growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.subscriber_growth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#27272A' }} />
                <YAxis tick={{ fill: '#71717A', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#27272A' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#2E5CFF" strokeWidth={2} dot={{ fill: '#2E5CFF', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-600 text-sm text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Episodes */}
        <div className="bg-blues-surface border border-white/5 rounded-sm p-5">
          <h3 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Recent Episodes</h3>
          <div className="space-y-3">
            {(stats.recent_episodes || []).map((ep) => (
              <div key={ep.id} className="flex items-center gap-3">
                <img src={ep.cover_art_url || ep.show_cover_art_url} alt="" className="w-8 h-8 object-cover rounded-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{ep.title}</p>
                  <p className="text-xs text-gray-600">{ep.show_name}</p>
                </div>
              </div>
            ))}
            {(!stats.recent_episodes || stats.recent_episodes.length === 0) && (
              <p className="text-gray-600 text-sm">No episodes yet.</p>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-blues-surface border border-white/5 rounded-sm p-5">
          <h3 className="text-amber text-sm uppercase tracking-widest mb-4 font-body font-semibold">Recent Messages</h3>
          <div className="space-y-3">
            {(stats.recent_submissions || []).map((sub) => (
              <div key={sub.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sub.read ? 'bg-gray-700' : 'bg-amber'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-white">{sub.name} <span className="text-gray-600">({sub.type?.replace('_', ' ')})</span></p>
                  <p className="text-xs text-gray-500 truncate">{sub.message}</p>
                </div>
              </div>
            ))}
            {(!stats.recent_submissions || stats.recent_submissions.length === 0) && (
              <p className="text-gray-600 text-sm">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
