import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function ContactPage() {
  const [form, setForm] = useState({name:'',email:'',subject:'',message:''});
  const [sent, setSent] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const handleSubmit = e => { e.preventDefault(); setSent(true); };
  if(sent) return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-6">
        <div className="text-center">
          <CheckCircle2 size={56} className="mx-auto mb-6" style={{color:'#3A8A5A'}} />
          <h2 className="font-display text-3xl font-bold text-cream mb-3">Mesajınız Alındı!</h2>
          <p style={{color:'var(--mist)'}}>En kısa sürede geri döneceğiz.</p>
        </div>
      </div>
    </PublicLayout>
  );
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-xl mx-auto px-6">
        <p className="section-label mb-3">İletişim</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-8">Bize Ulaşın</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[['name','Ad Soyad','Adınız'],['email','E-posta','ornek@uni.edu.tr'],['subject','Konu','Konu']].map(([k,l,p])=>(
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest uppercase" style={{color:'var(--mist)'}}>{l}</label>
              <input value={form[k]} onChange={set(k)} placeholder={p} className="input-field" type={k==='email'?'email':'text'} required />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest uppercase" style={{color:'var(--mist)'}}>Mesaj</label>
            <textarea value={form.message} onChange={set('message')} placeholder="Mesajınız..." rows={5} className="input-field resize-none" required />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5">Gönder</button>
        </form>
      </div>
    </PublicLayout>
  );
}
