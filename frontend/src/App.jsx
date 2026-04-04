import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ScanDetails from './pages/ScanDetails';
import AdminDashboard from './pages/AdminDashboard';

// Simple wrapper to redirect if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scans/:id" element={<ScanDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
