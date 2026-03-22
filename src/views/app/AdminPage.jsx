import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { Download, RefreshCw, Users, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const ADMIN_UIDS = ['a0QNkfLOyIQJeLufcPHGGsGchsV2'];

const SURVEYS = {
  ucla: {
    label: 'UCLA Yalnızlık Ölçeği',
    questions: [
      'Okul arkadaşlarımla uyum içindeyim',
      'Okulda arkadaşım yok',
      'Okulda yardım alacak kimse yok',
      'Okulda yalnız hissediyorum',
      'Okuldaki grubun parçasıyım',
      'Okuldakilerle ortak yönlerim var',
      'Okulda kimseye yakın değilim',
      'İlgilerimi paylaşan yok',
      'Dışa dönük ve arkadaş canlısıyım',
      'Okuldakilere yakın hissediyorum',
      'Okulda dışlanmış hissediyorum',
      'Okuldaki ilişkilerim samimi',
      'Okulda kimse tarafından tanınmıyorum',
      'Diğerlerinden ayrı duruyorum',
      'İstediğimde arkadaş edinebilirim',
      'Beni gerçekten anlayan insanlar var',
      'İçine kapanık hissediyorum',
      'Paylaşacak bir şey olmayan insanlar var',
      'Konuşabileceğim insanlar var',
      'Yardım alabileceğim insanlar var',
    ],
  },
  amo: {
    label: 'Akademik Motivasyon Ölçeği',
    questions: [
      'Yüksek ücretli iş için okula gidiyorum',
      'Yeni şeyler öğrenmek için okula gidiyorum',
      'İyi üniversiteye hazırlanmak için',
      'Düşüncelerimi paylaşmak için',
      'Boşa zaman harcıyormuşum gibi geliyor',
      'Başarıyla tamamlamak mutlu ediyor',
      'Okulu bitirebileceğimi kanıtlamak için',
      'Ailem istediği için',
      'Bilinmeyenleri keşfetmeyi seviyorum',
      'Saygın kuruma girmek için',
      'İlgi çekici metinler okumaktan zevk alıyorum',
      'Devam edip etmeme konusunda kararsızım',
      'Kişisel hedeflerimi gerçekleştirmek için',
      'Başarılı olduğumda kendimi önemli hissediyorum',
      'İleride iyi hayat yaşamak için',
      'İlgimi çeken konularda bilgimi artırmak için',
      'Daha iyi meslek seçmek için',
      'Derslere kendimi kaptırmaktan keyif alıyorum',
      'Neden gittiğimi bilmiyorum',
      'Zor etkinlikleri başarmak zevk veriyor',
      'Zeki olduğumu göstermek için',
      'Yüksek puan almak için',
      'Sürekli öğrenmeye yönlendiriyor',
      'Bilgi ve becerilerimi geliştirmek için',
      'Farklı konular öğrenmekten zevk alıyorum',
      'Ne yaptığımı anlayamıyorum',
      'Başarılı olmak mutlu ediyor',
      'Başarabileceğimi göstermek için',
    ],
  },
  self: {
    label: 'Özyeterlilik Ölçeği (SELF)',
    questions: [
      'Karmaşık derste not özeti çıkarabilir misin?',
      'Sıkıcı derste not tutmak için motive olabilir misin?',
      'Arkadaşınla notları karşılaştırabilir misin?',
      'Eksik notları gözden geçirip yeniden yazabilir misin?',
      'Notları temel olgulara indirgeyebilir misin?',
      'Yeni kavramları eskilerle ilişkilendirebilir misin?',
      'Etkili çalışma ortağı olabilir misin?',
      'Arkadaş sorunlarına rağmen ödev yapabilir misin?',
      'Karamsar hissederken odaklanabilir misin?',
      'Geri kaldığında çalışma zamanını artırabilir misin?',
      'Ödevler uzun sürecekse öncelikleri değiştirebilir misin?',
      'Soyut kavramlar için iyi örnek düşünebilir misin?',
      'Sevmediğin derste kendini motive edebilir misin?',
      'Sınavda karamsar hissederken motive olabilir misin?',
      'Kötü sınavdan önce muhtemel soruları belirleyebilir misin?',
      'Teknik detayları kavramlarla ilişkilendirebilir misin?',
      'Kötü sınavdan sonra unuttuklarını tespit edebilir misin?',
      'Son dakika yerine erken hazırlanmaya başlayabilir misin?',
    ],
  },
  sus: {
    label: 'Sistem Kullanılabilirlik (SUS-TR)',
    questions: [
      'Uygulamayı sıklıkla kullanmak isteyeceğim',
      'Uygulamayı gereksiz karmaşık buldum',
      'Kullanımın kolay olduğunu düşündüm',
      'Teknik destek gerektiğini düşünüyorum',
      'Fonksiyonları iyi entegre buldum',
      'Çok tutarsızlık olduğunu düşündüm',
      'Çoğu kişi çabuk öğrenir',
      'Kullanımı çok elverişsiz buldum',
      'Kullanırken kendimden emin hissettim',
      'Önce çok şey öğrenmem gerekti',
    ],
  },
  study_habits: {
    label: 'Ders Çalışma Alışkanlıkları',
    questions: [
      'Kendi çalışma programımı hazırlarım',
      'Programıma göre hareket ederim',
      'Çalışma odasında düzenli çalışırım',
      'Tüm konulara hazırlanırım',
      'Özel derslere katılırım',
      'Rahatsız edildiğim yerde okurum',
      'Ev işleri yüzünden çalışamam',
      'Okurken önemli noktaları not alırım',
      'Sözlük kullanırım',
      'Yeni kelimelere dikkat ederim',
      'Sınıfta detaylı not tutarım',
      'Şüpheli noktaları öğretmene sorarım',
      'Zorlukları hemen çözmeye çalışırım',
      'Sınıfta önemli noktaları kaçırırım',
      'Yardımcı kitapları okurum',
      'Önemli noktaların altını çizerim',
      'Zorlandığım derse daha çok dikkat ederim',
      'Zayıf konuya daha çok zaman ayırırım',
      'Zor derslere öncelik veririm',
      'Aynı konuyu uzun süre okurum',
      'Sadece ilgimi çeken konuları çalışırım',
      'Konsantre çalışırım',
      'Hiç çalışmadığımı hissederim',
      'Okurken zihnim başka yerlere kayar',
      'Okuduğumu hatırlamıyorum',
      'Sınavda önce düşünürüm',
      'Sınav zamanında gerginleşirim',
      'Gece geç saate kadar çalışırım',
      'Sınav zamanında notları okurum',
      'Sınav zamanında tavsiyeler alırım',
      'Önceki sınav sorularını hazırlamam',
      'Anladıktan sonra ezberlerim',
      'Arkadaşlarımla konuları tartışırım',
      'Yatarak okurum',
      'Sesli okurum',
      'Konuları karşılaştırırım',
      'Derinlemesine düşünürüm',
      'Yeni dersten önce gözden geçiririm',
      'Paragraftan sonra tekrar ederim',
      'Boş zamanlarda okurum',
      'Kütüphane kitaplarını kullanırım',
      'Okuldaki materyalleri okurum',
    ],
  },
  procrastination: {
    label: 'Akademik Erteleme Ölçeği',
    questions: [
      'İşleri gereksiz yere geciktiririm',
      'Başlamayı ertelerim',
      'Son dakikaya kadar beklerim',
      'Zor kararları geciktiririm',
      'Alışkanlık düzeltmeyi ertelerim',
      'Yapmamak için bahane bulurum',
      'Sıkıcı işlere de zaman ayırırım',
      'İflah olmaz zaman avaresiyim',
      'Zamanımı boşa harcıyorum',
      'Zoru ertelemenin gerekli olduğuna inanırım',
      'Söz verir sonra ayak sürürüm',
      'Eylem planıma uyarım',
      'Nefret etsem de harekete geçemem',
      'Önemli işleri vaktinden önce bitiririm',
      'Önemini bilsem de harekete geçemem',
      'Bir şeyi yarına bırakmak benim tarzım değil',
    ],
  },
  stress: {
    label: 'Algılanan Stres Ölçeği (PSS)',
    questions: [
      'Her şeyin yolunda olduğunu hissettim',
      'İşlerin istediğim gibi gittiğini hissettim',
      'Sorunlarla başa çıkma konusunda güvendim',
      'Kızgınlıkları kontrol edebildim',
      'Beklenmedik olay nedeniyle altüst oldum',
      'Önemli şeyleri kontrol edemediğimi hissettim',
      'Zorlukların üstesinden gelemeyeceğimi hissettim',
      'Sinirli ve stresli hissettim',
      'Her şeyle başa çıkamadığımı fark ettim',
      'Kontrolüm dışındaki şeyler yüzünden öfkelendim',
    ],
  },
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
      Object.keys(SURVEYS).forEach(k => completedCounts[k] = 0);
      surveysSnap.docs.forEach(d => {
        const data = d.data();
        Object.keys(SURVEYS).forEach(k => {
          if (data.completed?.[k]) completedCounts[k]++;
        });
      });
      setStats({ totalUsers: usersSnap.size, totalSurveys: surveysSnap.size, completedCounts });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Tüm ölçekleri güzel Excel olarak indir (her ölçek ayrı sheet)
  const downloadExcel = async (surveyId = null) => {
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
        const rows = [];

        // Başlık satırı
        const header = ['No', 'İsim', 'Email', 'Fakülte', 'Bölüm', ...survey.questions.map((_, i) => `S${i + 1}`)];
        rows.push(header);

        // Veri satırları
        let rowNo = 1;
        surveysSnap.docs.forEach(doc => {
          const data = doc.data();
          if (!data[id] || !data.completed?.[id]) return;
          const answers = data[id];
          const user = userMap[doc.id] || { isim: doc.id, email: '', fakulte: '', bolum: '' };
          const maxQ = survey.questions.length;
          const row = [rowNo++, user.isim, user.email, user.fakulte, user.bolum];
          for (let i = 0; i < maxQ; i++) row.push(answers[i] ?? '');
          rows.push(row);
        });

        if (rows.length === 1) {
          rows.push(['', 'Henüz yanıt yok', '', '', '']);
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Kolon genişlikleri
        const colWidths = [
          { wch: 5 },  // No
          { wch: 20 }, // İsim
          { wch: 25 }, // Email
          { wch: 20 }, // Fakülte
          { wch: 20 }, // Bölüm
          ...survey.questions.map(() => ({ wch: 6 })),
        ];
        ws['!cols'] = colWidths;

        // Sheet adı max 31 karakter
        const sheetName = survey.label.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      // Özet sheet ekle
      if (!surveyId) {
        const summaryRows = [['Ölçek', 'Yanıt Sayısı']];
        Object.entries(SURVEYS).forEach(([id, s]) => {
          let count = 0;
          surveysSnap.docs.forEach(d => { if (d.data().completed?.[id]) count++; });
          summaryRows.push([s.label, count]);
        });
        summaryRows.push(['']);
        summaryRows.push(['Toplam Kullanıcı', usersSnap.size]);
        summaryRows.push(['Toplam Anket Dolduran', surveysSnap.size]);
        summaryRows.push(['İndirme Tarihi', new Date().toLocaleDateString('tr-TR')]);

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
        summaryWs['!cols'] = [{ wch: 35 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');
      }

      const fileName = surveyId
        ? `${SURVEYS[surveyId].label}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `tum_anket_sonuclari_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);
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

        {stats && (
          <div className="glass-card p-4">
            <p className="section-label mb-3">Ölçek Bazında Yanıt Sayıları</p>
            <div className="flex flex-col gap-2">
              {Object.entries(SURVEYS).map(([id, s]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--mist)' }}>{s.label}</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--amber)' }}>
                    {stats.completedCounts[id] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => downloadExcel()} disabled={loading}
          className="btn-primary py-3 flex items-center justify-center gap-2">
          {loading
            ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            : <><Download size={16} /> Tüm Ölçekleri Excel'e İndir (.xlsx)</>}
        </button>

        <div className="glass-card p-5">
          <p className="section-label mb-4">Ölçek Bazında İndir</p>
          <div className="flex flex-col gap-2">
            {Object.entries(SURVEYS).map(([id, s]) => (
              <div key={id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(245,237,216,0.03)', border: '1px solid rgba(245,237,216,0.06)' }}>
                <div>
                  <p className="text-sm font-medium text-cream">{s.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                    {s.questions.length} madde
                    {stats ? ` · ${stats.completedCounts[id] || 0} yanıt` : ''}
                  </p>
                </div>
                <button onClick={() => downloadExcel(id)} disabled={loading}
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
