import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { Download, RefreshCw, Users, FileText, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

const ADMIN_UIDS = ['a0QNkfLOyIQJeLufcPHGGsGchsV2'];

const SURVEYS = {
  ucla: {
    label: 'UCLA Yalnızlık Ölçeği',
    questions: ['Okul arkadaşlarımla uyum içindeyim','Okulda arkadaşım yok','Okulda yardım alacak kimse yok','Okulda yalnız hissediyorum','Okuldaki grubun parçasıyım','Okuldakilerle ortak yönlerim var','Okulda kimseye yakın değilim','İlgilerimi paylaşan yok','Dışa dönük ve arkadaş canlısıyım','Okuldakilere yakın hissediyorum','Okulda dışlanmış hissediyorum','Okuldaki ilişkilerim samimi','Okulda kimse tarafından tanınmıyorum','Diğerlerinden ayrı duruyorum','İstediğimde arkadaş edinebilirim','Beni gerçekten anlayan insanlar var','İçine kapanık hissediyorum','Paylaşacak bir şey olmayan insanlar var','Konuşabileceğim insanlar var','Yardım alabileceğim insanlar var'],
  },
  amo: {
    label: 'Akademik Motivasyon Ölçeği',
    questions: ['Yüksek ücretli iş için','Yeni şeyler öğrenmek için','İyi üniversiteye hazırlanmak için','Düşüncelerimi paylaşmak için','Boşa zaman harcıyormuşum gibi','Başarıyla tamamlamak mutlu ediyor','Okulu bitirebileceğimi kanıtlamak','Ailem istediği için','Bilinmeyenleri keşfetmeyi seviyorum','Saygın kuruma girmek için','İlgi çekici metinler okumak','Devam konusunda kararsızım','Kişisel hedeflerimi gerçekleştirmek','Başarılı olduğumda önemli hissediyorum','İleride iyi hayat için','İlgimi çeken konularda bilgi artırmak','Daha iyi meslek seçmek için','Derslere kendimi kaptırmak','Neden gittiğimi bilmiyorum','Zor etkinlikleri başarmak zevk veriyor','Zeki olduğumu göstermek','Yüksek puan almak için','Sürekli öğrenmeye yönlendiriyor','Bilgi ve becerilerimi geliştirmek','Farklı konular öğrenmekten zevk','Ne yaptığımı anlayamıyorum','Başarılı olmak mutlu ediyor','Başarabileceğimi göstermek'],
  },
  self: {
    label: 'Özyeterlilik Ölçeği (SELF)',
    questions: ['Karmaşık derste not özeti','Sıkıcı derste motive olma','Notları arkadaşla karşılaştırma','Eksik notları yeniden yazma','Notları temel olgulara indirgeme','Yeni kavramları ilişkilendirme','Etkili çalışma ortağı olma','Arkadaş sorunlarına rağmen ödev','Karamsar hissederken odaklanma','Geri kaldığında zaman artırma','Uzun ödevler için öncelik değiştirme','Soyut kavramlar için örnek düşünme','Sevmediğin derste motive olma','Sınavda karamsar hissederken motive','Kötü sınavdan önce soru belirleme','Teknik detayları ilişkilendirme','Kötü sınavdan sonra tespit etme','Son dakika yerine erken hazırlanma'],
  },
  sus: {
    label: 'Sistem Kullanılabilirlik (SUS-TR)',
    questions: ['Sıklıkla kullanmak isteyeceğim','Gereksiz karmaşık buldum','Kullanımının kolay olduğunu düşündüm','Teknik destek gerektiğini düşünüyorum','Fonksiyonları iyi entegre buldum','Çok tutarsızlık olduğunu düşündüm','Çoğu kişi çabuk öğrenir','Kullanımı çok elverişsiz buldum','Kullanırken kendimden emin hissettim','Önce çok şey öğrenmem gerekti'],
  },
  study_habits: {
    label: 'Ders Çalışma Alışkanlıkları',
    questions: ['Kendi programımı hazırlarım','Programıma göre hareket ederim','Düzenli çalışırım','Tüm konulara hazırlanırım','Özel derslere katılırım','Rahatsız yerde okurum','Ev işleri yüzünden çalışamam','Önemli noktaları not alırım','Sözlük kullanırım','Yeni kelimelere dikkat ederim','Sınıfta detaylı not tutarım','Şüpheli noktaları sorarım','Zorlukları hemen çözerim','Önemli noktaları kaçırırım','Yardımcı kitapları okurum','Altını çizerim','Zorlandığım derse dikkat ederim','Zayıf konuya zaman ayırırım','Zor derslere öncelik veririm','Aynı konuyu uzun süre okurum','Sadece ilgimi çekeni çalışırım','Konsantre çalışırım','Hiç çalışmadığımı hissederim','Zihnim başka yerlere kayar','Okuduğumu hatırlamıyorum','Sınavda önce düşünürüm','Sınav zamanında gerginleşirim','Gece geç saate kadar çalışırım','Sınav zamanında notları okurum','Sınav zamanında tavsiyeler alırım','Önceki sınav sorularını hazırlamam','Anladıktan sonra ezberlerim','Arkadaşlarımla tartışırım','Yatarak okurum','Sesli okurum','Konuları karşılaştırırım','Derinlemesine düşünürüm','Yeni dersten önce gözden geçiririm','Paragraftan sonra tekrar ederim','Boş zamanlarda okurum','Kütüphane kitaplarını kullanırım','Okuldaki materyalleri okurum'],
  },
  procrastination: {
    label: 'Akademik Erteleme Ölçeği',
    questions: ['İşleri gereksiz yere geciktiririm','Başlamayı ertelerim','Son dakikaya kadar beklerim','Zor kararları geciktiririm','Alışkanlık düzeltmeyi ertelerim','Yapmamak için bahane bulurum','Sıkıcı işlere de zaman ayırırım','İflah olmaz zaman avaresiyim','Zamanımı boşa harcıyorum','Zoru ertelemeye inanırım','Söz verir sonra ayak sürürüm','Eylem planıma uyarım','Nefret etsem de harekete geçemem','Önemli işleri vaktinde bitiririm','Önemini bilsem de harekete geçemem','Yarına bırakmak benim tarzım değil'],
  },
  stress: {
    label: 'Algılanan Stres Ölçeği (PSS)',
    questions: ['Her şeyin yolunda olduğunu hissettim','İşlerin istediğim gibi gittiğini hissettim','Sorunlarla başa çıkma konusunda güvendim','Kızgınlıkları kontrol edebildim','Beklenmedik olay nedeniyle altüst oldum','Önemli şeyleri kontrol edemediğimi hissettim','Zorlukların üstesinden gelemeyeceğimi hissettim','Sinirli ve stresli hissettim','Her şeyle başa çıkamadığımı fark ettim','Kontrolüm dışındaki şeyler yüzünden öfkelendim'],
  },
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate?.() ?? new Date(ts);
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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
      const [usersSnap, surveysSnap, sessionsSnap, matchesSnap, reviewsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'surveys')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'reviews')),
      ]);
      const completedCounts = {};
      Object.keys(SURVEYS).forEach(k => completedCounts[k] = 0);
      surveysSnap.docs.forEach(d => {
        const data = d.data();
        Object.keys(SURVEYS).forEach(k => { if (data.completed?.[k]) completedCounts[k]++; });
      });
      setStats({
        totalUsers: usersSnap.size,
        totalSurveys: surveysSnap.size,
        totalSessions: sessionsSnap.docs.filter(d => d.data().status === 'completed').length,
        totalMatches: matchesSnap.docs.filter(d => d.data().status === 'active').length,
        totalReviews: reviewsSnap.size,
        completedCounts,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Anket Excel ──
  const downloadSurveyExcel = async (surveyId = null) => {
    setLoading(true);
    try {
      const [surveysSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'surveys')),
        getDocs(collection(db, 'users')),
      ]);
      const userMap = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        userMap[d.id] = { isim: data.displayName || 'Bilinmiyor', email: data.email || '', fakulte: data.faculty || '', bolum: data.department || '' };
      });
      const wb = XLSX.utils.book_new();
      const surveysToExport = surveyId ? { [surveyId]: SURVEYS[surveyId] } : SURVEYS;
      for (const [id, survey] of Object.entries(surveysToExport)) {
        const rows = [['No', 'İsim', 'Email', 'Fakülte', 'Bölüm', ...survey.questions.map((q, i) => `S${i + 1}: ${q}`)]];
        let rowNo = 1;
        surveysSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!data[id] || !data.completed?.[id]) return;
          const user = userMap[doc.id] || { isim: doc.id, email: '', fakulte: '', bolum: '' };
          const row = [rowNo++, user.isim, user.email, user.fakulte, user.bolum];
          for (let i = 0; i < survey.questions.length; i++) row.push(data[id][i] ?? '');
          rows.push(row);
        });
        if (rows.length === 1) rows.push(['', 'Henüz yanıt yok']);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, ...survey.questions.map(() => ({ wch: 8 }))];
        XLSX.utils.book_append_sheet(wb, ws, survey.label.substring(0, 31));
      }
      if (!surveyId) {
        const [usSnap, survSnap] = [await getDocs(collection(db, 'users')), await getDocs(collection(db, 'surveys'))];
        const summaryRows = [['Ölçek', 'Yanıt Sayısı']];
        Object.entries(SURVEYS).forEach(([id, s]) => {
          let count = 0;
          survSnap.docs.forEach(d => { if (d.data().completed?.[id]) count++; });
          summaryRows.push([s.label, count]);
        });
        summaryRows.push([''], ['Toplam Kullanıcı', usSnap.size], ['İndirme Tarihi', new Date().toLocaleDateString('tr-TR')]);
        const ws = XLSX.utils.aoa_to_sheet(summaryRows);
        ws['!cols'] = [{ wch: 35 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Özet');
      }
      XLSX.writeFile(wb, surveyId ? `${SURVEYS[surveyId].label}_${new Date().toISOString().split('T')[0]}.xlsx` : `anket_sonuclari_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Kullanım Verileri Excel ──
  const downloadUsageExcel = async () => {
    setLoading(true);
    try {
      const [usersSnap, sessionsSnap, matchesSnap, reviewsSnap, contactsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'reviews')),
        getDocs(collection(db, 'contacts')),
      ]);

      const userMap = {};
      usersSnap.docs.forEach(d => { userMap[d.id] = d.data(); });

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Kullanıcılar ──
      // Reviews'dan kullanıcı başına ortalama hesapla
      const reviewsByUser = {};
      reviewsSnap.docs.forEach(d => {
        const r = d.data();
        if (!reviewsByUser[r.toUserId]) reviewsByUser[r.toUserId] = [];
        reviewsByUser[r.toUserId].push(r.rating);
      });

      const userRows = [['No', 'İsim', 'Email', 'Fakülte', 'Bölüm', 'Sınıf', 'Kampüs', 'Kayıt Tarihi', 'Son Görülme', 'Ortalama Puan', 'Yorum Sayısı']];
      usersSnap.docs.forEach((d, i) => {
        const u = d.data();
        const userReviews = reviewsByUser[d.id] || [];
        const avgRating = userReviews.length
          ? (userReviews.reduce((s, r) => s + r, 0) / userReviews.length).toFixed(2)
          : '';
        userRows.push([
          i + 1,
          u.displayName || '',
          u.email || '',
          u.faculty || '',
          u.department || '',
          u.grade ? u.grade + '. Sınıf' : '',
          u.campusName || '',
          formatDate(u.createdAt),
          formatDate(u.lastSeen),
          avgRating,
          userReviews.length,
        ]);
      });
      const wsUsers = XLSX.utils.aoa_to_sheet(userRows);
      wsUsers['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Kullanıcılar');

      // ── Sheet 2: Oturumlar ──
      const sessionRows = [['No', 'Kullanıcı', 'Partner', 'Ders', 'Süre (dk)', 'Başlangıç', 'Bitiş', 'Durum', 'Odak', 'Verimlilik', 'Stres']];
      sessionsSnap.docs.forEach((d, i) => {
        const s = d.data();
        const userId = s.participants?.[0] || '';
        sessionRows.push([
          i + 1,
          userMap[userId]?.displayName || userId,
          s.partnerName || '',
          s.subject || 'Genel Çalışma',
          s.durationMinutes || 0,
          formatDate(s.startedAt || s.createdAt),
          formatDate(s.endedAt),
          s.status === 'completed' ? 'Tamamlandı' : 'Aktif',
          s.rating?.focusLevel || '',
          s.rating?.productivity || '',
          s.rating?.stressLevel || '',
        ]);
      });
      const wsSessions = XLSX.utils.aoa_to_sheet(sessionRows);
      wsSessions['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, wsSessions, 'Oturumlar');

      // ── Sheet 3: Eşleşmeler ──
      const matchRows = [['No', 'Kullanıcı 1', 'Kullanıcı 2', 'Durum', 'Uyum Skoru', 'Ortak Dersler', 'Oluşturulma', 'Yanıt Tarihi']];
      matchesSnap.docs.forEach((d, i) => {
        const m = d.data();
        const u1 = userMap[m.users?.[0]]?.displayName || m.users?.[0] || '';
        const u2 = userMap[m.users?.[1]]?.displayName || m.users?.[1] || '';
        matchRows.push([
          i + 1, u1, u2,
          m.status === 'active' ? 'Aktif' : m.status === 'pending' ? 'Bekliyor' : 'Sonlandı',
          m.compatibilityScore || '',
          (m.commonSubjects || []).join(', '),
          formatDate(m.createdAt),
          formatDate(m.respondedAt),
        ]);
      });
      const wsMatches = XLSX.utils.aoa_to_sheet(matchRows);
      wsMatches['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsMatches, 'Eşleşmeler');

      // ── Sheet 4: Yorumlar ──
      const reviewRows = [['No', 'Yazan', 'Değerlendirilen', 'Puan', 'Yorum', 'Tarih']];
      reviewsSnap.docs.forEach((d, i) => {
        const r = d.data();
        reviewRows.push([
          i + 1,
          r.fromName || '',
          userMap[r.toUserId]?.displayName || r.toUserId || '',
          r.rating || '',
          r.comment || '',
          formatDate(r.createdAt),
        ]);
      });
      const wsReviews = XLSX.utils.aoa_to_sheet(reviewRows);
      wsReviews['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 40 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsReviews, 'Yorumlar');

      // ── Sheet 5: İletişim Mesajları ──
      const contactRows = [['No', 'Ad Soyad', 'E-posta', 'Konu', 'Mesaj', 'Tarih']];
      contactsSnap.docs.forEach((d, i) => {
        const c = d.data();
        contactRows.push([i + 1, c.name || '', c.email || '', c.subject || '', c.message || '', formatDate(c.createdAt)]);
      });
      const wsContacts = XLSX.utils.aoa_to_sheet(contactRows);
      wsContacts['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 28 }, { wch: 25 }, { wch: 50 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsContacts, 'İletişim Mesajları');

      // ── Sheet 6: Özet ──
      const completedSessions = sessionsSnap.docs.filter(d => d.data().status === 'completed');
      const totalMins = completedSessions.reduce((s, d) => s + (d.data().durationMinutes || 0), 0);
      const summaryRows = [
        ['Metrik', 'Değer'],
        ['Toplam Kullanıcı', usersSnap.size],
        ['Anket Dolduran', await getDocs(collection(db, 'surveys')).then(s => s.size)],
        ['Tamamlanan Oturum', completedSessions.length],
        ['Toplam Çalışma Süresi (dk)', totalMins],
        ['Toplam Çalışma Süresi (saat)', (totalMins / 60).toFixed(1)],
        ['Aktif Eşleşme', matchesSnap.docs.filter(d => d.data().status === 'active').length],
        ['Toplam Yorum', reviewsSnap.size],
        ['İndirme Tarihi', new Date().toLocaleDateString('tr-TR')],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

      XLSX.writeFile(wb, `kullanim_verileri_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="Admin Paneli">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-cream">Admin Paneli</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>Tüm verileri görüntüle ve indir</p>
          </div>
          <button onClick={loadStats} disabled={loading}
            className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> İstatistik
          </button>
        </div>

        {/* İstatistik kartları */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Users size={18} />, label: 'Kullanıcı', value: stats.totalUsers },
              { icon: <FileText size={18} />, label: 'Anket', value: stats.totalSurveys },
              { icon: <Database size={18} />, label: 'Oturum', value: stats.totalSessions },
              { icon: '🤝', label: 'Eşleşme', value: stats.totalMatches },
              { icon: '⭐', label: 'Yorum', value: stats.totalReviews },
              { icon: '📊', label: 'Ölçek Yanıtı', value: Object.values(stats.completedCounts).reduce((a, b) => a + b, 0) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-lg mb-1 flex justify-center" style={{ color: 'var(--amber)' }}>{icon}</div>
                <p className="font-display text-xl font-bold text-cream">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Kullanım verileri */}
        <div className="glass-card p-5">
          <p className="section-label mb-2">Kullanım Verileri</p>
          <p className="text-xs mb-4" style={{ color: 'var(--mist)' }}>
            Kullanıcılar, oturumlar, eşleşmeler ve yorumlar — 5 sheet'li tek Excel dosyası
          </p>
          <button onClick={downloadUsageExcel} disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {loading
              ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              : <><Download size={16} /> Kullanım Verilerini İndir (.xlsx)</>}
          </button>
        </div>

        {/* Anket verileri */}
        <div className="glass-card p-5">
          <p className="section-label mb-2">Anket Sonuçları</p>
          <p className="text-xs mb-4" style={{ color: 'var(--mist)' }}>
            Her ölçek ayrı sheet — soru metinleri başlık satırında
          </p>
          <button onClick={() => downloadSurveyExcel()} disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-4">
            {loading
              ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              : <><Download size={16} /> Tüm Ölçekleri İndir (.xlsx)</>}
          </button>
          <div className="flex flex-col gap-2">
            {Object.entries(SURVEYS).map(([id, s]) => (
              <div key={id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                <div>
                  <p className="text-sm font-medium text-cream">{s.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                    {s.questions.length} madde{stats ? ` · ${stats.completedCounts[id] || 0} yanıt` : ''}
                  </p>
                </div>
                <button onClick={() => downloadSurveyExcel(id)} disabled={loading}
                  className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5">
                  <Download size={12} /> Excel
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
