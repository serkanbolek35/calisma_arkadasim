import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserSessions, getWeeklyTotal, getSubjectStats, getPartnerStats, getDailyStats, enrichSessionsForViewer } from '../../services/session.service';
import { getMatches } from '../../services/matching.service';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(245,237,216,0.15)', color: 'var(--cream)' }}>
      <p style={{ color: 'var(--amber)' }}>{label}</p>
      <p>{payload[0].value} {payload[0].name === 'minutes' || payload[0].name === 'totalMins' ? 'dk' : ''}</p>
    </div>
  );
};

const formatTime = (mins) => {
  if (!mins) return '0dk';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}s ${m > 0 ? m + 'dk' : ''}`.trim() : `${m}dk`;
};

export default function ProgressPage() {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([getUserSessions(currentUser.uid, 100), getMatches(currentUser.uid)])
      .then(async ([s, m]) => {
        const enriched = await enrichSessionsForViewer(currentUser.uid, s);
        setSessions(enriched);
        setMatches(m);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const completed = sessions.filter(s => s.status === 'completed');
  const totalMins = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const weeklyMins = getWeeklyTotal(sessions);
  const weeklyData = getDailyStats(sessions);
  const subjectStats = getSubjectStats(sessions);
  const partnerStats = getPartnerStats(sessions);
  const activeMatches = matches.filter(m => m.status === 'active').length;

  // Son 4 hafta trendi
  const monthlyData = [0, 1, 2, 3].map(w => {
    const start = Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000;
    const end = Date.now() - w * 7 * 24 * 60 * 60 * 1000;
    const mins = completed.filter(s => {
      const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
      return d.getTime() >= start && d.getTime() < end;
    }).reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return { hafta: `${w + 1}. Hafta`, minutes: mins };
  }).reverse();

  // Motivasyon trendi
  const motivationData = completed
    .filter(s => s.rating?.focusLevel)
    .slice(-10)
    .map((s, i) => ({ oturum: `#${i + 1}`, odak: s.rating.focusLevel, verim: s.rating.productivity || 0 }));

  const statCards = [
    { label: 'Toplam Süre', value: formatTime(totalMins), icon: '⏱' },
    { label: 'Tamamlanan', value: completed.length || '—', icon: '✅' },
    { label: 'Aktif Eşleşme', value: activeMatches || '—', icon: '🤝' },
    { label: 'Bu Hafta', value: formatTime(weeklyMins), icon: '🔥' },
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

          {/* Konu bazlı istatistik */}
          {subjectStats.length > 0 && (
            <div className="glass-card p-6">
              <p className="section-label mb-1">Konu Analizi</p>
              <h3 className="font-display text-xl font-semibold text-cream mb-5">Ders Bazlı Çalışma Süreleri</h3>
              <ResponsiveContainer width="100%" height={Math.max(120, subjectStats.length * 45)}>
                <BarChart data={subjectStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="subject" tick={{ fill: 'var(--mist)', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<Tip />} cursor={{ fill: 'rgba(245,237,216,0.03)' }} />
                  <Bar dataKey="totalMins" name="totalMins" fill="var(--amber)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {subjectStats.map(s => (
                  <div key={s.subject} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                    <div>
                      <p className="text-sm font-medium text-cream">{s.subject}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{s.count} oturum</p>
                    </div>
                    <p className="text-sm font-mono font-bold" style={{ color: 'var(--amber)' }}>{formatTime(s.totalMins)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eşleşme kalitesi */}
          {partnerStats.length > 0 && (
            <div className="glass-card p-6">
              <p className="section-label mb-1">Eşleşme Kalitesi</p>
              <h3 className="font-display text-xl font-semibold text-cream mb-2">Çalışma Arkadaşları</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--mist)' }}>
                Aynı kişiyle tekrar oturum yapma sürekliliğin göstergesidir.
              </p>
              <div className="flex flex-col gap-3">
                {partnerStats.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(232,160,32,0.15)', color: 'var(--amber)' }}>
                      {p.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cream">{p.partnerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1.5 rounded-full flex-1" style={{ background: 'rgba(245,237,216,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.count * 20)}%`, background: 'var(--amber)' }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: 'var(--mist)' }}>{p.count} oturum</span>
                      </div>
                    </div>
                    <p className="text-sm font-mono font-bold flex-shrink-0" style={{ color: 'var(--amber)' }}>
                      {formatTime(p.totalMins)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Son 4 hafta trendi */}
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

          {/* Motivasyon trendi */}
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
                  <Line type="monotone" dataKey="verim" stroke="#5ABF8A" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--amber)' }} />Odak
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--mist)' }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: '#5ABF8A' }} />Verimlilik
                </div>
              </div>
            </div>
          )}

          {/* Son oturumlar — detaylı log */}
          {completed.length > 0 && (
            <div className="glass-card p-6">
              <p className="section-label mb-1">Log Kayıtları</p>
              <h3 className="font-display text-xl font-semibold text-cream mb-4">Son Oturumlar</h3>
              <div className="flex flex-col gap-2">
                {completed.slice(0, 10).map((s, i) => {
                  const start = s.startedAt?.toDate?.() ?? s.createdAt?.toDate?.() ?? new Date();
                  const end = s.endedAt?.toDate?.() ?? null;
                  return (
                    <div key={i} className="p-3 rounded-xl text-sm"
                      style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'var(--amber)' }}>{s.partnerId ? '🤝' : '👤'}</span>
                          <span className="font-medium text-cream">{s.subject || 'Genel Çalışma'}</span>
                          {s.partnerName && <span className="text-xs" style={{ color: 'var(--mist)' }}>· {s.partnerName} ile</span>}
                        </div>
                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--amber)' }}>
                          {formatTime(s.durationMinutes)}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1.5 text-xs" style={{ color: 'rgba(138,154,170,0.6)' }}>
                        <span>📅 {start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                        <span>🕐 {start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}{end ? ` – ${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                        {s.rating?.focusLevel && <span>🎯 Odak: {s.rating.focusLevel}/5</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </AppLayout>
  );
}
