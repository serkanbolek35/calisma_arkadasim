import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-3xl mx-auto px-6">
        <p className="section-label mb-3">Hakkımızda</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-6">Akademik yalnızlığa <span style={{color:'var(--amber)'}}>son.</span></h1>
        <div className="glass-card p-8 mb-6 text-base leading-relaxed" style={{color:'var(--mist)'}}>
          <p className="mb-4"><strong className="text-cream">Çalışma Arkadaşını Bul</strong>, üniversite öğrencilerinin akademik motivasyonunu artırmak ve yalnızlık hissini azaltmak amacıyla geliştirilmiş bir eşleştirme platformudur.</p>
          <p className="mb-4">Araştırmalar, birlikte çalışmanın öğrenci başarısını ve motivasyonunu önemli ölçüde artırdığını göstermektedir. Ancak özellikle yeni şehirlere taşınan öğrenciler, birlikte çalışabilecekleri arkadaş bulmakta zorlanmaktadır.</p>
          <p>Platformumuz; ortak dersler, uygun saatler ve kampüs konumu gibi kriterlere göre öğrencileri eşleştirerek bu sorunu çözmeyi hedeflemektedir.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {icon:'🎯',title:'Misyonumuz',text:'Üniversite öğrencilerine akademik destek ağı oluşturarak hem başarıyı hem de sosyal refahı artırmak.'},
            {icon:'🔬',title:'Akademik Temel',text:'UCLA Yalnızlık Ölçeği ve akademik motivasyon ölçekleriyle doğrulanmış araştırma verilerine dayanmaktadır.'},
            {icon:'🔒',title:'Güvenlik',text:'Yalnızca .edu.tr e-posta adresleriyle kayıt. KVKK uyumlu veri işleme.'},
            {icon:'📊',title:'Araştırma Odaklı',text:'Öğrencilerin çalışma alışkanlıklarını ve motivasyonunu ölçen bir araştırma bileşeni içermektedir.'},
          ].map(({icon,title,text})=>(
            <div key={title} className="glass-card p-6">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'var(--mist)'}}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
