import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, updateUserPreferences, completeOnboarding } from '../../services/user.service';
import { Logo } from '../../components/layout/PublicLayout';
import { MARMARA_FAKULTELER, MARMARA_KAMPUSLER } from '../../data/marmara';

const TIME_SLOTS = [
  { id: 'morning', label: 'Sabah', sub: '08:00–12:00' },
  { id: 'afternoon', label: 'Öğleden Sonra', sub: '12:00–17:00' },
  { id: 'evening', label: 'Akşam', sub: '17:00–21:00' },
  { id: 'night', label: 'Gece', sub: '21:00–00:00' },
];
const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const ALL_SUBJECTS = [
  'Matematik','Fizik','Kimya','Biyoloji','Algoritma ve Programlama','Veri Yapıları',
  'Lineer Cebir','Olasılık ve İstatistik','Diferansiyel Denklemler','Sayısal Analiz',
  'Veri Tabanı','Yazılım Mühendisliği','Yapay Zeka','Makine Öğrenmesi','Bilgisayar Ağları',
  'Mikro İktisat','Makro İktisat','Muhasebe','Finans','Pazarlama','Yönetim',
  'Hukuka Giriş','Medeni Hukuk','Anayasa Hukuku','Ceza Hukuku','Ticaret Hukuku',
  'Tıbbi Biyokimya','Anatomi','Fizyoloji','Farmakoloji','Patoloji',
  'Mesleki İngilizce','Türk Dili','Atatürk İlkeleri ve İnkılap Tarihi',
  'Tasarım Temelleri','Mimarlık Tarihi','Şehir Planlama',
];

const Pill = ({ selected, onClick, children }) => (
  <button type="button" onClick={onClick}
    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
    style={{
      background: selected ? 'var(--amber)' : 'rgba(245,237,216,0.06)',
      color: selected ? 'var(--ink)' : 'var(--cream)',
      border: selected ? 'none' : '1px solid rgba(245,237,216,0.15)',
    }}>
    {children}
  </button>
);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, refreshUserDoc } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ faculty: '', department: '', grade: '' });
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState({ timeSlots: [], days: [] });
  const [selectedCampus, setSelectedCampus] = useState(null);

  const selectedFacultyData = MARMARA_FAKULTELER.find(f => f.ad === profile.faculty);

  const toggleSubject = (s) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleTimeSlot = (id) =>
    setSchedule(s => ({
      ...s, timeSlots: s.timeSlots.includes(id) ? s.timeSlots.filter(x => x !== id) : [...s.timeSlots, id]
    }));

  const toggleDay = (d) =>
    setSchedule(s => ({
      ...s, days: s.days.includes(d) ? s.days.filter(x => x !== d) : [...s.days, d]
    }));

  const canNext = () => {
    if (step === 1) return profile.faculty && profile.grade;
    if (step === 2) return subjects.length >= 1;
    if (step === 3) return schedule.timeSlots.length >= 1 && schedule.days.length >= 1;
    if (step === 4) return selectedCampus !== null;
    return false;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const campusData = MARMARA_KAMPUSLER[selectedCampus];
      const profileData = {
        university: 'Marmara Üniversitesi',
        ...profile,
        campusName: campusData.ad,
        campusLat: campusData.lat,
        campusLng: campusData.lng,
      };
      const prefData = {
        subjects,
        availableHours: schedule,
        campus: campusData.ad,
        campusLat: campusData.lat,
        campusLng: campusData.lng,
      };
      await updateUserProfile(currentUser.uid, profileData);
      await updateUserPreferences(currentUser.uid, prefData);
      await completeOnboarding(currentUser.uid);
      await refreshUserDoc();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Fakülte Bilgilerin',
      content: (
        <div className="flex flex-col gap-4">
          <div className="px-4 py-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)' }}>
            <span>🎓</span>
            <span className="text-sm font-medium" style={{ color: 'var(--amber)' }}>Marmara Üniversitesi</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Fakülte *</label>
            <select value={profile.faculty}
              onChange={e => setProfile(p => ({ ...p, faculty: e.target.value, department: '' }))}
              className="input-field"
              style={{ color: profile.faculty ? 'var(--cream)' : 'var(--mist)', background: 'rgba(245,237,216,0.06)' }}>
              <option value="" disabled style={{ background: '#1A1A1A' }}>Fakülte seç</option>
              {MARMARA_FAKULTELER.map(f => (
                <option key={f.ad} value={f.ad} style={{ background: '#1A1A1A' }}>{f.ad}</option>
              ))}
            </select>
          </div>

          {selectedFacultyData && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Bölüm</label>
              <select value={profile.department}
                onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}
                className="input-field"
                style={{ color: profile.department ? 'var(--cream)' : 'var(--mist)', background: 'rgba(245,237,216,0.06)' }}>
                <option value="" style={{ background: '#1A1A1A' }}>Bölüm seç (opsiyonel)</option>
                {selectedFacultyData.bolumler.map(b => (
                  <option key={b} value={b} style={{ background: '#1A1A1A' }}>{b}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Sınıf *</label>
            <div className="flex flex-wrap gap-2">
              {['1','2','3','4','5+'].map(g => (
                <Pill key={g} selected={profile.grade === g} onClick={() => setProfile(p => ({ ...p, grade: g }))}>
                  {g}. Sınıf
                </Pill>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Çalışmak İstediğin Dersler',
      content: (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--mist)' }}>
            Çalışma arkadaşı bulmak istediğin dersleri seç. (En az 1)
          </p>
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1 py-1">
            {ALL_SUBJECTS.map(s => (
              <Pill key={s} selected={subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</Pill>
            ))}
          </div>
          {subjects.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--sage-light)' }}>✓ {subjects.length} ders seçildi</p>
          )}
        </div>
      ),
    },
    {
      title: 'Çalışma Saatlerin',
      content: (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--mist)' }}>
              Tercih Ettiğin Saatler *
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map(({ id, label, sub }) => (
                <button key={id} type="button" onClick={() => toggleTimeSlot(id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: schedule.timeSlots.includes(id) ? 'rgba(232,160,32,0.12)' : 'rgba(245,237,216,0.04)',
                    border: schedule.timeSlots.includes(id) ? '1.5px solid var(--amber)' : '1.5px solid rgba(245,237,216,0.1)',
                  }}>
                  <p className="text-sm font-medium text-cream">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--mist)' }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--mist)' }}>
              Müsait Günler *
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => (
                <Pill key={d} selected={schedule.days.includes(d)} onClick={() => toggleDay(d)}>{d}</Pill>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Kampüsünü Seç',
      content: (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--mist)' }}>
            Hangi Marmara Üniversitesi kampüsündesin?
          </p>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {MARMARA_KAMPUSLER.map((k, i) => (
              <button key={i} type="button" onClick={() => setSelectedCampus(i)}
                className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                style={{
                  background: selectedCampus === i ? 'rgba(232,160,32,0.12)' : 'rgba(245,237,216,0.04)',
                  border: selectedCampus === i ? '1.5px solid var(--amber)' : '1.5px solid rgba(245,237,216,0.1)',
                }}>
                <span className="text-xl">📍</span>
                <span className="text-sm font-medium"
                  style={{ color: selectedCampus === i ? 'var(--amber)' : 'var(--cream)' }}>
                  {k.ad}
                </span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
        <Logo />
        <p className="text-xs font-mono" style={{ color: 'var(--mist)' }}>{step}/{steps.length}</p>
      </header>

      <div className="h-0.5" style={{ background: 'rgba(245,237,216,0.08)' }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${(step / steps.length) * 100}%`, background: 'var(--amber)' }} />
      </div>

      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-10">
            {steps.map((_, i) => (
              <React.Fragment key={i}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all"
                  style={{
                    background: step > i + 1 ? 'var(--sage)' : step === i + 1 ? 'var(--amber)' : 'rgba(245,237,216,0.1)',
                    color: step >= i + 1 ? 'var(--ink)' : 'var(--mist)',
                  }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px mx-2"
                    style={{ background: step > i + 1 ? 'var(--sage)' : 'rgba(245,237,216,0.1)' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-card p-8 mb-6">
            <div className="mb-6">
              <p className="section-label mb-2">Adım {step}</p>
              <h2 className="font-display text-2xl font-bold text-cream">{steps[step-1].title}</h2>
            </div>
            {steps[step-1].content}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="btn-outline px-5 py-2.5 flex items-center gap-2 disabled:opacity-30">
              <ArrowLeft size={16} /> Geri
            </button>
            {step < steps.length ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
                Devam <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!canNext() || loading}
                className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />Kaydediliyor...</>
                  : <><Sparkles size={16} />Başla!</>
                }
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
