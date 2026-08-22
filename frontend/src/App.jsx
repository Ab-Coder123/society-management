import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Dashboards
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SocietyAdminDashboard from './pages/SocietyAdmin/Dashboard';
import OwnerDashboard from './pages/Owner/Dashboard';
import ResidentDashboard from './pages/Resident/Dashboard';
import SecurityDashboard from './pages/Security/Dashboard';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />


          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/society-admin/*"
            element={
              <ProtectedRoute allowedRoles={['society_admin']}>
                <SocietyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resident/*"
            element={
              <ProtectedRoute allowedRoles={['resident']}>
                <ResidentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/*"
            element={
              <ProtectedRoute allowedRoles={['security_guard']}>
                <SecurityDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
