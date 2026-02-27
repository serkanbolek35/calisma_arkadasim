import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, MapPin, Clock, BookOpen, CheckCircle2, RefreshCw } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { createStudyRequest, getOpenRequests, getMyRequests, cancelRequest, acceptRequest } from '../../services/studyRequest.service';
import { getUserPreferences } from '../../services/user.service';
import { MARMARA_KAMPUSLER } from '../../data/marmara';

const TIME_SLOTS = [
  '08:00–10:00', '10:00–12:00', '12:00–14:00', '14:00–16:00',
  '16:00–18:00', '18:00–20:00', '20:00–22:00',
];

// ── Yeni İstek Modal ─────────────────────────────────────────
const NewRequestModal = ({ subjects, onClose, onSave }) => {
  const [form, setForm] = useState({
    subject: subjects[0] || 'Genel Çalışma',
    location: MARMARA_KAMPUSLER[0].ad,
    date: new Date().toISOString().split('T')[0],
    timeSlot: TIME_SLOTS[2],
    note: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-8"
        style={{ background: 'var(--ink-50)', border: '1px solid rgba(245,237,216,0.12)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-cream">Çalışma İsteği Oluştur</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-cream/40 hover:text-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Ders *</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
              {subjects.map(s => <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>)}
              <option value="Genel Çalışma" style={{ background: '#1A1A1A' }}>Genel Çalışma</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Yer *</label>
            <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
              {MARMARA_KAMPUSLER.map(k => (
                <option key={k.ad} value={k.ad} style={{ background: '#1A1A1A' }}>{k.ad}</option>
              ))}
              <option value="Kütüphane" style={{ background: '#1A1A1A' }}>Kütüphane</option>
              <option value="Kafeterya" style={{ background: '#1A1A1A' }}>Kafeterya</option>
              <option value="Online (Zoom/Meet)" style={{ background: '#1A1A1A' }}>Online (Zoom/Meet)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Tarih *</label>
              <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }} />
            </div>
            <div>
              <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Saat *</label>
              <select value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                className="input-field" style={{ background: 'rgba(245,237,216,0.06)', color: 'var(--cream)' }}>
                {TIME_SLOTS.map(t => <option key={t} value={t} style={{ background: '#1A1A1A' }}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-1.5 block" style={{ color: 'var(--mist)' }}>Not (opsiyonel)</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Örn: Sınav hazırlığı yapacağım, sessiz çalışırım..." rows={2}
              className="input-field resize-none" style={{ background: 'rgba(245,237,216,0.06)' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
            {saving
              ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              : <><Plus size={15} /> Yayınla</>
            }
          </button>
          <button onClick={onClose} className="btn-outline flex-1 py-3">İptal</button>
        </div>
      </div>
    </div>
  );
};

// ── İstek Kartı ──────────────────────────────────────────────
const RequestCard = ({ request, isOwn, onAccept, onCancel, accepting }) => {
  const date = request.createdAt?.toDate?.() ?? new Date();
  const formattedDate = new Date(request.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' });

  return (
    <div className="glass-card p-5 flex flex-col gap-4 hover:border-white/15 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
            style={{ background: isOwn ? 'rgba(90,122,90,0.2)' : 'rgba(232,160,32,0.15)', color: isOwn ? '#5ABF8A' : 'var(--amber)' }}>
            {request.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-cream">{request.displayName}</p>
            <p className="text-xs" style={{ color: 'var(--mist)' }}>
              {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} yayınladı
            </p>
          </div>
        </div>
        {isOwn && (
          <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: 'rgba(90,122,90,0.12)', color: '#5ABF8A', border: '1px solid rgba(90,122,90,0.2)' }}>
            Senin isteğin
          </span>
        )}
      </div>

      {/* Ders */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.15)' }}>
        <BookOpen size={15} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span className="font-medium text-sm" style={{ color: 'var(--amber)' }}>{request.subject}</span>
      </div>

      {/* Detaylar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--mist)' }}>
          <MapPin size={13} /> {request.location}
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--mist)' }}>
          <Clock size={13} /> {formattedDate} · {request.timeSlot}
        </div>
      </div>

      {request.note && (
        <p className="text-sm italic px-3 py-2 rounded-xl"
          style={{ color: 'var(--mist)', background: 'rgba(245,237,216,0.04)', border: '1px solid rgba(245,237,216,0.08)' }}>
          "{request.note}"
        </p>
      )}

      {isOwn ? (
        <button onClick={() => onCancel(request.id)}
          className="w-full py-2 rounded-xl text-sm transition-all"
          style={{ color: '#E87070', border: '1px solid rgba(200,64,64,0.25)', background: 'rgba(200,64,64,0.06)' }}>
          İsteği İptal Et
        </button>
      ) : (
        <button onClick={() => onAccept(request)} disabled={accepting === request.id}
          className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
          {accepting === request.id
            ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            : <><CheckCircle2 size={15} /> Kabul Et & Sohbet Başlat</>
          }
        </button>
      )}
    </div>
  );
};

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function StudyRequestPage() {
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('browse'); // browse | mine
  const [openRequests, setOpenRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [accepting, setAccepting] = useState(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [open, mine, prefs] = await Promise.all([
        getOpenRequests(currentUser.uid),
        getMyRequests(currentUser.uid),
        getUserPreferences(currentUser.uid),
      ]);
      setOpenRequests(open);
      setMyRequests(mine.filter(r => r.status === 'open'));
      setMySubjects(prefs?.subjects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [currentUser]);

  const handleCreate = async (form) => {
    await createStudyRequest(currentUser.uid, {
      ...form,
      displayName: userDoc?.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
    });
    setShowNew(false);
    await loadData();
  };

  const handleAccept = async (request) => {
    setAccepting(request.id);
    try {
      const chatId = await acceptRequest(
        request.id,
        currentUser.uid,
        userDoc?.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
        request
      );
      navigate(`/sohbet/${chatId}`);
    } catch (e) {
      console.error(e);
      setAccepting(null);
    }
  };

  const handleCancel = async (requestId) => {
    await cancelRequest(requestId);
    await loadData();
  };

  const tabs = [
    { id: 'browse', label: '🔍 İstekleri Gör', count: openRequests.length },
    { id: 'mine', label: '📌 Benim İsteklerim', count: myRequests.length },
  ];

  return (
    <AppLayout title="Çalışma İstekleri">
      {showNew && (
        <NewRequestModal
          subjects={mySubjects}
          onClose={() => setShowNew(false)}
          onSave={handleCreate}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold text-cream">Çalışma İstekleri</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            İstek oluştur ya da başkasının isteğini kabul et
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData}
            className="w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:border-white/15 transition-all">
            <RefreshCw size={15} className="text-cream/50" />
          </button>
          <button onClick={() => setShowNew(true)}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Plus size={15} /> Yeni İstek
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: tab === t.id ? 'rgba(232,160,32,0.12)' : 'rgba(245,237,216,0.04)',
              color: tab === t.id ? 'var(--amber)' : 'var(--mist)',
              border: tab === t.id ? '1px solid rgba(232,160,32,0.25)' : '1px solid rgba(245,237,216,0.08)',
            }}>
            {t.label}
            {t.count > 0 && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: 'var(--amber)', color: 'var(--ink)' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(245,237,216,0.15)', borderTopColor: 'var(--amber)' }} />
        </div>
      ) : (
        <>
          {tab === 'browse' && (
            openRequests.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="font-display text-xl font-semibold text-cream mb-2">Şu an açık istek yok</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>
                  İlk isteği sen oluştur!
                </p>
                <button onClick={() => setShowNew(true)} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
                  <Plus size={15} /> Çalışma İsteği Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openRequests.map(r => (
                  <RequestCard key={r.id} request={r} isOwn={false}
                    onAccept={handleAccept} accepting={accepting} />
                ))}
              </div>
            )
          )}

          {tab === 'mine' && (
            myRequests.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="text-4xl mb-4">📌</div>
                <h3 className="font-display text-xl font-semibold text-cream mb-2">Açık isteğin yok</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--mist)' }}>
                  Bir çalışma isteği oluştur, diğer öğrenciler görsün.
                </p>
                <button onClick={() => setShowNew(true)} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
                  <Plus size={15} /> İstek Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRequests.map(r => (
                  <RequestCard key={r.id} request={r} isOwn={true}
                    onCancel={handleCancel} />
                ))}
              </div>
            )
          )}
        </>
      )}
    </AppLayout>
  );
}
