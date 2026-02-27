// ForgotPasswordPage
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { requestPasswordReset } from '../../services/auth.service';
import { isEduEmail } from '../../utils/validators';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEduEmail(email)) { setError('Sadece .edu.tr uzantılı e-posta kabul edilir.'); return; }
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch (_) {}
    setSent(true);
    setLoading(false);
  };

  if (sent) return (
    <AuthLayout title="E-posta Gönderildi">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(58,138,90,0.1)', border: '1px solid rgba(58,138,90,0.2)' }}>
          <CheckCircle2 size={36} style={{ color: '#3A8A5A' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--mist)' }}>
          Eğer <strong className="text-cream">{email}</strong> sistemde kayıtlıysa,
          şifre sıfırlama bağlantısı gönderildi.
        </p>
        <Link to="/giris" className="btn-primary px-6 py-3 flex items-center gap-2">
          <ArrowLeft size={16} /> Giriş Sayfasına Dön
        </Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Şifreni Sıfırla" subtitle="E-postanı gir, sıfırlama bağlantısı gönderelim."
      footerText="Şifreni hatırladın mı?" footerLink="/giris" footerLinkText="Giriş Yap →">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <p className="text-sm p-3 rounded-xl" style={{ background: 'rgba(200,64,64,0.1)', color: '#E87070' }}>{error}</p>}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>E-posta</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--mist)' }} />
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="ad.soyad@uni.edu.tr" className="input-field pl-10" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
