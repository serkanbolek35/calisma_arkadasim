import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

// ── Ölçek tanımları ───────────────────────────────────────────
// prepost: true = ön test + son test gerekli
// postonly: true = sadece son test

const SURVEYS = [
  {
    id: 'ucla',
    title: 'UCLA Yalnızlık Ölçeği',
    subtitle: 'Versiyon 3 – Okullar için Türkçe Uyarlama',
    desc: 'Aşağıdaki ifadelerin sizi ne sıklıkla tanımladığını belirtiniz.',
    labels: ['Hiç', 'Az', 'Orta', 'Sık', 'Her Zaman'],
    prepost: true,
    questions: [
      'Hangi sıklıkta okul arkadaşlarınızla uyum içinde olduğunuzu hissediyorsunuz?',
      'Hangi sıklıkta okulda arkadaşınız olmadığını hissediyorsunuz?',
      'Hangi sıklıkta okulda yardım alabileceğiniz kimse olmadığını hissediyorsunuz?',
      'Hangi sıklıkta okulda kendinizi yalnız hissediyorsunuz?',
      'Hangi sıklıkta kendinizi okuldaki arkadaş grubunun bir parçası olarak hissediyorsunuz?',
      'Hangi sıklıkta okuldaki insanlarla ortak yönleriniz olduğunu hissediyorsunuz?',
      'Hangi sıklıkta okulda kimseye yakın olmadığınızı hissediyorsunuz?',
      'Hangi sıklıkta ilgi alanlarınızın ve düşüncelerinizin okuldaki kişiler tarafından paylaşılmadığını hissediyorsunuz?',
      'Hangi sıklıkta kendinizi dışa dönük ve arkadaş canlısı bir kişi olarak hissediyorsunuz?',
      'Kendinizi hangi sıklıkla okuldaki kişilere yakın hissediyorsunuz?',
      'Kendinizi hangi sıklıkla okulda dışlanmış olarak hissediyorsunuz?',
      'Hangi sıklıkta okuldaki ilişkilerinizin samimi olduğunu hissediyorsunuz?',
      'Hangi sıklıkta okulda kimse tarafından tanınmadığınızı hissediyorsunuz?',
      'Hangi sıklıkta okuldaki diğer insanlardan ayrı durduğunuzu hissediyorsunuz?',
      'Hangi sıklıkta okulda istediğiniz zaman arkadaş edinebileceğinizi hissediyorsunuz?',
      'Hangi sıklıkta okulda sizi gerçekten anlayan insanlar olduğunu hissediyorsunuz?',
      'Hangi sıklıkta içine kapanık olduğunuzu hissediyorsunuz?',
      'Hangi sıklıkta okulda insanlar olduğunu ama paylaştığımız bir şey olmadığını hissediyorsunuz?',
      'Hangi sıklıkta okulda konuşabileceğiniz insanlar olduğunu hissediyorsunuz?',
      'Hangi sıklıkta okulda yardım alabileceğiniz insanlar olduğunu hissediyorsunuz?',
    ],
  },
  {
    id: 'amo',
    title: 'Akademik Motivasyon Ölçeği (AMÖ)',
    subtitle: 'Türkçeye Uyarlanmış Form',
    desc: 'Aşağıdaki ifadelerin üniversiteye gitme nedeninizi ne kadar yansıttığını 1 (Hiç uygun değil) ile 7 (Tamamen uygun) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5', '6', '7'],
    prepost: true,
    questions: [
      'Sadece lise diploması ile ileride yüksek maaşlı bir iş bulamayacağım için üniversiteye gidiyorum',
      'Yeni şeyler öğrenirken haz ve tatmin duyduğum için üniversiteye gidiyorum',
      'Üniversite eğitiminin seçtiğim kariyere daha iyi hazırlanmama yardımcı olacağını düşündüğüm için üniversiteye gidiyorum',
      'Kendi fikirlerimi başkalarına ifade ederken yoğun duygular yaşadığım için üniversiteye gidiyorum',
      'Açıkçası bilmiyorum; okulda zaman kaybettiğimi hissediyorum',
      'Derslerimde kendimi aşarken duyduğum haz nedeniyle üniversiteye gidiyorum',
      'Üniversite eğitimimi tamamlayabileceğimi kendime kanıtlamak için üniversiteye gidiyorum',
      'İleride daha prestijli bir iş elde etmek için üniversiteye gidiyorum',
      'Daha önce hiç görmediğim yeni şeyleri keşfederken duyduğum haz nedeniyle üniversiteye gidiyorum',
      'Sevdiğim bir alanda iş bulabilmemi sağlayacağı için üniversiteye gidiyorum',
      'İlgi çekici metinler okurken duyduğum haz nedeniyle üniversiteye gidiyorum',
      'Eskiden üniversiteye gitmek için iyi nedenlerim vardı; ancak şimdi devam edip etmeme konusunda kararsızım',
      'Kişisel başarılarımda kendimi aşarken duyduğum haz nedeniyle üniversiteye gidiyorum',
      'Üniversitede başarılı olduğumda kendimi önemli hissettiğim için üniversiteye gidiyorum',
      'İleride iyi bir yaşam sürmek istediğim için üniversiteye gidiyorum',
      'İlgi duyduğum konular hakkında bilgimi artırırken duyduğum haz nedeniyle üniversiteye gidiyorum',
      'Kariyer seçimim konusunda daha iyi karar verebilmek için üniversiteye gidiyorum',
      'Derslerde öğrendiklerime tamamen kendimi kaptırdığımda hissettiğim haz nedeniyle üniversiteye gidiyorum',
      'Neden üniversiteye gittiğimi anlamıyorum ve açıkçası umurumda değil',
      'Zor akademik etkinlikleri gerçekleştirirken duyduğum tatmin nedeniyle üniversiteye gidiyorum',
      'Zeki bir birey olduğumu kendime göstermek için üniversiteye gidiyorum',
      'İleride daha yüksek maaş elde etmek için üniversiteye gidiyorum',
      'Eğitimim sayesinde ilgi duyduğum birçok konuda öğrenmeye devam ettiğim için üniversiteye gidiyorum',
      'Birkaç yıl daha eğitim almanın mesleki yeterliliğimi artıracağına inandığım için üniversiteye gidiyorum',
      'İlgi çekici konular hakkında okuma yaparken yaşadığım yoğun haz nedeniyle üniversiteye gidiyorum',
      'Açıkçası ne yaptığımı bilmiyorum; neden üniversitede olduğumu anlayamıyorum',
      'Akademik çalışmalarımda mükemmelliğe ulaşma sürecinde duyduğum kişisel tatmin nedeniyle üniversiteye gidiyorum',
      'Derslerimde başarılı olabileceğimi kendime göstermek için üniversiteye gidiyorum',
    ],
  },
  {
    id: 'feedback',
    title: 'Motivasyon ve Kullanıcı Geri Bildirim Anketi',
    subtitle: 'Son Test',
    desc: 'Aşağıdaki ifadelere katılım düzeyinizi ve açık uçlu soruları yanıtlayınız.',
    labels: ['1', '2', '3', '4', '5'],
    prepost: false,
    questions: [
      'Bu uygulamayı ders çalışmak için bir çalışma arkadaşı bulmak amacıyla kullanıyorum.',
      'Bu uygulamayı motivasyonumu artırmak için kullanıyorum.',
      'Bu uygulamayı yalnız çalışmamak için kullanıyorum.',
      'Bu uygulamayı sosyalleşmek için kullanıyorum.',
      'Bu uygulamayı yeni arkadaşlar edinmek için kullanıyorum.',
      'Bu uygulamayı düzenli çalışma alışkanlığı kazanmak için kullanıyorum.',
      'Uygulama, çalışma arkadaşı bulma beklentimi karşılamaktadır.',
      'Uygulama, ders çalışma motivasyonumu artırmaktadır.',
      'Uygulama sayesinde çalışma sürecim daha verimli hale gelmiştir.',
      'Uygulama sosyal etkileşim ihtiyacımı karşılamaktadır.',
      'Uygulama yalnızlık hissimi azaltmaktadır.',
      'Uygulama genel olarak beklentilerimi karşılamaktadır.',
      'Uygulamayı kullanmaya devam etmeyi düşünüyorum.',
    ],
    openQuestions: [
      'Sizce bu uygulamada geliştirilmesi gereken veya "şu özellik de eklense iyi olur" dediğiniz noktalar nelerdir?',
      'Uygulamada size gereksiz gelen veya "bu özellik olmasa daha iyi olur" dediğiniz bir özellik var mı? Varsa açıklayınız.',
      'Sizi bu uygulamayı kullanmaya iten en temel motivasyonu kendi cümlelerinizle açıklar mısınız?',
      'Uygulamayı kullanırken karşılaştığınız bir sorun veya zorluk oldu mu? Açıklayınız.',
      'Uygulama sizin ders çalışma alışkanlıklarınızı nasıl etkiledi? Açıklayınız.',
    ],
  },
  {
    id: 'sus',
    title: 'Sistem Kullanılabilirlik Ölçeği (SUS-TR)',
    subtitle: 'Son Test',
    desc: 'Aşağıdaki ifadelere ne kadar katıldığınızı 1 (Hiç Katılmıyorum) ile 5 (Tamamen Katılıyorum) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    prepost: false,
    questions: [
      'Bu sistemi sıklıkla kullanmak isteyeceğimi düşünüyorum.',
      'Bu sistemi gereksiz bir şekilde karmaşık buldum.',
      'Bu sistemin kullanımının kolay olduğunu düşündüm.',
      'Bu sistemi kullanabilmek için daha teknik bir kişinin desteğine ihtiyaç duyacağımı düşünüyorum.',
      'Bu sistemdeki çeşitli fonksiyonları iyi entegre edilmiş buldum.',
      'Bu sistemde çok fazla tutarsızlık olduğunu düşündüm.',
      'Birçok insanın bu sistemi kullanmayı çok çabuk öğreneceğini sanıyorum.',
      'Bu sistemin kullanımını çok elverişsiz buldum.',
      'Bu sistemi kullanırken kendimden çok emin hissettim.',
      'Bu sistemde bir şeyler yapabilmek için öncelikle bir çok şey öğrenmem gerekti.',
    ],
  },
  {
    id: 'study_habits',
    title: 'Ders Çalışma Alışkanlıkları Ölçeği',
    subtitle: 'Study Habits Questionnaire',
    desc: 'Aşağıdaki ifadelerin sizi ne kadar tanımladığını 1 (Hiçbir zaman) ile 5 (Her zaman) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    prepost: true,
    questions: [
      // 1. Zaman Yönetimi / Program Oluşturma
      'Evde çalışmak için kendi çalışma programımı hazırlarım.',
      'Çalışma programıma göre hareket ederim.',
      // 2. Ders Çalışma Rutini
      'Çalışma odasında düzenli olarak çalışırım.',
      'Okula gitmeden önce hemen hemen tüm konularıma hazırlanırım ve okulda işlenen her şeyi evde tekrar okurum.',
      'Özel derslere/kurslara katılırım.',
      'Radyo, insanların konuşmaları, çocukların oyunları, akrabalar, misafirler vb. tarafından rahatsız edildiğim bir yerde okuma yaparım.',
      'Ev işleriyle meşgul olduğum için yeterince ders çalışamam.',
      // 3. Not Alma ve Okuma Stratejileri
      'Okuma sırasında önemli noktaları not alırım.',
      'Yeni kelimelerin anlamlarına bakmak için sözlük kullanırım.',
      'Çalışırken yeni kelimelere daha fazla dikkat ederim.',
      'Sınıfta anlatılanların detaylı notlarını tutarım.',
      'Okuma sırasında ortaya çıkan şüpheli noktaları, netlik kazanması için ders öğretmenine danışırım.',
      'Okurken karşılaştığım zorlukları hemen çözmeye çalışırım.',
      'Sınıfta not alırken önemli noktaları kaçırırım.',
      'Ders kitaplarından ziyade açıklayıcı yardımcı kitapları (kılavuzları) okurum.',
      'Okurken ders kitaplarımdaki önemli noktaların altını çizerim.',
      // 4. Planlama / Önceliklendirme
      'Zorlandığım derse daha fazla dikkat ederim.',
      'Zayıf olduğum konuyu çalışmaya daha fazla zaman ayırırım.',
      'Zor dersleri çalışmaya öncelik veririm.',
      'Aynı konuyu uzun süre okurum.',
      'Sadece ilgimi çeken konuları çalışır, ilgimi çekmeyen konuları bırakırım.',
      // 5. Odaklanma / Konsantrasyon
      'Konsantre bir şekilde çalışırım.',
      'Hiç ders çalışmadığımı hissederim.',
      'Okuma yaparken zihnim başka yerlere kayar.',
      'Okuduğumu anlıyorum ama hatırlamıyorum.',
      // 6. Sınav Hazırlığı
      'Sınavda, soruları yazmaya başlamadan önce cevaplarını düşünürüm.',
      'Sınav zamanında gerginleşirim.',
      'Sınav zamanında gece geç saatlere kadar ders çalışırım/okurum.',
      'Sınav zamanında ders notlarını okurum.',
      'Düzenli çalışmam ama sınav zamanında önemli soruları ve tavsiyeleri alırım.',
      'Sorulmayacağını düşünerek önceki sınav sorularını hazırlamam.',
      // 7. Alışkanlıklar ve Tutumlar
      'Tanımları, özlü sözleri, formülleri vb. anladıktan sonra ezberlerim.',
      'Okuduğum konuları arkadaşlarımla tartışırım.',
      'Yatağa uzanarak/yaslanarak okuma yaparım.',
      'Sesli (yüksek sesle) okurum.',
      'Bir konuda öğrenilen şeyleri başka bir konudakilerle karşılaştırmaya çalışırım.',
      'Okuduğum her şey üzerinde derinlemesine düşünürüm.',
      'Yeni dersleri okumaya başlamadan önce, okuduğum dersi kısaca gözden geçiririm.',
      'Bir paragrafı okuduktan sonra hemen zihnimden tekrar ederim.',
      // 8. Okul veya Yüksek Öğrenim Ortamı
      'Okuldaki boş zamanlarımı okuyarak geçiririm.',
      'Kütüphanedeki kitapları kullanırım.',
      'Okulda mevcut olan gazeteleri ve diğer okuma materyallerini okurum.',
    ],
  },
  {
    id: 'procrastination',
    title: 'Akademik Erteleme Ölçeği',
    subtitle: 'Tuckman Procrastination Scale',
    desc: 'Aşağıdaki ifadelerin sizi ne kadar tanımladığını 1 (Hiç uygun değil) ile 5 (Tamamen uygun) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    prepost: true,
    questions: [
      'Önemli olsalar bile, işleri bitirmeyi gereksiz yere geciktiririm.',
      'Yapmaktan hoşlanmadığım şeylere başlamayı ertelerim.',
      'Bir teslim tarihim olduğunda son dakikaya kadar beklerim.',
      'Zor kararlar almayı geciktiririm.',
      'Çalışma alışkanlıklarımı düzeltmeyi sürekli ertelerim.',
      'Bir şeyi yapmamak için bir bahane bulmayı başarırım.',
      'Ders çalışmak gibi sıkıcı işlere bile gereken zamanı ayırırım.',
      'Ben iflah olmaz bir zaman avaresiyim (zamanı boşa harcarım).',
      'Şu an zamanımı boşa harcıyorum ve bu konuda elimden bir şey gelmiyor gibi görünüyor.',
      'Bir şey başa çıkılamayacak kadar zor olduğunda, onu ertelemenin gerekliliğine inanırım.',
      'Kendi kendime bir şeyi yapacağıma dair söz veririm ve sonra ayak sürürüm.',
      'Ne zaman bir eylem planı yapsam, ona uyarım.',
      'Başlamadığım zaman kendimden nefret etsem de bu durum beni harekete geçirmeye yetmez.',
      'Önemli işleri her zaman vaktinden önce bitiririm.',
      'Başlamanın ne kadar önemli olduğunu bilsem de bir türlü harekete geçemem (boşa dönerim).',
      'Bir şeyi yarına bırakmak benim tarzım değildir.',
    ],
  },
  {
    id: 'stress',
    title: 'Algılanan Stres Ölçeği (PSS)',
    subtitle: 'Perceived Stress Scale',
    desc: 'Geçtiğimiz ay içinde aşağıdaki durumların ne sıklıkla yaşandığını 1 (Hiçbir zaman) ile 5 (Çok sık) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    prepost: true,
    questions: [
      'Her şeyin yolunda olduğunu (her şeye hakim olduğunuzu) hissettiniz?',
      'İşlerin istediğiniz gibi gittiğini hissettiniz?',
      'Kişisel sorunlarınızla başa çıkma yeteneğiniz konusunda kendinize güven duydunuz?',
      'Hayatınızdaki kızgınlıkları/tahriş edici durumları kontrol edebildiniz?',
      'Beklenmedik bir şekilde gerçekleşen bir olay nedeniyle altüst oldunuz?',
      'Hayatınızdaki önemli şeyleri kontrol edemediğinizi hissettiniz?',
      'Zorlukların üstesinden gelemeyeceğiniz kadar biriktiğini hissettiniz?',
      'Kendinizi sinirli ve "stresli" hissettiniz?',
      'Yapmanız gereken her şeyle başa çıkamadığınızı fark ettiniz?',
      'Kontrolünüz dışındaki şeyler yüzünden öfkelendiniz?',
    ],
  },
];

// ── Ölçek formu bileşeni ──────────────────────────────────────
const SurveyForm = ({ survey, answers, onAnswer }) => (
  <div className="flex flex-col gap-1">
    <div className="sticky top-0 z-10 hidden md:grid gap-2 px-4 py-2 rounded-xl mb-2"
      style={{ gridTemplateColumns: `1fr ${survey.labels.map(() => '52px').join(' ')}`, background: 'rgba(13,13,13,0.97)', borderBottom: '1px solid rgba(245,237,216,0.08)' }}>
      <div />
      {survey.labels.map((l, i) => (
        <div key={i} className="text-center text-xs font-mono" style={{ color: 'var(--amber)' }}>{l}</div>
      ))}
    </div>
    {survey.questions.map((q, qi) => (
      <div key={qi} className="grid items-center gap-2 px-4 py-3 rounded-xl transition-all"
        style={{
          gridTemplateColumns: `1fr ${survey.labels.map(() => '52px').join(' ')}`,
          background: answers[qi] != null ? 'rgba(232,160,32,0.06)' : 'rgba(245,237,216,0.03)',
          border: '1px solid rgba(245,237,216,0.06)',
        }}>
        <p className="text-sm" style={{ color: 'var(--cream)' }}>
          <span className="text-xs mr-2 font-mono" style={{ color: 'var(--mist)' }}>{qi + 1}.</span>{q}
        </p>
        {survey.labels.map((l, li) => (
          <div key={li} className="flex flex-col items-center gap-1">
            <button onClick={() => onAnswer(qi, li + 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: answers[qi] === li + 1 ? 'var(--amber)' : 'rgba(245,237,216,0.08)',
                color: answers[qi] === li + 1 ? 'var(--ink)' : 'var(--mist)',
                border: answers[qi] === li + 1 ? 'none' : '1px solid rgba(245,237,216,0.1)',
                transform: answers[qi] === li + 1 ? 'scale(1.1)' : 'scale(1)',
              }}>{li + 1}</button>
            <span className="text-xs text-center leading-tight md:hidden" style={{ color: 'rgba(138,154,170,0.6)', fontSize: '9px' }}>{l}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ── Açık uçlu sorular ─────────────────────────────────────────
const OpenQuestionsForm = ({ questions, answers, onAnswer }) => (
  <div className="flex flex-col gap-4">
    {questions.map((q, qi) => (
      <div key={qi} className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>
          <span className="text-xs mr-2 font-mono" style={{ color: 'var(--amber)' }}>{qi + 14}.</span>{q}
        </p>
        <textarea
          value={answers[`open_${qi}`] || ''}
          onChange={e => onAnswer(`open_${qi}`, e.target.value)}
          placeholder="Yanıtınızı yazınız..."
          rows={3}
          className="input-field resize-none text-sm"
          style={{ background: 'rgba(245,237,216,0.05)' }} />
      </div>
    ))}
  </div>
);

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function SurveyPage() {
  const { currentUser } = useAuth();
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [activePhase, setActivePhase] = useState(null); // 'pre' | 'post'
  const [answers, setAnswers] = useState({});
  const [completedSurveys, setCompletedSurveys] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'surveys', currentUser.uid)).then(snap => {
      if (snap.exists()) setCompletedSurveys(snap.data().completed || {});
    });
  }, [currentUser]);

  const isCompleted = (surveyId, phase) => {
    if (phase === 'pre') return !!completedSurveys[`${surveyId}_pre`];
    if (phase === 'post') return !!completedSurveys[`${surveyId}_post`];
    return !!completedSurveys[surveyId];
  };

  const handleOpen = (survey, phase) => {
    setActiveSurvey(survey);
    setActivePhase(phase);
    setAnswers({});
    setSaved(false);
  };

  const handleAnswer = (qi, val) => setAnswers(prev => ({ ...prev, [qi]: val }));

  const totalQuestions = activeSurvey
    ? activeSurvey.questions.length
    : 0;

  const answeredCount = activeSurvey
    ? Object.keys(answers).filter(k => !k.startsWith('open_')).length
    : 0;

  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const storageKey = activeSurvey
    ? (activeSurvey.prepost ? `${activeSurvey.id}_${activePhase}` : activeSurvey.id)
    : null;

  const handleSave = async () => {
    if (!allAnswered || !activeSurvey) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'surveys', currentUser.uid), {
        [storageKey]: answers,
        completed: { ...completedSurveys, [storageKey]: true },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCompletedSurveys(prev => ({ ...prev, [storageKey]: true }));
      setSaved(true);
      setTimeout(() => { setActiveSurvey(null); setActivePhase(null); }, 1200);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Tüm tamamlananları say
  const totalRequired = SURVEYS.reduce((acc, s) => acc + (s.prepost ? 2 : 1), 0);
  const totalDone = Object.keys(completedSurveys).length;

  // ── Aktif anket ekranı ──
  if (activeSurvey) {
    const phaseLabel = activePhase === 'pre' ? 'Ön Test' : activePhase === 'post' ? 'Son Test' : '';
    return (
      <AppLayout title="Veri Toplama Araçları">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => { setActiveSurvey(null); setActivePhase(null); }}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl glass-card hover:border-white/15 transition-all"
              style={{ color: 'var(--mist)' }}>
              <ChevronLeft size={15} /> Geri
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display font-semibold text-cream">{activeSurvey.title}</p>
                {phaseLabel && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: activePhase === 'pre' ? 'rgba(100,149,237,0.15)' : 'rgba(90,191,138,0.15)', color: activePhase === 'pre' ? '#6495ED' : '#5ABF8A' }}>
                    {phaseLabel}
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--mist)' }}>{activeSurvey.subtitle}</p>
            </div>
            <span className="text-sm font-mono" style={{ color: 'var(--amber)' }}>{answeredCount}/{totalQuestions}</span>
          </div>

          <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(245,237,216,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--amber)' }} />
          </div>

          <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.12)', color: 'var(--mist)' }}>
            {activeSurvey.desc}
          </div>

          <SurveyForm survey={activeSurvey} answers={answers} onAnswer={handleAnswer} />

          {/* Açık uçlu sorular (feedback anketi) */}
          {activeSurvey.openQuestions && (
            <div className="mt-6">
              <p className="section-label mb-4">Açık Uçlu Sorular</p>
              <OpenQuestionsForm
                questions={activeSurvey.openQuestions}
                answers={answers}
                onAnswer={handleAnswer}
              />
            </div>
          )}

          <div className="sticky bottom-4 mt-6 flex justify-center">
            <button onClick={handleSave} disabled={!allAnswered || saving}
              className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg disabled:opacity-40"
              style={{ minWidth: '200px', justifyContent: 'center' }}>
              {saved
                ? <><CheckCircle2 size={16} /> Kaydedildi!</>
                : saving
                  ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  : allAnswered ? '✓ Yanıtları Kaydet' : `${totalQuestions - answeredCount} soru kaldı`}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Liste ekranı ──
  return (
    <AppLayout title="Veri Toplama Araçları">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-cream">Veri Toplama Araçları</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>
            Araştırma kapsamında ölçekler uygulanmaktadır. Ön test ve son test olarak iki kez doldurulan ölçekler ayrıca belirtilmiştir.
          </p>
        </div>

        {/* Genel ilerleme */}
        <div className="glass-card p-4 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--mist)' }}>
              <span>Genel İlerleme</span>
              <span className="font-mono">{totalDone}/{totalRequired}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(245,237,216,0.1)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(totalDone / totalRequired * 100)}%`, background: 'var(--amber)' }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {SURVEYS.map((s, i) => {
            if (s.prepost) {
              // Ön test ve son test satırları ayrı
              const preDone = isCompleted(s.id, 'pre');
              const postDone = isCompleted(s.id, 'post');
              return (
                <div key={s.id} className="glass-card p-5"
                  style={{ border: '1px solid rgba(245,237,216,0.08)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'rgba(232,160,32,0.12)', color: 'var(--amber)' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-cream">{s.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{s.subtitle} · {s.questions.length} madde · Ön Test + Son Test</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(100,149,237,0.1)', color: '#6495ED', border: '1px solid rgba(100,149,237,0.2)' }}>
                      2× Uygulama
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Ön Test */}
                    <button onClick={() => !preDone && handleOpen(s, 'pre')}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: preDone ? 'rgba(58,138,90,0.08)' : 'rgba(100,149,237,0.06)',
                        border: `1px solid ${preDone ? 'rgba(58,138,90,0.2)' : 'rgba(100,149,237,0.2)'}`,
                        cursor: preDone ? 'default' : 'pointer',
                      }}>
                      <span className="text-xs font-medium" style={{ color: preDone ? '#5ABF8A' : '#6495ED' }}>
                        {preDone ? '✓ ' : ''}Ön Test
                      </span>
                      {!preDone && <ChevronRight size={14} style={{ color: '#6495ED' }} />}
                    </button>
                    {/* Son Test */}
                    <button
                      onClick={() => {
                        if (!preDone) return; // Ön test önce tamamlanmalı
                        if (!postDone) handleOpen(s, 'post');
                      }}
                      disabled={!preDone}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all disabled:opacity-40"
                      style={{
                        background: postDone ? 'rgba(58,138,90,0.08)' : 'rgba(90,191,138,0.06)',
                        border: `1px solid ${postDone ? 'rgba(58,138,90,0.2)' : 'rgba(90,191,138,0.2)'}`,
                        cursor: (!preDone || postDone) ? 'default' : 'pointer',
                      }}>
                      <span className="text-xs font-medium" style={{ color: postDone ? '#5ABF8A' : '#5ABF8A' }}>
                        {postDone ? '✓ ' : ''}{!preDone ? '🔒 ' : ''}Son Test
                      </span>
                      {preDone && !postDone && <ChevronRight size={14} style={{ color: '#5ABF8A' }} />}
                    </button>
                  </div>
                  {!preDone && (
                    <p className="text-xs mt-2" style={{ color: 'rgba(138,154,170,0.5)' }}>
                      Son test için önce ön testi doldurunuz.
                    </p>
                  )}
                </div>
              );
            } else {
              // Sadece tek uygulama
              const done = isCompleted(s.id, null);
              const phaseLabel = s.id === 'feedback' || s.id === 'sus' ? 'Son Test' : '';
              return (
                <div key={s.id} className="glass-card p-5 flex items-center gap-4 cursor-pointer hover:border-white/15 transition-all"
                  onClick={() => !done && handleOpen(s, null)}
                  style={{ opacity: done ? 0.7 : 1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: done ? 'rgba(58,138,90,0.15)' : 'rgba(232,160,32,0.12)', color: done ? '#5ABF8A' : 'var(--amber)' }}>
                    {done ? <CheckCircle2 size={18} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cream">{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
                      {s.subtitle} · {s.questions.length} madde{s.openQuestions ? ` + ${s.openQuestions.length} açık uçlu` : ''}
                    </p>
                  </div>
                  {phaseLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(90,191,138,0.1)', color: '#5ABF8A', border: '1px solid rgba(90,191,138,0.2)' }}>
                      {phaseLabel}
                    </span>
                  )}
                  {done
                    ? <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(58,138,90,0.1)', color: '#5ABF8A' }}>Tamamlandı</span>
                    : <ChevronRight size={16} style={{ color: 'var(--mist)', flexShrink: 0 }} />
                  }
                </div>
              );
            }
          })}
        </div>

        {totalDone === totalRequired && (
          <div className="mt-6 px-6 py-4 rounded-2xl text-center"
            style={{ background: 'rgba(58,138,90,0.08)', border: '1px solid rgba(58,138,90,0.2)' }}>
            <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: '#5ABF8A' }} />
            <p className="font-display font-semibold text-cream">Tüm ölçekler tamamlandı!</p>
            <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>Katılımınız için teşekkürler.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
