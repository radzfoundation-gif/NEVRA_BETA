import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import DynamicBackground from './components/ui/DynamicBackground';
import InstallPrompt from './components/InstallPrompt';
import RetroSplash from './components/ui/RetroSplash';
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

// UserSyncProvider removed - Supabase handles user data directly
const UserSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Check if splash has been shown in this session
    const hasShown = sessionStorage.getItem('noir_splash_shown');
    if (hasShown) {
      setShowSplash(false);
    }
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999]"
          >
            <RetroSplash onComplete={() => {
              sessionStorage.setItem('noir_splash_shown', 'true');
              setShowSplash(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

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