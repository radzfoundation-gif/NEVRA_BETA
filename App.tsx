import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import Home from './components/pages/Home';
import ChatInterface from './components/pages/ChatInterface';
import SharedChat from './components/pages/SharedChat';
import SignInPage from './components/auth/SignInPage';
import SignUpPage from './components/auth/SignUpPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import NicknamePage from './components/auth/NicknamePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SurveyPage from './components/pages/SurveyPage';
import ErrorBoundary from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import DynamicBackground from './components/ui/DynamicBackground';

// UserSyncProvider removed - Supabase handles user data directly
const UserSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <DynamicBackground />
      <Routes>
        <Route path="/" element={<Home />} />
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