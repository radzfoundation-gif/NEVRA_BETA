import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { SettingsProvider } from './hooks/useSettings';
import { UIProvider } from './components/UIContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import DynamicBackground from './components/ui/DynamicBackground';
import InstallPrompt from './components/InstallPrompt';
import SlidingCubeLoader from './components/ui/SlidingCubeLoader';
import SettingsModal from './components/settings/SettingsModal';
import ShortcutBrowser from './components/ShortcutBrowser';
import GlobalUIWrapper from './components/GlobalUIWrapper';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./components/pages/Home'));
const ChatInterface = React.lazy(() => import('./components/pages/ChatInterface'));
const SharedChat = React.lazy(() => import('./components/pages/SharedChat'));
const SignInPage = React.lazy(() => import('./components/auth/SignInPage'));
const SignUpPage = React.lazy(() => import('./components/auth/SignUpPage'));
const ForgotPasswordPage = React.lazy(() => import('./components/auth/ForgotPasswordPage'));
const NicknamePage = React.lazy(() => import('./components/auth/NicknamePage'));
const SurveyPage = React.lazy(() => import('./components/pages/SurveyPage'));
const Gallery = React.lazy(() => import('./components/pages/Gallery'));
const ArtifactsPage = React.lazy(() => import('./components/pages/ArtifactsPage'));
const ProjectsPage = React.lazy(() => import('./components/pages/ProjectsPage'));
const SkillsPage = React.lazy(() => import('./components/pages/SkillsPage'));
const PricingPage = React.lazy(() => import('./components/pages/PricingPage'));
const DocumentsPage = React.lazy(() => import('./components/pages/DocumentsPage'));
const GlassToolPage = React.lazy(() => import('./components/pages/GlassToolPage'));

const Studio = React.lazy(() => import('./components/pages/Studio'));

const AppContent: React.FC = () => {
    return (
    <>
      <DynamicBackground />
      <InstallPrompt />
      <GlobalUIWrapper />
      <React.Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <SlidingCubeLoader />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/redesign" element={<Home defaultMode="redesign" />} />

          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/artifacts" element={<ProtectedRoute><ArtifactsPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/glass-search" element={<ProtectedRoute><GlassToolPage tool="search" /></ProtectedRoute>} />
          <Route path="/glass-agents" element={<ProtectedRoute><GlassToolPage tool="agents" /></ProtectedRoute>} />
          <Route path="/glass-builder" element={<ProtectedRoute><GlassToolPage tool="builder" /></ProtectedRoute>} />
          <Route path="/glass-code" element={<ProtectedRoute><GlassToolPage tool="code" /></ProtectedRoute>} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/survey" element={<ProtectedRoute requireNickname={false}><SurveyPage /></ProtectedRoute>} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/nickname"
            element={
              <ProtectedRoute requireNickname={false}>
                <NicknamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ChatInterface />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ChatInterface />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route path="/share/:id" element={<SharedChat />} />
          <Route path="/skills" element={<ProtectedRoute><SkillsPage /></ProtectedRoute>} />
        </Routes>
      </React.Suspense>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <UIProvider>
            <Router>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </Router>
          </UIProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
