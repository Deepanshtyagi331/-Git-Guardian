import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Or a spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="bg-gray-900 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedLayout;
