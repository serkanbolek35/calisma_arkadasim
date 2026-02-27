import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './PublicLayout';

const AuthLayout = ({ children, title, subtitle, footerText, footerLink, footerLinkText }) => (
  <div className="min-h-screen bg-ink flex flex-col">
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 right-0 w-1/2 h-1/2"
        style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(232,160,32,0.05) 0%, transparent 60%)' }} />
    </div>
    <header className="relative z-10 px-6 py-6">
      <Logo />
    </header>
    <main className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8 md:p-10"
          style={{ background: 'rgba(245,237,216,0.04)', border: '1px solid rgba(245,237,216,0.1)' }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-cream mb-2">{title}</h1>
            {subtitle && <p className="text-sm" style={{ color: 'var(--mist)' }}>{subtitle}</p>}
          </div>
          {children}
        </div>
        {footerText && (
          <p className="text-center mt-6 text-sm" style={{ color: 'var(--mist)' }}>
            {footerText}{' '}
            <Link to={footerLink} className="font-medium" style={{ color: 'var(--amber)' }}>
              {footerLinkText}
            </Link>
          </p>
        )}
        <p className="text-center mt-3 text-xs" style={{ color: 'rgba(138,154,170,0.4)' }}>
          Sadece .edu.tr uzantılı e-postalar kabul edilir
        </p>
      </div>
    </main>
  </div>
);

export default AuthLayout;
