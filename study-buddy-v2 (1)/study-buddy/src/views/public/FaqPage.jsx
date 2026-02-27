import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
const faqs = [
  {q:'Platforma kimler kayıt olabilir?',a:'Yalnızca .edu.tr uzantılı üniversite e-posta adresleri kabul edilmektedir. Bu sayede yalnızca gerçek üniversite öğrencileri platforma erişebilir.'},
  {q:'Eşleştirme nasıl çalışır?',a:'Ortak dersler, müsait saatler ve kampüs konumuna göre uyumluluk puanı hesaplanır. Harita üzerinde yakınındaki öğrencileri görüp istek gönderebilirsin.'},
  {q:'Verilerimi kim görüyor?',a:'Kişisel verileriniz KVKK kapsamında korunmaktadır. Adın ve kampüs konumun yalnızca eşleşme yaptığın kullanıcılarla paylaşılır.'},
  {q:'Oturum planlamak zorunlu mu?',a:'Hayır. Eşleştikten sonra iletişim kurma ve oturum planlama tamamen isteğe bağlıdır.'},
  {q:'Kaç kişiyle eşleşebilirim?',a:'Birden fazla aktif eşleşmen olabilir. Ancak gerçekçi ve verimli eşleşmeler için sayıyı makul tutmanı öneririz.'},
  {q:'Platform ücretsiz mi?',a:'Evet, platform tamamen ücretsizdir ve üniversite öğrencileri için akademik amaçla geliştirilmiştir.'},
];
export default function FaqPage() {
  const [open, setOpen] = useState(null);
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="section-label mb-3">SSS</p>
          <h1 className="font-display text-4xl font-bold text-cream">Sık Sorulan Sorular</h1>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map(({q,a},i)=>(
            <div key={i} className="glass-card overflow-hidden">
              <button onClick={()=>setOpen(open===i?null:i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-body font-medium text-cream">{q}</span>
                <ChevronDown size={18} style={{color:'var(--amber)',transform:open===i?'rotate(180deg)':'none',transition:'transform 0.2s',flexShrink:0}} />
              </button>
              {open===i && <div className="px-5 pb-5 text-sm leading-relaxed" style={{color:'var(--mist)'}}>{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
