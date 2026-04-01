import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import DynamicBackground from './components/ui/DynamicBackground';
import InstallPrompt from './components/InstallPrompt';
import SlidingCubeLoader from './components/ui/SlidingCubeLoader';

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

const Studio = React.lazy(() => import('./components/pages/Studio'));
const SkillsPage = React.lazy(() => import('./components/pages/SkillsPage'));

// UserSyncProvider removed - Supabase handles user data directly
const UserSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <>
      <DynamicBackground />
      <InstallPrompt />
      <React.Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <SlidingCubeLoader />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/redesign" element={<Home defaultMode="redesign" />} />

          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/survey" element={<SurveyPage />} />
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
        <Router>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;