import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = lazy(() => import('../views/public/LandingPage'));
const AboutPage = lazy(() => import('../views/public/AboutPage'));
const HowItWorksPage = lazy(() => import('../views/public/HowItWorksPage'));
const FaqPage = lazy(() => import('../views/public/FaqPage'));
const ContactPage = lazy(() => import('../views/public/ContactPage'));
const PrivacyPage = lazy(() => import('../views/public/PrivacyPage'));
const TermsPage = lazy(() => import('../views/public/TermsPage'));
const KvkkPage = lazy(() => import('../views/public/KvkkPage'));
const LoginPage = lazy(() => import('../views/auth/LoginPage'));
const RegisterPage = lazy(() => import('../views/auth/RegisterPage'));
const EmailVerifyPage = lazy(() => import('../views/auth/EmailVerifyPage'));
const ForgotPasswordPage = lazy(() => import('../views/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../views/auth/ResetPasswordPage'));
const AccountActivatedPage = lazy(() => import('../views/auth/AccountActivatedPage'));
const OnboardingPage = lazy(() => import('../views/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('../views/app/DashboardPage'));
const MatchesPage = lazy(() => import('../views/app/MatchesPage'));
const SessionsPage = lazy(() => import('../views/app/SessionsPage'));
const ProgressPage = lazy(() => import('../views/app/ProgressPage'));
const SurveyPage = lazy(() => import('../views/app/SurveyPage'));
const StudyRequestPage = lazy(() => import('../views/app/StudyRequestPage'));
const ChatsListPage = lazy(() => import('../views/app/ChatsListPage'));
const ChatPage = lazy(() => import('../views/app/ChatPage'));
const ProfilePage = lazy(() => import('../views/app/ProfilePage'));
const NotificationsPage = lazy(() => import('../views/app/NotificationsPage'));
const NotFoundPage = lazy(() => import('../views/system/NotFoundPage'));

const Spinner = () => (
  <div className="min-h-screen bg-ink flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'rgba(232,160,32,0.3)', borderTopColor: 'var(--amber)' }} />
  </div>
);

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { currentUser, isOnboardingComplete, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!currentUser) return <Navigate to="/giris" replace />;
  if (!currentUser.emailVerified) return <Navigate to="/email-dogrula" replace />;
  if (requireOnboarding && !isOnboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { currentUser, isOnboardingComplete, loading } = useAuth();
  if (loading) return <Spinner />;
  if (currentUser) {
    if (!currentUser.emailVerified) return <Navigate to="/email-dogrula" replace />;
    if (!isOnboardingComplete) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/hakkimizda" element={<AboutPage />} />
          <Route path="/nasil-calisir" element={<HowItWorksPage />} />
          <Route path="/sss" element={<FaqPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/gizlilik" element={<PrivacyPage />} />
          <Route path="/kullanim-sartlari" element={<TermsPage />} />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="/giris" element={<AuthRoute><LoginPage /></AuthRoute>} />
          <Route path="/kayit" element={<AuthRoute><RegisterPage /></AuthRoute>} />
          <Route path="/email-dogrula" element={<EmailVerifyPage />} />
          <Route path="/email-dogrulama-basarili" element={<AccountActivatedPage />} />
          <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
          <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><OnboardingPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/istekler" element={<ProtectedRoute><StudyRequestPage /></ProtectedRoute>} />
          <Route path="/sohbetler" element={<ProtectedRoute><ChatsListPage /></ProtectedRoute>} />
          <Route path="/sohbet/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/eslesmeler" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
          <Route path="/oturumlar" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
          <Route path="/ilerleme" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/anket" element={<ProtectedRoute><SurveyPage /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/bildirimler" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profil/:uid" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
