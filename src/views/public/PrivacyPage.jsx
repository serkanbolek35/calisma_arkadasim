import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-3xl mx-auto px-6">
        <p className="section-label mb-3">Gizlilik</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-8">Gizlilik Politikası</h1>
        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{color:'var(--mist)'}}>
          {[
            {t:'Toplanan Veriler',c:'Kayıt sırasında adınız, üniversite e-posta adresiniz ve profil bilgileriniz toplanmaktadır. Konum verisi yalnızca eşleştirme amacıyla kullanılır ve üçüncü taraflarla paylaşılmaz.'},
            {t:'Veri Kullanımı',c:'Toplanan veriler yalnızca eşleştirme algoritmamızı çalıştırmak ve platform kalitesini artırmak için kullanılmaktadır. Akademik araştırma amaçlı anonimleştirilmiş veriler analiz edilebilir.'},
            {t:'Veri Güvenliği',c:'Verileriniz Firebase altyapısında şifreli olarak saklanmaktadır. Yalnızca yetkili personel verilere erişebilir.'},
            {t:'Haklarınız',c:'KVKK kapsamında verilerinize erişme, düzeltme ve silme hakkına sahipsiniz. Talep için iletişim formunu kullanabilirsiniz.'},
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
