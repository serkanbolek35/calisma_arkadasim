import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function HowItWorksPage() {
  const steps = [
    {n:'01',title:'Kayıt Ol',desc:'Üniversite e-posta adresinle (.edu.tr) hızlıca kayıt ol. E-posta doğrulaması yapılır.'},
    {n:'02',title:'Profilini Tamamla',desc:'Fakülten, aldığın dersler, müsait olduğun saatler ve kampüs bilgilerini gir.'},
    {n:'03',title:'Eşleşme Bul',desc:'Harita üzerinde kampüsündeki öğrencileri gör. Ortak derslere göre uyumluluk puanı hesaplanır.'},
    {n:'04',title:'İstek Gönder',desc:'Beğendiğin profillere eşleşme isteği gönder. Kabul edilirse eşleşme aktif olur.'},
    {n:'05',title:'Oturum Planla',desc:'Eşleştiğin arkadaşınla birlikte çalışma oturumu planla. Canlı kronometre ile odak modunda çalış.'},
    {n:'06',title:'İlerlemeni Takip Et',desc:'Haftalık çalışma süreni, motivasyonunu ve tamamlanan oturumlarını grafiklerde izle.'},
  ];
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="section-label mb-3">Nasıl Çalışır?</p>
          <h1 className="font-display text-4xl font-bold text-cream">6 adımda çalışma arkadaşını bul</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map(({n,title,desc})=>(
            <div key={n} className="glass-card p-6 flex gap-4">
              <div className="font-display text-3xl font-bold flex-shrink-0" style={{color:'rgba(232,160,32,0.3)'}}>{n}</div>
              <div>
                <h3 className="font-display text-lg font-semibold text-cream mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{color:'var(--mist)'}}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
