import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth, logoutUser } from '../../services/auth.service';
import AuthLayout from '../../components/layout/AuthLayout';

export default function EmailVerifyPage() {
  const { currentUser } = useAuth();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!currentUser) return;
    setLoading(true); setError('');
    try {
      await sendEmailVerification(currentUser);
      setResent(true);
      setTimeout(() => setResent(false), 30000);
    } catch (err) {
      if (err.code === 'auth/too-many-requests') setError('Çok fazla istek. Lütfen bekleyin.');
      else setError('Gönderilemedi. Tekrar deneyin.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="E-postanı Doğrula">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.2)' }}>
          <Mail size={36} style={{ color: 'var(--amber)' }} />
        </div>
        <div>
          <p className="text-cream mb-1">Doğrulama e-postası gönderildi:</p>
          <p className="font-mono text-sm px-3 py-1.5 rounded-lg inline-block"
            style={{ background: 'rgba(232,160,32,0.1)', color: 'var(--amber)' }}>
            {currentUser?.email}
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--mist)' }}>
          E-posta kutunuzu açın ve doğrulama bağlantısına tıklayın.
          Spam klasörünü de kontrol edin.
        </p>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl w-full text-center"
            style={{ background: 'rgba(200,64,64,0.1)', border: '1px solid rgba(200,64,64,0.2)', color: '#E87070' }}>
            {error}
          </p>
        )}
        {resent && (
          <div className="flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl w-full"
            style={{ background: 'rgba(58,138,90,0.1)', border: '1px solid rgba(58,138,90,0.2)', color: '#5ABF8A' }}>
            <CheckCircle2 size={16} /> Tekrar gönderildi!
          </div>
        )}

        <button onClick={handleResend} disabled={loading || resent}
          className="btn-outline w-full py-3 text-sm flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />Gönderiliyor...</>
            : resent ? <><CheckCircle2 size={16} />Gönderildi</>
            : <><RefreshCw size={16} />Tekrar Gönder</>
          }
        </button>

        <button onClick={logoutUser} className="text-sm flex items-center gap-2"
          style={{ color: 'var(--mist)' }}>
          <LogOut size={15} /> Farklı hesapla giriş yap
        </button>
      </div>
    </AuthLayout>
  );
}
