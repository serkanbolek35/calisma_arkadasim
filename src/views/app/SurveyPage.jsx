import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const LONELINESS = [
  'Ne sıklıkla kendinizi yakın çevrenizden kopmuş hissediyorsunuz?',
  'Ne sıklıkla sosyal desteğe ihtiyaç duyduğunuzda kimsenin olmadığını hissediyorsunuz?',
  'Ne sıklıkla yalnız olduğunuzu hissediyorsunuz?',
  'Ne sıklıkla başkalarıyla ortak bir şeyleriniz olmadığını hissediyorsunuz?',
  'Ne sıklıkla kendinizi dışlanmış hissediyorsunuz?',
];

const MOTIVATION = [
  'Bu dönem derslerim için yeterli motivasyona sahibim.',
  'Akademik hedeflerime ulaşmak için somut adımlar atıyorum.',
  'Öğrenme sürecinden keyif alıyorum.',
  'Zorlu konularla karşılaştığımda yardım isteyebiliyorum.',
  'Çalışma arkadaşlarıyla çalışmak motivasyonumu artırıyor.',
];

const PROCRASTINATION = [
  'Ödevlerimi son dakikaya bırakırım.',
  'Başlamam gereken işleri erteleme eğilimim var.',
  'Çalışmaya başlamakta güçlük çekiyorum.',
  'Yapılacaklar listemi düzenli olarak takip edebildiğimi düşünüyorum.',
  'Dikkatimi dağıtan şeylerden uzak durmakta başarılıyım.',
];

const OPTS = ['Hiçbir Zaman', 'Nadiren', 'Bazen', 'Sık Sık', 'Her Zaman'];

const Scale = ({ questions, values, onChange, color = 'var(--amber)' }) => (
  <div className="flex flex-col gap-5">
    {questions.map((q, i) => (
      <div key={i} className="glass-card p-5">
        <p className="text-sm text-cream mb-4 leading-relaxed">{i + 1}. {q}</p>
        <div className="flex gap-2 flex-wrap">
          {OPTS.map((label, v) => (
            <button key={v} type="button" onClick={() => onChange(i, v + 1)}
              className="flex-1 min-w-[80px] py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: values[i] === v + 1 ? color : 'rgba(245,237,216,0.05)',
                color: values[i] === v + 1 ? 'var(--ink)' : 'var(--mist)',
                border: values[i] === v + 1 ? 'none' : '1px solid rgba(245,237,216,0.1)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function SurveyPage() {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loneliness, setLoneliness] = useState(Array(5).fill(0));
  const [motivation, setMotivation] = useState(Array(5).fill(0));
  const [procrastination, setProcrastination] = useState(Array(5).fill(0));

  const set = (arr, setArr) => (i, v) => {
    const copy = [...arr]; copy[i] = v; setArr(copy);
  };

  const isComplete = (arr) => arr.every(v => v > 0);

  const sections = [
    { title: 'UCLA Yalnızlık Ölçeği', sub: 'Son bir ayı düşünerek yanıtlayın.', questions: LONELINESS, values: loneliness, onChange: set(loneliness, setLoneliness), color: '#E87070' },
    { title: 'Akademik Motivasyon', sub: 'Mevcut akademik durumunuzu değerlendirin.', questions: MOTIVATION, values: motivation, onChange: set(motivation, setMotivation), color: 'var(--amber)' },
    { title: 'Erteleme Eğilimi', sub: 'Çalışma alışkanlıklarınızı değerlendirin.', questions: PROCRASTINATION, values: procrastination, onChange: set(procrastination, setProcrastination), color: 'var(--sage-light)' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'surveys', currentUser.uid, 'responses', new Date().toISOString()), {
        loneliness, motivation, procrastination,
        lonelinessScore: loneliness.reduce((a, b) => a + b, 0),
        motivationScore: motivation.reduce((a, b) => a + b, 0),
        procrastinationScore: procrastination.reduce((a, b) => a + b, 0),
        completedAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (saved) return (
    <AppLayout title="Anket">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'rgba(58,138,90,0.12)', border: '2px solid rgba(58,138,90,0.3)' }}>
          <CheckCircle2 size={40} style={{ color: '#5ABF8A' }} />
        </div>
        <h2 className="font-display text-3xl font-bold text-cream mb-3">Teşekkürler! 🎉</h2>
        <p className="text-sm" style={{ color: 'var(--mist)' }}>
          Yanıtların kaydedildi. Anket sonuçların İlerleme sayfanda görünecek.
        </p>
      </div>
    </AppLayout>
  );

  const current = sections[step];
  const canNext = isComplete(current.values);

  return (
    <AppLayout title="Anket">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {sections.map((s, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(245,237,216,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: step > i ? '100%' : step === i ? '50%' : '0%', background: s.color }} />
          </div>
        ))}
      </div>

      <div className="mb-6">
        <p className="section-label mb-1">Bölüm {step + 1} / {sections.length}</p>
        <h2 className="font-display text-2xl font-bold text-cream">{current.title}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--mist)' }}>{current.sub}</p>
      </div>

      <Scale questions={current.questions} values={current.values} onChange={current.onChange} color={current.color} />

      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="btn-outline px-5 py-2.5 flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft size={16} /> Geri
        </button>
        {step < sections.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
            İleri <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={!canNext || saving}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
            {saving
              ? <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              : <><CheckCircle2 size={16} /> Anketi Tamamla</>
            }
          </button>
        )}
      </div>
    </AppLayout>
  );
}
