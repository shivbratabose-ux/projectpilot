import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../stores/authStore';

export default function ProtectedLayout() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden bg-brand-gray">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
