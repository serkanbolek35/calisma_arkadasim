import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { registerUser, getAuthErrorMessage } from '../../services/auth.service';
import { isEduEmail, validatePassword, getPasswordStrength } from '../../utils/validators';

const Req = ({ met, text }) => (
  <div className="flex items-center gap-1.5 text-xs" style={{ color: met ? 'var(--success)' : 'var(--mist)' }}>
    <CheckCircle2 size={11} style={{ opacity: met ? 1 : 0.3 }} />{text}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setError(''); };

  const strength = form.password ? getPasswordStrength(form.password) : null;
  const pErrors = validatePassword(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.displayName.trim()) { setError('Ad Soyad zorunludur.'); return; }
    if (!isEduEmail(form.email)) { setError('Sadece .edu.tr uzantılı e-posta kabul edilir.'); return; }
    if (pErrors.length > 0) { setError('Şifre gereksinimlerini karşılamıyor.'); return; }
    if (form.password !== form.confirm) { setError('Şifreler eşleşmiyor.'); return; }
    if (!terms) { setError('Kullanım şartlarını kabul etmelisiniz.'); return; }

    setLoading(true);
    try {
      await registerUser({ email: form.email, password: form.password, displayName: form.displayName.trim() });
      navigate('/onboarding');
    } catch (err) {
      setError(getAuthErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Hesap Oluştur" subtitle="Üniversite e-postanla kayıt ol."
      footerText="Zaten hesabın var mı?" footerLink="/giris" footerLinkText="Giriş Yap →">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
            style={{ background: 'rgba(200,64,64,0.1)', border: '1px solid rgba(200,64,64,0.25)', color: '#E87070' }}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Ad Soyad</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type="text" value={form.displayName} onChange={set('displayName')}
              placeholder="Adınız Soyadınız" className="input-field pl-10" />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
            Üniversite E-postası
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="ad.soyad@uni.edu.tr" className="input-field pl-10" />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Şifre</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="En az 8 karakter" className="input-field pl-10 pr-10" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
              {showPass ? <EyeOff size={16} className="text-cream" /> : <Eye size={16} className="text-cream" />}
            </button>
          </div>

          {form.password && (
            <div>
              <div className="h-1 rounded-full mb-2" style={{ background: 'rgba(245,237,216,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: strength.width, background: strength.color }} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Req met={form.password.length >= 8} text="En az 8 karakter" />
                <Req met={/[A-Z]/.test(form.password)} text="Büyük harf" />
                <Req met={/[a-z]/.test(form.password)} text="Küçük harf" />
                <Req met={/[0-9]/.test(form.password)} text="Rakam" />
                <Req met={/[^A-Za-z0-9]/.test(form.password)} text="Özel karakter" />
              </div>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
            Şifre Tekrar
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--mist)' }} />
            <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
              placeholder="Şifrenizi tekrar girin" className="input-field pl-10" />
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer accent-yellow-500" />
          <span className="text-xs leading-relaxed" style={{ color: 'var(--mist)' }}>
            <Link to="/kullanim-sartlari" target="_blank" style={{ color: 'var(--amber)' }}>Kullanım Şartları</Link>
            {' '}ve{' '}
            <Link to="/gizlilik" target="_blank" style={{ color: 'var(--amber)' }}>Gizlilik Politikası</Link>
            'nı okudum, kabul ediyorum.
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                Kayıt oluşturuluyor...
              </span>
            : 'Kayıt Ol'
          }
        </button>
      </form>
    </AuthLayout>
  );
}
