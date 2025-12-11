import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import Home from './components/pages/Home';
import ChatInterface from './components/pages/ChatInterface';
import AgentsPage from './components/pages/AgentsPage';
import WorkflowsPage from './components/pages/WorkflowsPage';
import EnterprisePage from './components/pages/EnterprisePage';
import PricingPage from './components/pages/PricingPage';
import SignInPage from './components/auth/SignInPage';
import SignUpPage from './components/auth/SignUpPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useUserSync } from './hooks/useSupabase';
import ErrorBoundary from './components/ErrorBoundary';

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file');
}

// Component to sync Clerk user with Supabase
const UserSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useUserSync(); // Automatically sync user on mount
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <UserSyncProvider>
          <Router>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
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
                <Route path="/agents" element={<AgentsPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/enterprise" element={<EnterprisePage />} />
                <Route path="/pricing" element={<PricingPage />} />
              </Routes>
            </ErrorBoundary>
          </Router>
        </UserSyncProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
};

export default App;