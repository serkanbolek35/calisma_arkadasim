import React from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen pt-32 pb-20 max-w-3xl mx-auto px-6">
        <p className="section-label mb-3">Hukuki</p>
        <h1 className="font-display text-4xl font-bold text-cream mb-8">Kullanım Şartları</h1>
        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{color:'var(--mist)'}}>
          {[
            {t:'Kabul',c:'Platforma kayıt olarak bu kullanım şartlarını kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız platformu kullanamazsınız.'},
            {t:'Uygun Kullanım',c:'Platform yalnızca akademik amaçlı kullanılmalıdır. Taciz, spam veya yanıltıcı bilgi paylaşımı kesinlikle yasaktır. İhlaller hesap kapatma ile sonuçlanabilir.'},
            {t:'Hesap Güvenliği',c:'Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız. Şüpheli aktivite fark ettiğinizde bize bildirin.'},
            {t:'Değişiklikler',c:'Platform, önceden haber vermeksizin bu şartları değiştirme hakkını saklı tutar. Değişiklikler yayınlandıktan sonra platformu kullanmaya devam etmeniz kabul anlamına gelir.'},
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
