import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { loginUser, getAuthErrorMessage } from '../../services/auth.service';
import { isEduEmail } from '../../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) { setError('E-posta adresi zorunludur.'); return; }
    if (!isEduEmail(email)) { setError('Sadece .edu.tr uzantılı e-posta kabul edilir.'); return; }
    if (!password) { setError('Şifre zorunludur.'); return; }

    setLoading(true);
    try {
      await loginUser({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Tekrar hoş geldin." subtitle="Çalışma arkadaşlarınla buluşmak için giriş yap."
      footerText="Hesabın yok mu?" footerLink="/kayit" footerLinkText="Kayıt Ol →">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
            style={{ background: 'rgba(200,64,64,0.1)', border: '1px solid rgba(200,64,64,0.25)', color: '#E87070' }}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="ad.soyad@uni.edu.tr" className="input-field pl-10" />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Şifre</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type={showPass ? 'text' : 'password'} value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••" className="input-field pl-10 pr-10" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
              {showPass ? <EyeOff size={16} className="text-cream" /> : <Eye size={16} className="text-cream" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link to="/sifremi-unuttum" className="text-sm" style={{ color: 'var(--amber)' }}>
            Şifremi Unuttum
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                Giriş yapılıyor...
              </span>
            : 'Giriş Yap'
          }
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t" style={{ borderColor: 'rgba(245,237,216,0.1)' }} />
          <span className="text-xs" style={{ color: 'rgba(138,154,170,0.4)' }}>veya</span>
          <div className="flex-1 border-t" style={{ borderColor: 'rgba(245,237,216,0.1)' }} />
        </div>

        <Link to="/kayit" className="btn-outline w-full py-3 text-sm text-center">
          Yeni hesap oluştur
        </Link>
      </form>
    </AuthLayout>
  );
}
