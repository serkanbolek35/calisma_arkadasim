import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/layout/PublicLayout';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="font-display text-8xl font-bold mt-16 mb-2" style={{ color: 'rgba(232,160,32,0.15)' }}>404</h1>
      <p className="font-display text-3xl font-bold text-cream -mt-6 mb-4">Sayfa Bulunamadı</p>
      <p className="mb-8 text-base" style={{ color: 'var(--mist)' }}>
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="btn-primary px-6 py-3">Ana Sayfaya Dön</Link>
        <Link to="/dashboard" className="btn-outline px-6 py-3">Dashboard</Link>
      </div>
    </div>
  );
}
