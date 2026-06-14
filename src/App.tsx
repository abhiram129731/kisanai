import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { FarmProvider } from './context/FarmContext';

// Components
import { Layout } from './components/Layout';

// Layouts
import { PublicLayout } from './components/PublicLayout';

// Public pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Features } from './pages/public/Features';
import { CommunityPreview } from './pages/public/CommunityPreview';
import { ContactUs } from './pages/public/ContactUs';
import { FAQ } from './pages/public/FAQ';
import { Login } from './pages/public/Login';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { Terms } from './pages/public/Terms';

// Protected pages
import { Onboarding } from './pages/protected/Onboarding';
import { Dashboard } from './pages/protected/Dashboard';
import { MyFarms } from './pages/protected/MyFarms';
import { Weather } from './pages/protected/Weather';
import { DiseaseDetection } from './pages/protected/DiseaseDetection';
import { AICopilot } from './pages/protected/AICopilot';
import { Cashbook } from './pages/protected/Cashbook';
import { Community } from './pages/protected/Community';
import { Reports } from './pages/protected/Reports';
import { Profile } from './pages/protected/Profile';
import { AdminDashboard } from './pages/protected/AdminDashboard';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-secondary)' }}>
        <span className="spinner-loader"></span>
        <style>{`
          .spinner-loader {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border-color);
            border-bottom-color: var(--color-primary);
            border-radius: 50%;
            display: inline-block;
            animation: rotation 1s linear infinite;
          }
          @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-secondary)' }}>
        <span className="spinner-loader"></span>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Onboarding Guard (Redirects if already onboarded)
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Guard (Redirects away from landing/login if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={user.isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Shared Header & Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/community-preview" element={<CommunityPreview />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Login bypasses onboarding if already setup */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farms" element={<MyFarms />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/disease" element={<DiseaseDetection />} />
          <Route path="/copilot" element={<AICopilot />} />
          <Route path="/cashbook" element={<Cashbook />} />
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <FarmProvider>
          <AppContent />
        </FarmProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
