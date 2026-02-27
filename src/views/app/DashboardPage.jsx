import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Bell, Plus, Clock, Flame, Users, Target, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getUserSessions } from '../../services/session.service';
import { getMatches } from '../../services/matching.service';

const DAYS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

const buildWeekly = (sessions) => {
  const map = {Pzt:0,Sal:0,Çar:0,Per:0,Cum:0,Cmt:0,Paz:0};
  const weekAgo = Date.now() - 7*24*60*60*1000;
  sessions.forEach(s => {
    if (s.status !== 'completed') return;
    const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
    if (d.getTime() < weekAgo) return;
    map[DAYS[d.getDay()]] += s.durationMinutes || 0;
  });
  return ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(day => ({ day, minutes: map[day] }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const m = payload[0].value;
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(13,13,13,0.95)', border: '1px solid rgba(245,237,216,0.15)', color: 'var(--cream)' }}>
      <p style={{ color: 'var(--amber)' }}>{label}</p>
      <p>{Math.floor(m/60) > 0 ? `${Math.floor(m/60)}s ` : ''}{m%60}dk</p>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color='var(--amber)' }) => (
  <div className="glass-card p-5 flex items-start gap-4 hover:border-white/15 transition-all">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18` }}>
      <Icon size={20} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-display font-bold text-cream leading-none mb-1">{value}</p>
      <p className="text-xs font-medium text-cream/80">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { currentUser, userDoc } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const displayName = userDoc?.displayName || currentUser?.email?.split('@')[0] || 'Öğrenci';

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([getUserSessions(currentUser.uid, 20), getMatches(currentUser.uid)])
      .then(([s, m]) => { setSessions(s); setMatches(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  const completed = sessions.filter(s => s.status === 'completed');
  const weekAgo = Date.now() - 7*24*60*60*1000;
  const thisWeek = completed.filter(s => {
    const d = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
    return d.getTime() > weekAgo;
  });
  const weekMins = thisWeek.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const activeMatches = matches.filter(m => m.status === 'active').length;
  const pendingMatches = matches.filter(m => m.status === 'pending' && m.initiatedBy !== currentUser?.uid).length;
  const weeklyData = buildWeekly(completed);
  const hasActivity = weeklyData.some(d => d.minutes > 0);

  return (
    <AppLayout title="">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Merhaba, {displayName.split(' ')[0]}! 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--mist)' }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/eslesmeler" className="relative w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:border-white/15 transition-all">
            <Bell size={16} className="text-cream/60" />
            {pendingMatches > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{pendingMatches}</span>
            )}
          </Link>
          <Link to="/oturumlar" className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={15} /> Oturum Planla
          </Link>
        </div>
      </div>

      {/* Motivasyon banner */}
      <div className="mb-6 p-4 rounded-2xl flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,rgba(232,160,32,0.12) 0%,rgba(90,122,90,0.08) 100%)', border: '1px solid rgba(232,160,32,0.2)' }}>
        <span className="text-2xl">✨</span>
        <div>
          <p className="text-sm font-display font-semibold text-cream">"Küçük adımlar, büyük yolculukların başlangıcıdır."</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>Günün motivasyon mesajı</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="Bu Hafta"
          value={weekMins===0 ? '—' : `${Math.floor(weekMins/60)>0?Math.floor(weekMins/60)+'s ':''}${weekMins%60}dk`}
          sub={weekMins===0 ? 'Henüz oturum yok' : `${thisWeek.length} oturum`} color="var(--amber)" />
        <StatCard icon={Flame} label="Toplam Oturum"
          value={completed.length||'—'}
          sub={completed.length===0?'Henüz yok':`${Math.floor(completed.reduce((s,x)=>s+(x.durationMinutes||0),0)/60)}s toplam`} color="#E87070" />
        <StatCard icon={Users} label="Aktif Eşleşme"
          value={activeMatches||'—'}
          sub={pendingMatches>0?`${pendingMatches} istek bekliyor`:'Bekleyen yok'} color="var(--sage-light)" />
        <StatCard icon={Target} label="Bu Ay"
          value={completed.filter(s=>{const d=s.createdAt?.toDate?.()??new Date(0);return d.getMonth()===new Date().getMonth();}).length||'—'}
          sub="tamamlanan" color="var(--mist)" />
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 glass-card p-5">
          <p className="section-label mb-1">Haftalık Çalışma</p>
          <h3 className="font-display text-lg font-semibold text-cream mb-4">Bu Hafta</h3>
          {hasActivity ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} barSize={24} margin={{left:-20}}>
                <XAxis dataKey="day" tick={{fill:'var(--mist)',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill:'rgba(245,237,216,0.04)'}} />
                <Bar dataKey="minutes" fill="var(--amber)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <p className="text-3xl">📅</p>
              <p className="text-sm text-center" style={{ color: 'var(--mist)' }}>
                Henüz bu hafta oturum yok.<br />İlk oturumunu planla!
              </p>
              <Link to="/oturumlar" className="btn-primary px-5 py-2 text-xs">Oturum Başlat</Link>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <p className="section-label mb-1">Hızlı Erişim</p>
          <h3 className="font-display text-lg font-semibold text-cream mb-4">Menü</h3>
          <div className="flex flex-col gap-2">
            {[
              {icon:'🤝',label:'Eşleşme Bul',to:'/eslesmeler',sub:'Harita ile ara'},
              {icon:'⏱',label:'Oturum Başlat',to:'/oturumlar',sub:'Çalışmaya başla'},
              {icon:'📊',label:'İlerleme',to:'/ilerleme',sub:'İstatistiklerin'},
              {icon:'🧠',label:'Anket',to:'/anket',sub:'Değerlendirmeler'},
            ].map(({icon,label,to,sub})=>(
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{background:'rgba(245,237,216,0.04)',border:'1px solid rgba(245,237,216,0.08)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(245,237,216,0.08)';e.currentTarget.style.borderColor='rgba(245,237,216,0.15)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(245,237,216,0.04)';e.currentTarget.style.borderColor='rgba(245,237,216,0.08)'}}>
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cream">{label}</p>
                  <p className="text-xs" style={{color:'var(--mist)'}}>{sub}</p>
                </div>
                <ChevronRight size={14} className="text-cream/30 group-hover:text-cream/60 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Son oturumlar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-cream">Son Oturumlar</h3>
          <Link to="/oturumlar" className="text-xs flex items-center gap-1" style={{color:'var(--amber)'}}>
            Tümü <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{borderColor:'rgba(245,237,216,0.2)',borderTopColor:'var(--amber)'}} />
          </div>
        ) : sessions.slice(0,4).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-sm" style={{color:'var(--mist)'}}>Henüz oturum yok. İlk oturumunu başlat!</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y" style={{divideColor:'rgba(245,237,216,0.07)'}}>
            {sessions.slice(0,4).map((s,i)=>{
              const date = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
              return (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background:'rgba(232,160,32,0.1)'}}>
                    {s.status==='completed'
                      ? <CheckCircle2 size={16} style={{color:'#5ABF8A'}} />
                      : <BookOpen size={16} style={{color:'var(--amber)'}} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-cream">{s.subject||'Genel Çalışma'}</p>
                    <p className="text-xs" style={{color:'var(--mist)'}}>
                      {s.durationMinutes?`${s.durationMinutes}dk · `:''}
                      {s.status==='completed'?'Tamamlandı':s.status==='active'?'Devam ediyor':'Planlandı'}
                    </p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{color:'var(--mist)'}}>
                    {date.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
