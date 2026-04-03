import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import PublicLayout from '../../components/layout/PublicLayout';

const FORMSPREE_ID = 'xlgopjen';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      // 1. Formspree — serkanbolek@marun.edu.tr adresine mail gönderir
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, subject: form.subject, message: form.message }),
      });
      if (!res.ok) throw new Error('Formspree error');

      // 2. Firestore — admin panelinde de görünsün
      await addDoc(collection(db, 'contacts'), {
        ...form,
        createdAt: serverTimestamp(),
        status: 'unread',
      });

      setSent(true);
    } catch (err) {
      setError('Mesaj gönderilemedi, lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (sent) return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6">
        <div className="text-center">
          <CheckCircle2 size={56} className="mx-auto mb-6" style={{ color: '#3A8A5A' }} />
          <h2 className="font-display text-3xl font-bold text-cream mb-3">Mesajınız Alındı!</h2>
          <p style={{ color: 'var(--mist)' }}>En kısa sürede geri döneceğiz.</p>
        </div>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-xl mx-auto px-6">
        <p className="section-label mb-3">İletişim</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-2">Bize Ulaşın</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--mist)' }}>
          📧 <a href="mailto:serkanbolek@marun.edu.tr" style={{ color: 'var(--amber)' }}>serkanbolek@marun.edu.tr</a>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[['name', 'Ad Soyad', 'Adınız'], ['email', 'E-posta', 'ornek@uni.edu.tr'], ['subject', 'Konu', 'Konu']].map(([k, l, p]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>{l}</label>
              <input value={form[k]} onChange={set(k)} placeholder={p} className="input-field"
                type={k === 'email' ? 'email' : 'text'} required />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Mesaj</label>
            <textarea value={form.message} onChange={set('message')} placeholder="Mesajınız..."
              rows={5} className="input-field resize-none" required />
          </div>
          {error && <p className="text-sm" style={{ color: '#E87070' }}>{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
            {sending
              ? <><span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" /> Gönderiliyor...</>
              : 'Gönder'}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}
