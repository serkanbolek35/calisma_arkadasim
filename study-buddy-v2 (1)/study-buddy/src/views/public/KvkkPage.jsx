import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function KvkkPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-3xl mx-auto px-6">
        <p className="section-label mb-3">Hukuki</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-8">KVKK Aydınlatma Metni</h1>
        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{color:'var(--mist)'}}>
          {[
            {t:'Veri Sorumlusu',c:'6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla platform işleticisi hareket etmektedir.'},
            {t:'İşlenen Kişisel Veriler',c:'Ad-soyad, e-posta adresi, fakülte ve bölüm bilgileri, kampüs konumu ve çalışma tercihleri işlenmektedir.'},
            {t:'İşleme Amaçları',c:'Veriler; eşleştirme hizmetinin sunulması, platform güvenliğinin sağlanması ve akademik araştırma amaçları doğrultusunda işlenmektedir.'},
            {t:'Haklarınız',c:'KVK Kanunu\'nun 11. maddesi kapsamında; kişisel verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için iletişim formunu kullanabilirsiniz.'},
          ].map(({t,c})=>(
            <div key={t} className="glass-card p-6">
              <h3 className="font-display text-lg font-semibold text-cream mb-3">{t}</h3>
              <p>{c}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
