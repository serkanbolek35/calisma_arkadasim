import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserSessions } from '../../services/session.service';
import { getMatches } from '../../services/matching.service';

const DAYS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(245,237,216,0.15)', color: 'var(--cream)' }}>
      <p style={{ color: 'var(--amber)' }}>{label}</p>
      <p>{payload[0].value} {payload[0].name === 'minutes' ? 'dk' : ''}</p>
    </div>
  );
};

export default function ProgressPage() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([getUserSessions(currentUser.uid, 50), getMatches(currentUser.uid)])
      .then(([s, m]) => { setSessions(s); setMatches(m); })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const completed = sessions.filter(s => s.status === 'completed');
  const totalMins = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // Haftalık veri
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyMap = { Pzt: 0, Sal: 0, Çar: 0, Per: 0, Cum: 0, Cmt: 0, Paz: 0 };
  completed.forEach(s => {
    const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
    if (d.getTime() > weekAgo) weeklyMap[DAYS[d.getDay()]] += s.durationMinutes || 0;
  });
  const weeklyData = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(day => ({ day, minutes: weeklyMap[day] }));

  // Aylık trend (son 4 hafta)
  const monthlyData = [0, 1, 2, 3].map(w => {
    const start = Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    const end = Date.now() - w * 7 * 24 * 60 * 60 * 1000;
    const mins = completed.filter(s => {
      const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
      return d.getTime() >= start && d.getTime() < end;
    }).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return { hafta: `${w + 1}. Hafta`, minutes: mins };
  }).reverse();

  // Motivasyon verisi
  const motivationData = completed
    .filter(s => s.rating?.focusLevel)
    .slice(-10)
    .map((s, i) => ({ oturum: `#${i + 1}`, odak: s.rating.focusLevel, verim: s.rating.productivity || 0 }));

  const statCards = [
    { label: 'Toplam Süre', value: totalMins === 0 ? '—' : `${Math.floor(totalMins / 60)}s ${totalMins % 60}dk`, icon: '⏱' },
    { label: 'Tamamlanan', value: completed.length || '—', icon: '✅' },
    { label: 'Aktif Eşleşme', value: matches.filter(m => m.status === 'active').length || '—', icon: '🤝' },
    { label: 'Bu Hafta', value: weeklyData.reduce((s, d) => s + d.minutes, 0) + 'dk', icon: '🔥' },
  ];

  return (
    <AppLayout title="İlerleme">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon }) => (
              <div key={label} className="glass-card p-5 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="font-display text-2xl font-bold text-cream">{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Haftalık bar chart */}
          <div className="glass-card p-6">
            <p className="section-label mb-1">Haftalık</p>
            <h3 className="font-display text-xl font-semibold text-cream mb-5">Bu Haftaki Çalışma (dakika)</h3>
            {weeklyData.some(d => d.minutes > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} barSize={28} margin={{ left: -20 }}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--mist)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<Tip />} cursor={{ fill: 'rgba(245,237,216,0.03)' }} />
                  <Bar dataKey="minutes" name="minutes" fill="var(--amber)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--mist)' }}>Bu hafta henüz oturum yok.</p>
              </div>
            )}
          </div>

          {/* Aylık trend */}
          <div className="glass-card p-6">
            <p className="section-label mb-1">Trend</p>
            <h3 className="font-display text-xl font-semibold text-cream mb-5">Son 4 Hafta</h3>
            {monthlyData.some(d => d.minutes > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData} margin={{ left: -20 }}>
                  <CartesianGrid stroke="rgba(245,237,216,0.05)" />
                  <XAxis dataKey="hafta" tick={{ fill: 'var(--mist)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="minutes" stroke="var(--amber)" strokeWidth={2.5} dot={{ fill: 'var(--amber)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--mist)' }}>Yeterli veri yok.</p>
              </div>
            )}
          </div>

          {/* Motivasyon */}
          {motivationData.length > 0 && (
            <div className="glass-card p-6">
              <p className="section-label mb-1">Motivasyon</p>
              <h3 className="font-display text-xl font-semibold text-cream mb-5">Odak & Verimlilik Trendi</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={motivationData} margin={{ left: -20 }}>
                  <CartesianGrid stroke="rgba(245,237,216,0.05)" />
                  <XAxis dataKey="oturum" tick={{ fill: 'var(--mist)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="odak" stroke="var(--amber)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="verim" stroke="var(--sage-light)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--amber)' }} />Odak
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--sage-light)' }} />Verimlilik
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
