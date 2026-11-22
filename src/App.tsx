/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub — Main Application Component
 * Tagline: Learn • Share • Verify
 * Installable PWA with Clay and Kaolin design system.
 * Implements URL hash navigation, protected access boundaries,
 * dedicated authentication view, and Stage 6 PWA installation experience.
 */

import { CheckCircle2, Download, LogIn, MessageSquare, UserPlus } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useCallback, useEffect, useState } from 'react';
import { ApiClient } from './lib/api.ts';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { AuthView } from './components/auth/AuthView.tsx';
import { ChangePasswordView } from './components/auth/ChangePasswordView.tsx';
import { ResetPasswordView } from './components/auth/ResetPasswordView.tsx';
import { ContributorApplicationModal } from './components/auth/ContributorApplicationModal.tsx';
import { ProtectedBoundary } from './components/auth/ProtectedBoundary.tsx';
import { AppLogoIcon } from './components/common/AppLogo.tsx';
import { DashboardDispatcher } from './components/dashboard/DashboardDispatcher.tsx';
import { DocumentLibraryView } from './components/documents/DocumentLibraryView.tsx';
import { FeedbackModal } from './components/feedback/FeedbackModal.tsx';
import { MobileNav } from './components/layout/MobileNav.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { OfflineBanner } from './components/layout/OfflineBanner.tsx';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner.tsx';
import { PWAInstallModal } from './components/pwa/PWAInstallModal.tsx';
import { QuizSystemView } from './components/quizzes/QuizSystemView.tsx';
import { Button } from './components/ui/Button.tsx';
import { Modal } from './components/ui/Modal.tsx';
import { VerificationOnboarding } from './components/student/VerificationOnboarding.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider, usePWA } from './context/PWAContext.tsx';

const VISITOR_ONBOARDING_DISMISSED_KEY = 'tustudyhub_visitor_onboarding_dismissed_v1';

/**
 * Extracts normalized active tab and optional parameters from window.location.hash
 */
function parseHash(hash: string): { tab: string; token?: string } {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { tab: 'library' };

  const [basePath, queryString] = clean.split('?');

  if (basePath.startsWith('verify')) {
    if (queryString && queryString.includes('token=')) {
      const match = queryString.match(/token=([^&]+)/);
      return { tab: 'verify', token: match ? decodeURIComponent(match[1]) : undefined };
    }
    const parts = basePath.split('/');
    if (parts.length > 1 && parts[1]) {
      return { tab: 'verify', token: decodeURIComponent(parts[1]) };
    }
    return { tab: 'verify' };
  }

  const validTabs = ['library', 'quizzes', 'verify', 'dashboard', 'admin', 'login', 'register'];
  if (validTabs.includes(basePath)) {
    return { tab: basePath === 'admin' ? 'dashboard' : basePath };
  }

  return { tab: 'library' };
}

function TuStudyHubMain() {
  const { user, role, loading: authLoading } = useAuth();
  const { isManualModalOpen, closeManualGuide, promptInstall } = usePWA();

  // --- Global Student Verification State ---
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [verifLoading, setVerifLoading] = useState(true);

  // Hash-based route state
  const initialRoute = parseHash(typeof window !== 'undefined' ? window.location.hash : '');
  const [activeTab, setActiveTab] = useState<string>(initialRoute.tab);
  const [activeCourseFilter, setActiveCourseFilter] = useState<string | null>(null);
  const [activeVerifyToken, setActiveVerifyToken] = useState<string | null>(initialRoute.token || null);
  const [returnDestination, setReturnDestination] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [contributorModalOpen, setContributorModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [visitorOnboardingOpen, setVisitorOnboardingOpen] = useState(false);

  // --- FIXED: Global Student Verification Check ---
  useEffect(() => {
    const checkVerification = async () => {
      setVerifLoading(true); // Always reset loading when user changes
      if (user?.role === 'STUDENT') {
        try {
          const res = await ApiClient.request<any>('/api/v1/verification/status');
          if (res.success) {
            setVerificationStatus(res.data);
          } else {
            setVerificationStatus(null);
          }
        } catch (error) {
          console.error('Verification check failed:', error);
          setVerificationStatus(null);
        }
      } else {
        // Non-students don't need verification
        setVerificationStatus(null);
      }
      setVerifLoading(false);
    };

    // Run the check every time the user object changes (e.g., after login/logout)
    if (user) {
      checkVerification();
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || user || activeTab === 'login' || activeTab === 'register') return;
    try {
      if (window.localStorage.getItem(VISITOR_ONBOARDING_DISMISSED_KEY) === 'true') return;
    } catch {
      // The onboarding remains available for this visit if storage is unavailable.
    }
    setVisitorOnboardingOpen(true);
  }, [authLoading, user, activeTab]);

  useEffect(() => {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const route = parseHash(window.location.hash);
      setActiveTab(route.tab);
      if (route.token) {
        setActiveVerifyToken(route.token);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = '#library';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToTab = useCallback((tab: string, token?: string | null) => {
    setActiveCourseFilter(null);
    if (tab === 'verify' && token) {
      setActiveVerifyToken(token);
      window.location.hash = `#verify?token=${encodeURIComponent(token)}`;
    } else {
      window.location.hash = `#${tab}`;
    }
  }, []);

  const handleTakeCourseQuizzes = (courseId: string) => {
    setActiveCourseFilter(courseId);
    navigateToTab('quizzes');
  };

  const handleNavigateToVerify = (token: string) => {
    navigateToTab('verify', token);
  };

  const handleNavigateToAuth = (mode: 'signin' | 'register' = 'signin', destination?: string | null) => {
    if (destination) {
      setReturnDestination(destination);
    }
    window.location.hash = mode === 'register' ? '#register' : '#login';
  };

  const dismissVisitorOnboarding = () => {
    setVisitorOnboardingOpen(false);
    try {
      window.localStorage.setItem(VISITOR_ONBOARDING_DISMISSED_KEY, 'true');
    } catch {
      // Dismissal is kept for the current visit when storage is unavailable.
    }
  };

  const handleAuthSuccess = (targetDest?: string | null) => {
    dismissVisitorOnboarding();
    const dest = targetDest || returnDestination;
    setReturnDestination(null);

    if (dest === 'admin') {
      if (user && ['LECTURER', 'MODERATOR', 'ADMINISTRATOR'].includes(user.role)) {
        navigateToTab('admin');
        return;
      }
      navigateToTab('library');
      return;
    }

    if (dest && ['library', 'quizzes', 'verify'].includes(dest)) {
      navigateToTab(dest);
      return;
    }

    navigateToTab('library');
  };

  // ========================================================================
  // GLOBAL STUDENT VERIFICATION BLOCK
  // If the user is a student, auth is loaded, and they are NOT verified,
  // show ONLY the verification screen. This blocks ALL other tabs.
  // ========================================================================
  if (user?.role === 'STUDENT' && !verifLoading && verificationStatus?.verificationStatus !== 'VERIFIED') {
    return (
      <div className="min-h-screen bg-[#F7F5F1] flex flex-col font-sans selection:bg-[#F7E4D0] selection:text-[#8A3E12]">
        <OfflineBanner />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <VerificationOnboarding />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] text-[#1C1A17] flex flex-col font-sans selection:bg-[#F7E4D0] selection:text-[#8A3E12]">
      <OfflineBanner />

      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          navigateToTab(tab);
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenContributorModal={() => setContributorModalOpen(true)}
      />

      <Modal
        isOpen={visitorOnboardingOpen && !user}
        onClose={dismissVisitorOnboarding}
        title="Welcome to TuStudyHub"
        subtitle="Choose how you would like to continue"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#4A463F] leading-relaxed">
            Create an account to unlock protected course resources, submit materials, take assessments, and keep your learning history.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                dismissVisitorOnboarding();
                handleNavigateToAuth('register');
              }}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="flex-1"
            >
              Register
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                dismissVisitorOnboarding();
                handleNavigateToAuth('signin');
              }}
              leftIcon={<LogIn className="w-4 h-4" />}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#EDE9E2] pt-3">
            <button
              type="button"
              onClick={dismissVisitorOnboarding}
              className="min-h-[40px] px-3 text-sm font-medium text-[#4A463F] hover:text-[#1C1A17] underline underline-offset-2"
            >
              Continue browsing as a visitor
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { void promptInstall(); }}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Install TuStudyHub
            </Button>
          </div>
        </div>
      </Modal>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">

        {user?.must_change_password ? (
          <ChangePasswordView />
        ) : (activeTab === 'login' || activeTab === 'register' || activeTab === 'reset-password') && (
          activeTab === 'reset-password' ? (
            <ResetPasswordView />
          ) : (
            <AuthView
              initialMode={activeTab === 'login' ? 'signin' : 'register'}
              returnDestination={returnDestination}
              onSuccess={handleAuthSuccess}
              onNavigateToTab={setActiveTab}
            />
          )
        )}

        {activeTab === 'library' && (
          <DocumentLibraryView
            initialCourseFilter={activeCourseFilter}
            onNavigateToVerify={handleNavigateToVerify}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizSystemView
            initialCourseFilter={activeCourseFilter}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'verify' && (
          <ProtectedBoundary
            requiredRoles={['STUDENT', 'LECTURER', 'MODERATOR', 'ADMINISTRATOR']}
            destinationName="verification registry"
            onNavigateToLogin={(dest) => handleNavigateToAuth('signin', dest)}
            onNavigateToTab={(tab) => navigateToTab(tab)}
          >
            <div className="text-center py-12 text-[#726B62]">Verification Registry (Component placeholder)</div>
          </ProtectedBoundary>
        )}

        {activeTab === 'dashboard' && (
          <ProtectedBoundary
            requiredRoles={['STUDENT', 'LECTURER', 'MODERATOR', 'ADMINISTRATOR']}
            destinationName="dashboard"
            onNavigateToLogin={(dest) => handleNavigateToAuth('signin', dest)}
            onNavigateToTab={(tab) => navigateToTab(tab)}
            onOpenContributorModal={() => setContributorModalOpen(true)}
          >
            <DashboardDispatcher />
          </ProtectedBoundary>
        )}

      </main>

      <PWAInstallBanner />

      <PWAInstallModal
        isOpen={isManualModalOpen}
        onClose={closeManualGuide}
      />

      <MobileNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          navigateToTab(tab);
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ContributorApplicationModal
        isOpen={contributorModalOpen}
        onClose={() => setContributorModalOpen(false)}
      />

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      <footer className="hidden md:block bg-white border-t border-[#DDD8CF] py-8 text-xs text-[#726B62] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AppLogoIcon size={36} className="rounded-lg shadow-xs" />
            <div>
              <p className="font-bold text-[#1C1A17]">TuStudyHub — Learn • Share • Verify</p>
              <p className="text-[11px] text-[#726B62]">Student-focused academic verification and peer-review platform.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => user ? setFeedbackModalOpen(true) : handleNavigateToAuth('register')}
              className="flex items-center gap-1.5 text-[#8A3E12] hover:text-[#A84D16] font-bold p-1 rounded transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback & Support</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <PWAProvider>
          <TuStudyHubMain />
        </PWAProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
