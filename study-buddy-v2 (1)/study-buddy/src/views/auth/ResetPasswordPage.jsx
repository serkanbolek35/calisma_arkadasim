import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../services/firebase';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const oobCode = params.get('oobCode');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    if (!oobCode) { setError('Geçersiz veya süresi dolmuş bağlantı.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      setError('Bağlantı geçersiz veya süresi dolmuş. Yeni sıfırlama talebi oluşturun.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <AuthLayout title="Şifre Güncellendi">
      <div className="flex flex-col items-center text-center gap-6 py-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(58,138,90,0.1)', border: '1px solid rgba(58,138,90,0.2)' }}>
          <CheckCircle2 size={36} style={{ color: '#3A8A5A' }} />
        </div>
        <p className="text-cream">Şifreniz başarıyla güncellendi.</p>
        <Link to="/giris" className="btn-primary px-8 py-3">Giriş Yap</Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Yeni Şifre Belirle">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <p className="text-sm p-3 rounded-xl" style={{ background: 'rgba(200,64,64,0.1)', color: '#E87070' }}>{error}</p>}
        {[['Yeni Şifre', password, setPassword], ['Şifre Tekrar', confirm, setConfirm]].map(([label, val, setter]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>{label}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--mist)' }} />
              <input type={showPass ? 'text' : 'password'} value={val} onChange={e => setter(e.target.value)}
                className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                {showPass ? <EyeOff size={16} className="text-cream" /> : <Eye size={16} className="text-cream" />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
        </button>
      </form>
    </AuthLayout>
  );
}
