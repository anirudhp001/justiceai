import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ScrollToTop from './components/ui/ScrollToTop';
import CommandPalette from './components/ui/CommandPalette';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import FloatingVoiceButton from './components/voice/FloatingVoiceButton';
import './index.css';

// Lazy-loaded pages for optimal bundle splitting
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const FAQPage = lazy(() => import('./pages/FAQPage.jsx'));
const SamplesPage = lazy(() => import('./pages/SamplesPage.jsx'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage.jsx'));
const RightsPage = lazy(() => import('./pages/RightsPage.jsx'));
const EstimatorPage = lazy(() => import('./pages/EstimatorPage.jsx'));
const LawyerFinderPage = lazy(() => import('./pages/LawyerFinderPage.jsx'));
const CaseTrackerPage = lazy(() => import('./pages/CaseTrackerPage.jsx'));
const LegalQuizPage = lazy(() => import('./pages/LegalQuizPage.jsx'));
const LimitationCalculatorPage = lazy(() => import('./pages/LimitationCalculatorPage.jsx'));
const LegalAidCheckerPage = lazy(() => import('./pages/LegalAidCheckerPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage.jsx'));
const LawyerOnboardingPage = lazy(() => import('./pages/LawyerOnboardingPage.jsx'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ShowcasePage = lazy(() => import('./pages/ShowcasePage.jsx'));
const IntelligenceSelectionTerminal = lazy(() => import('./pages/IntelligenceSelectionTerminal.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center space-y-6 font-mono">
      <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-sm animate-spin shadow-luxe" />
      <p className="text-[10px] text-gold font-extrabold uppercase tracking-[0.4em] animate-pulse italic">
        INITIALIZING_SYSTEM_CORE...
      </p>
    </div>
  );
}

function VoiceInfrastructure({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGlobalTranscription = (text) => {
    // If not on the chat page, navigate to it and pass the text
    if (location.pathname !== '/chat') {
      navigate('/chat', { state: { voiceQuery: text } });
    } else {
      // If already on chat page, just dispatch the event
      const event = new CustomEvent('justice-ai-transcription', { detail: { text } });
      window.dispatchEvent(event);
    }
  };

  return (
    <>
      <FloatingVoiceButton onTranscription={handleGlobalTranscription} />
      {children}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <div className="grain-overlay" aria-hidden="true" />
          <ScrollToTop />
          <VoiceInfrastructure>
            <CommandPalette />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/rights" element={<RightsPage />} />
                <Route path="/estimator" element={<EstimatorPage />} />
                <Route path="/lawyers" element={<LawyerFinderPage />} />
                <Route path="/tracker" element={<CaseTrackerPage />} />
                <Route path="/quiz" element={<LegalQuizPage />} />
                <Route path="/limitation" element={<LimitationCalculatorPage />} />
                <Route path="/legal-aid" element={<LegalAidCheckerPage />} />
                <Route path="/glossary" element={<GlossaryPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/samples" element={<SamplesPage />} />
                <Route path="/lawyer-onboarding" element={<LawyerOnboardingPage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/showcase" element={<ShowcasePage />} />
                <Route path="/settings" element={<IntelligenceSelectionTerminal />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </VoiceInfrastructure>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
