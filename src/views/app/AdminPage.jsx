import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { Download, RefreshCw, Users, FileText } from 'lucide-react';

// Admin uid'leri buraya ekle
const ADMIN_UIDS = ['mfBTTz8rUlU4nF1i8SzdpqAGcFI3']; // kendi uid'ini yaz

const SURVEY_LABELS = {
  ucla: 'UCLA Yalnızlık Ölçeği',
  amo: 'Akademik Motivasyon Ölçeği',
  self: 'Özyeterlilik Ölçeği (SELF)',
  sus: 'Sistem Kullanılabilirlik (SUS-TR)',
  study_habits: 'Ders Çalışma Alışkanlıkları',
  procrastination: 'Akademik Erteleme Ölçeği',
  stress: 'Algılanan Stres Ölçeği (PSS)',
};

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const isAdmin = ADMIN_UIDS.includes(currentUser?.uid);

  if (!isAdmin) return (
    <AppLayout title="Admin">
      <div className="glass-card p-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-display text-xl font-semibold text-cream">Erişim yok</p>
        <p className="text-sm mt-2" style={{ color: 'var(--mist)' }}>Bu sayfa sadece yöneticiler içindir.</p>
      </div>
    </AppLayout>
  );

  const loadStats = async () => {
    setLoading(true);
    try {
      const [usersSnap, surveysSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'surveys')),
      ]);
      const completedCounts = {};
      Object.keys(SURVEY_LABELS).forEach(k => completedCounts[k] = 0);
      surveysSnap.docs.forEach(d => {
        const data = d.data();
        Object.keys(SURVEY_LABELS).forEach(k => {
          if (data.completed?.[k]) completedCounts[k]++;
        });
      });
      setStats({
        totalUsers: usersSnap.size,
        totalSurveys: surveysSnap.size,
        completedCounts,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // CSV indir
  const downloadCSV = async (surveyId) => {
    setLoading(true);
    try {
      const [surveysSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'surveys')),
        getDocs(collection(db, 'users')),
      ]);

      const userMap = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = d.data().displayName || d.data().email || d.id;
      });

      const rows = [];
      surveysSnap.docs.forEach(doc => {
        const data = doc.data();
        if (!data[surveyId] || !data.completed?.[surveyId]) return;
        const answers = data[surveyId];
        const maxQ = Math.max(...Object.keys(answers).map(Number)) + 1;
        const row = { uid: doc.id, isim: userMap[doc.id] || doc.id };
        for (let i = 0; i < maxQ; i++) {
          row[`S${i + 1}`] = answers[i] ?? '';
        }
        rows.push(row);
      });

      if (rows.length === 0) { alert('Bu ölçek için henüz yanıt yok.'); setLoading(false); return; }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${surveyId}_sonuclari_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Tüm anketleri tek Excel-uyumlu CSV olarak indir
  const downloadAll = async () => {
    setLoading(true);
    try {
      const [surveysSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'surveys')),
        getDocs(collection(db, 'users')),
      ]);

      const userMap = {};
      usersSnap.docs.forEach(d => {
        userMap[d.id] = d.data().displayName || d.id;
      });

      // Her ölçek için ayrı sheet olmaz ama tüm veriyi tek dosyaya koy
      let csvContent = '\uFEFF';

      for (const [surveyId, label] of Object.entries(SURVEY_LABELS)) {
        const rows = [];
        surveysSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!data[surveyId] || !data.completed?.[surveyId]) return;
          const answers = data[surveyId];
          const maxQ = Math.max(...Object.keys(answers).map(Number)) + 1;
          const row = { uid: doc.id, isim: userMap[doc.id] || doc.id };
          for (let i = 0; i < maxQ; i++) {
            row[`S${i + 1}`] = answers[i] ?? '';
          }
          rows.push(row);
        });

        if (rows.length === 0) continue;
        csvContent += `\n=== ${label} ===\n`;
        const headers = Object.keys(rows[0]);
        csvContent += headers.join(',') + '\n';
        rows.forEach(r => {
          csvContent += headers.map(h => `"${r[h] ?? ''}"`).join(',') + '\n';
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tum_anket_sonuclari_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Admin Paneli">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-cream">Admin Paneli</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>Anket sonuçlarını görüntüle ve indir</p>
          </div>
          <button onClick={loadStats} disabled={loading}
            className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> İstatistik
          </button>
        </div>

        {/* İstatistikler */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 text-center">
              <Users size={20} className="mx-auto mb-2" style={{ color: 'var(--amber)' }} />
              <p className="font-display text-2xl font-bold text-cream">{stats.totalUsers}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>Toplam Kullanıcı</p>
            </div>
            <div className="glass-card p-4 text-center">
              <FileText size={20} className="mx-auto mb-2" style={{ color: 'var(--amber)' }} />
              <p className="font-display text-2xl font-bold text-cream">{stats.totalSurveys}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>Anket Dolduran</p>
            </div>
          </div>
        )}

        {/* Tümünü indir */}
        <button onClick={downloadAll} disabled={loading}
          className="btn-primary py-3 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            : <><Download size={16} /> Tüm Anket Sonuçlarını İndir (.csv)</>}
        </button>

        {/* Tek tek ölçek indirme */}
        <div className="glass-card p-5">
          <p className="section-label mb-4">Ölçek Bazında İndir</p>
          <div className="flex flex-col gap-2">
            {Object.entries(SURVEY_LABELS).map(([id, label]) => (
              <div key={id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                <div>
                  <p className="text-sm font-medium text-cream">{label}</p>
                  {stats && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                      {stats.completedCounts[id] || 0} yanıt
                    </p>
                  )}
                </div>
                <button onClick={() => downloadCSV(id)} disabled={loading}
                  className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5">
                  <Download size={12} /> CSV
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
