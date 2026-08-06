import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './pages/auth/AuthPage.jsx';
import AuthCallback from './pages/auth/AuthCallback.jsx';
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard.jsx';
import NotFoundPage from './pages/notFoundPage.jsx';
import ElderlyOverview from './pages/caregiver/ElderlyOverview.jsx';
import Prescriptions from './pages/caregiver/Prescriptions.jsx';
import PrescriptionReview from './pages/caregiver/PrescriptionReview.jsx';
import ElderlyProfile from './pages/caregiver/ElderlyProfile.jsx';
import AlertsHistory from './pages/caregiver/AlertsHistory.jsx';
import ElderlyHome from './pages/elderly/Home.jsx';
import { AuthProvider, useAuth } from './auth/authProvider.jsx';

function RequireAuth({ children }) {
  const { isAuthenticated, loading, user, profileStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f5] font-bold text-[#176c3a]">
        Đang kiểm tra thông tin đăng nhập...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    user?.role === 'caregiver' &&
    profileStatus &&
    profileStatus.isComplete === false &&
    location.pathname !== '/profile'
  ) {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

function getDefaultTarget(user, profileStatus) {
  if (user?.role === 'elderly') return '/elderly-home';
  if (profileStatus?.isComplete === false) return '/profile';
  return '/dashboard';
}

function GuestOnly({ children }) {
  const { isAuthenticated, loading, user, profileStatus } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f5] font-bold text-[#176c3a]">
        Đang kiểm tra thông tin đăng nhập...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultTarget(user, profileStatus)} replace />;
  }

  return children;
}

function RootRedirect() {
  const { isAuthenticated, loading, user, profileStatus } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f5] font-bold text-[#176c3a]">
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultTarget(user, profileStatus)} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<GuestOnly><AuthPage /></GuestOnly>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<RequireAuth><CaregiverDashboard /></RequireAuth>} />
        <Route path="/elderly-overview" element={<RequireAuth><ElderlyOverview /></RequireAuth>} />
        <Route path="/elderly-home" element={<RequireAuth><ElderlyHome /></RequireAuth>} />
        <Route path="/prescriptions" element={<RequireAuth><Prescriptions /></RequireAuth>} />
        <Route path="/prescription-review" element={<RequireAuth><PrescriptionReview /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ElderlyProfile /></RequireAuth>} />
        <Route path="/alerts-history" element={<RequireAuth><AlertsHistory /></RequireAuth>} />
        <Route path="/caregiver/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/caregiver/elderly-overview" element={<Navigate to="/elderly-overview" replace />} />
        <Route path="/caregiver/prescriptions" element={<Navigate to="/prescriptions" replace />} />
        <Route path="/caregiver/prescription-review" element={<Navigate to="/prescription-review" replace />} />
        <Route path="/caregiver/alerts-history" element={<Navigate to="/alerts-history" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
