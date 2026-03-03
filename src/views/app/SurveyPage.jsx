import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const SURVEYS = [
  {
    id: 'ucla',
    title: 'UCLA Yalnızlık Ölçeği',
    subtitle: 'Versiyon 3 – Okullar için Türkçe Uyarlama',
    desc: 'Aşağıdaki ifadelerin sizi ne sıklıkla tanımladığını belirtiniz.',
    labels: ['Hiç', 'Az', 'Orta', 'Sık', 'Her Zaman'],
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
    desc: 'Aşağıdaki ifadelerin okula gitme nedeninizi ne kadar yansıttığını 1 (Hiç uygun değil) ile 7 (Tamamen uygun) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5', '6', '7'],
    questions: [
      'İleride yüksek ücretli bir iş bulabilmeme yardımcı olacağı için okula gidiyorum',
      'Yeni şeyler öğrenmek istediğim için okula gidiyorum',
      'İleride seçebileceğim üniversiteye daha iyi hazırlanmamda bana yardımcı olacağı için okula gidiyorum',
      'Kendi düşüncelerimi başkalarıyla paylaşmak beni mutlu ettiği için okula gidiyorum',
      'Dürüst olmak gerekirse, bilmiyorum; aslında okulda boşa zaman harcıyormuşum gibi geliyor',
      'Çalışmalarımı (ödev, proje vb.) başarı ile tamamladığımda mutlu olduğum için okula gidiyorum',
      'Okulu bitirebileceğimi kendime kanıtlamak için okula gidiyorum',
      'Ailemin istediği iyi bir üniversiteye gidebilmek için okula gidiyorum',
      'Daha önce hiç bilmediğim şeyleri keşfetmeyi sevdiğim için okula gidiyorum',
      'Gelecekte saygın bir kuruma girebilmemi sağlayacağı için okula gidiyorum',
      'İlgi çekici metinler okumaktan zevk aldığım için okula gidiyorum',
      'İlk zamanlar okula gitmem için geçerli nedenlerim vardı; fakat şimdi devam edip etmeme konusunda kararsızım',
      'Kişisel hedeflerimi gerçekleştirerek başarılı olmak için okula gidiyorum',
      'Başarılı olduğumda kendimi önemli hissettiğim için okula gidiyorum',
      'İleride iyi bir hayat yaşamak istediğim için okula gidiyorum',
      'İlgimi çeken konularda bilgimi artırmak için okula gidiyorum',
      'Gelecekte, daha iyi bir meslek seçebilmemi sağlayacağı için okula gidiyorum',
      'Derslerde geçen konulara kendimi kaptırmaktan büyük keyif aldığım için okula gidiyorum',
      'Neden okula gittiğimi bilemiyorum, açıkçası çok da umurumda değil',
      'Derslerde zor olan etkinlikleri başarı ile yapabildiğimi görmek bana zevk verdiği için okula gidiyorum',
      'Kendime zeki olduğumu göstermek için okula gidiyorum',
      'Sınavlarda daha yüksek puanlar alabilmek için okula gidiyorum',
      'İlgimi çeken konularda beni sürekli öğrenmeye yönlendirdiği için okula gidiyorum',
      'Daha başarılı olmamı sağlayacak bilgi ve becerilerimi geliştireceği için okula gidiyorum',
      'Birbirinden farklı ve ilginç konular öğrenirken hissettiğim büyük zevkten dolayı okula gidiyorum',
      'Bilmiyorum, zaten okulda ne yaptığımı bir türlü anlayamıyorum',
      'Derslerimde başarılı olmak, beni mutlu ettiği için okula gidiyorum',
      'Derslerimde başarılı olabileceğimi kendime göstermek için okula gidiyorum',
    ],
  },
  {
    id: 'self',
    title: 'Özyeterlilik Ölçeği (SELF)',
    subtitle: 'Self-efficacy for Learning Form',
    desc: 'Her durumda ne kadar güvendiğinizi 1 (Hiç güvenmiyorum) ile 5 (Tamamen güveniyorum) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    questions: [
      'Öğretmenin ders anlatımı çok karmaşık olduğunda, bir sonraki derse girmeden önce tuttuğun notların etkili bir özetini çıkarabilir misin?',
      'Bir ders özellikle sıkıcı olduğunda iyi not tutmak için kendini motive edebilir misin?',
      'Öğretmenin ders anlatımını anlamakta zorluk çektiğinde, bir sonraki dersten önce bir arkadaşınla notlarını karşılaştırarak kafa karışıklığını açıklığa kavuşturabilir misin?',
      'Derste tuttuğun notlara çalışıyorken notlar eksik ya da kafa karıştırıcı olduğu için zorluk çektiğinde, onları her dersten sonra gözden geçirip açık bir şekilde yeniden yazabilir misin?',
      'Çok fazla konuyu kapsayan bir ders alıyorken, tuttuğun notları sadece temel olgulara indirgeyebilir misin?',
      'Yeni bir konuyu anlamaya çalışıyorken, yeni kavramları hatırlamak için eski kavramlarla yeterli bir şekilde ilişkilendirebilir misin?',
      'Zorluk çektiğin bir derste başka bir öğrenci seninle birlikte çalışma teklif ettiğinde, etkili bir çalışma ortağı olabilir misin?',
      'Arkadaşlarının ve akranlarınla ilgili problemler ödevlerinle çakıştığında, ödevlerini yapmayı sürdürebilir misin?',
      'Ders çalışıyorken kendini karamsar ve huzursuz hissettiğinde, sana verilen görevi bitirebilmek için yeterince odaklanabilir misin?',
      'Yeni bir derste kendini giderek geri kalıyor bulduğunda, açığı kapatmak için çalışma zamanını etkili bir şekilde artırabilir misin?',
      'Dönem için verilen ödevlerin beklediğinden daha uzun süre alacağını fark ettiğinde, daha fazla zaman yaratmak için diğer önceliklerini değiştirebilir misin?',
      'Soyut bir kavramı hatırlamakta zorlandığında, sınavda onu hatırlamana yardımcı edecek iyi bir örnek düşünebilir misin?',
      'Okulda sevmediğin bir dersin sınavına girmek zorunda kaldığında, iyi not almak için kendini motive etmenin bir yolunu bulabilir misin?',
      'Yaklaşan bir sınavla ilgili kendini karamsar hissettiğinde, daha iyi olmak için kendini motive etmenin bir yolunu bulabilir misin?',
      'Son sınav sonuçların kötü geldiğinde, notunu fazlasıyla düzeltebilecek gelecek sınavdan önce, çıkması muhtemel soruları belirleyebilir misin?',
      'Bir sınav için bir kavramın teknik detaylarını hatırlamaya çalışıyorken, hatırlamanı sağlayacak olan kavramlarla onları ilişkilendirmenin bir yolunu bulabilir misin?',
      'Yeni çıktığın bir sınavın kötü geçtiğini düşündüğünde, notlarına geri dönüp unutmuş olduğun bilgileri tespit edebilir misin?',
      'Bir sınav için son dakikaya kadar çalışmak zorunda kaldığını fark ettiğinde, bir sonraki sefer son dakikaya kadar sıkışmamak için sınava hazırlanmaya daha erken başlayabilir misin?',
    ],
  },
  {
    id: 'sus',
    title: 'Sistem Kullanılabilirlik Ölçeği (SUS-TR)',
    subtitle: 'Uygulama kullanım deneyiminizi değerlendirin',
    desc: 'Uygulamayı kullandıktan sonra aşağıdaki ifadelere ne kadar katıldığınızı 1 (Kesinlikle katılmıyorum) ile 5 (Kesinlikle katılıyorum) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    questions: [
      'Bu uygulamayı sıklıkla kullanmak isteyeceğimi düşünüyorum.',
      'Bu uygulamayı gereksiz bir şekilde karmaşık buldum.',
      'Bu uygulamanın kullanımının kolay olduğunu düşündüm.',
      'Bu uygulamayı kullanabilmek için daha teknik bir kişinin desteğine ihtiyaç duyacağımı düşünüyorum.',
      'Bu uygulamadaki çeşitli fonksiyonları iyi entegre edilmiş buldum.',
      'Bu uygulamada çok fazla tutarsızlık olduğunu düşündüm.',
      'Birçok insanın bu uygulamayı kullanmayı çok çabuk öğreneceğini sanıyorum.',
      'Bu uygulamanın kullanımını çok elverişsiz buldum.',
      'Bu uygulamayı kullanırken kendimden çok emin hissettim.',
      'Bu uygulamada bir şeyler yapabilmek için öncelikle bir çok şey öğrenmem gerekti.',
    ],
  },
  {
    id: 'study_habits',
    title: 'Ders Çalışma Alışkanlıkları Ölçeği',
    subtitle: 'Study Habits Questionnaire',
    desc: 'Aşağıdaki ifadelerin sizi ne kadar tanımladığını 1 (Hiçbir zaman) ile 5 (Her zaman) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
    questions: [
      'Evde çalışmak için kendi çalışma programımı hazırlarım.',
      'Çalışma programıma göre hareket ederim.',
      'Çalışma odasında düzenli olarak çalışırım.',
      'Okula gitmeden önce hemen hemen tüm konularıma hazırlanırım ve okulda işlenen her şeyi evde tekrar okurum.',
      'Özel derslere/kurslara katılırım.',
      'Radyo, insanların konuşmaları, çocukların oyunları, akrabalar, misafirler vb. tarafından rahatsız edildiğim bir yerde okuma yaparım.',
      'Ev işleriyle meşgul olduğum için yeterince ders çalışamam.',
      'Okuma sırasında önemli noktaları not alırım.',
      'Yeni kelimelerin anlamlarına bakmak için sözlük kullanırım.',
      'Çalışırken yeni kelimelere daha fazla dikkat ederim.',
      'Sınıfta anlatılanların detaylı notlarını tutarım.',
      'Okuma sırasında ortaya çıkan şüpheli noktaları, netlik kazanması için ders öğretmenine danışırım.',
      'Okurken karşılaştığım zorlukları hemen çözmeye çalışırım.',
      'Sınıfta not alırken önemli noktaları kaçırırım.',
      'Ders kitaplarından ziyade açıklayıcı yardımcı kitapları okurum.',
      'Okurken ders kitaplarımdaki önemli noktaların altını çizerim.',
      'Zorlandığım derse daha fazla dikkat ederim.',
      'Zayıf olduğum konuyu çalışmaya daha fazla zaman ayırırım.',
      'Zor dersleri çalışmaya öncelik veririm.',
      'Aynı konuyu uzun süre okurum.',
      'Sadece ilgimi çeken konuları çalışır, ilgimi çekmeyen konuları bırakırım.',
      'Konsantre bir şekilde çalışırım.',
      'Hiç ders çalışmadığımı hissederim.',
      'Okuma yaparken zihnim başka yerlere kayar.',
      'Okuduğumu anlıyorum ama hatırlamıyorum.',
      'Sınavda, soruları yazmaya başlamadan önce cevaplarını düşünürüm.',
      'Sınav zamanında gerginleşirim.',
      'Sınav zamanında gece geç saatlere kadar ders çalışırım.',
      'Sınav zamanında ders notlarını okurum.',
      'Düzenli çalışmam ama sınav zamanında önemli soruları ve tavsiyeleri alırım.',
      'Sorulmayacağını düşünerek önceki sınav sorularını hazırlamam.',
      'Tanımları, özlü sözleri, formülleri vb. anladıktan sonra ezberlerim.',
      'Okuduğum konuları arkadaşlarımla tartışırım.',
      'Yatağa uzanarak/yaslanarak okuma yaparım.',
      'Sesli (yüksek sesle) okurum.',
      'Bir konuda öğrenilen şeyleri başka bir konudakilerle karşılaştırmaya çalışırım.',
      'Okuduğum her şey üzerinde derinlemesine düşünürüm.',
      'Yeni dersleri okumaya başlamadan önce, okuduğum dersi kısaca gözden geçiririm.',
      'Bir paragrafı okuduktan sonra hemen zihnimden tekrar ederim.',
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
      'Başlamanın ne kadar önemli olduğunu bilsem de bir türlü harekete geçemem.',
      'Bir şeyi yarına bırakmak benim tarzım değildir.',
    ],
  },
  {
    id: 'stress',
    title: 'Algılanan Stres Ölçeği (PSS)',
    subtitle: 'Perceived Stress Scale',
    desc: 'Geçtiğimiz ay içinde aşağıdaki durumların ne sıklıkla yaşandığını 1 (Hiçbir zaman) ile 5 (Çok sık) arasında belirtiniz.',
    labels: ['1', '2', '3', '4', '5'],
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

const SurveyForm = ({ survey, answers, onAnswer }) => (
  <div className="flex flex-col gap-1">
    <div className="sticky top-0 z-10 hidden md:grid gap-2 px-4 py-2 rounded-xl mb-2"
      style={{ gridTemplateColumns: `1fr ${survey.labels.map(() => '52px').join(' ')}`, background: 'rgba(13,13,13,0.95)', borderBottom: '1px solid rgba(245,237,216,0.08)' }}>
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

export default function SurveyPage() {
  const { currentUser } = useAuth();
  const [activeSurvey, setActiveSurvey] = useState(null);
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

  const answered = activeSurvey ? Object.keys(answers).length : 0;
  const total = activeSurvey ? activeSurvey.questions.length : 0;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
  const allAnswered = answered === total && total > 0;

  const handleSave = async () => {
    if (!allAnswered || !activeSurvey) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'surveys', currentUser.uid), {
        [activeSurvey.id]: answers,
        completed: { ...completedSurveys, [activeSurvey.id]: true },
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setCompletedSurveys(prev => ({ ...prev, [activeSurvey.id]: true }));
      setSaved(true);
      setTimeout(() => setActiveSurvey(null), 1200);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <AppLayout title="Veri Toplama Araçları">
      {!activeSurvey ? (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-cream">Veri Toplama Araçları</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>Araştırma kapsamında 7 ölçek uygulanmaktadır.</p>
          </div>
          <div className="flex flex-col gap-3">
            {SURVEYS.map((s, i) => {
              const done = completedSurveys[s.id];
              return (
                <div key={s.id} className="glass-card p-5 flex items-center gap-4 cursor-pointer hover:border-white/15 transition-all"
                  onClick={() => { setActiveSurvey(s); setAnswers({}); setSaved(false); }}
                  style={{ opacity: done ? 0.7 : 1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: done ? 'rgba(58,138,90,0.15)' : 'rgba(232,160,32,0.12)', color: done ? '#5ABF8A' : 'var(--amber)' }}>
                    {done ? <CheckCircle2 size={18} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cream">{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>{s.subtitle} · {s.questions.length} madde</p>
                  </div>
                  {done
                    ? <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(58,138,90,0.1)', color: '#5ABF8A' }}>Tamamlandı</span>
                    : <ChevronRight size={16} style={{ color: 'var(--mist)' }} />
                  }
                </div>
              );
            })}
          </div>
          {Object.keys(completedSurveys).length === SURVEYS.length && (
            <div className="mt-6 px-6 py-4 rounded-2xl text-center"
              style={{ background: 'rgba(58,138,90,0.08)', border: '1px solid rgba(58,138,90,0.2)' }}>
              <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: '#5ABF8A' }} />
              <p className="font-display font-semibold text-cream">Tüm ölçekler tamamlandı!</p>
              <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>Katılımınız için teşekkürler.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setActiveSurvey(null)}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl glass-card hover:border-white/15 transition-all"
              style={{ color: 'var(--mist)' }}>
              <ChevronLeft size={15} /> Geri
            </button>
            <div className="flex-1">
              <p className="font-display font-semibold text-cream">{activeSurvey.title}</p>
              <p className="text-xs" style={{ color: 'var(--mist)' }}>{activeSurvey.subtitle}</p>
            </div>
            <span className="text-sm font-mono" style={{ color: 'var(--amber)' }}>{answered}/{total}</span>
          </div>
          <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(245,237,216,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--amber)' }} />
          </div>
          <div className="px-4 py-3 rounded-xl mb-4 text-sm" style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.12)', color: 'var(--mist)' }}>
            {activeSurvey.desc}
          </div>
          <SurveyForm survey={activeSurvey} answers={answers} onAnswer={(qi, val) => setAnswers(prev => ({ ...prev, [qi]: val }))} />
          <div className="sticky bottom-4 mt-6 flex justify-center">
            <button onClick={handleSave} disabled={!allAnswered || saving}
              className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg disabled:opacity-40"
              style={{ minWidth: '200px', justifyContent: 'center' }}>
              {saved ? <><CheckCircle2 size={16} /> Kaydedildi!</>
                : saving ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                : allAnswered ? '✓ Yanıtları Kaydet' : `${total - answered} soru kaldı`}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
