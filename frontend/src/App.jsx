import { Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage.jsx'
import AuthCallback from './pages/auth/AuthCallback.jsx'
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard.jsx'
import NotFoundPage from './pages/notFoundPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<CaregiverDashboard />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
