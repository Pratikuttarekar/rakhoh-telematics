import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/fsm';
import { Flame } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { authRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4">
        <Flame className="w-10 h-10 text-cyan-400 animate-pulse" />
        <p className="text-xs font-mono text-cyan-400 font-bold">Authenticating Role Credentials...</p>
      </div>
    );
  }

  // 1. Unauthenticated user trying to access protected dashboard -> redirect to /login
  if (!authRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. Engineer trying to manually access /admin/dashboard -> redirect to /engineer/dashboard
  if (allowedRoles && !allowedRoles.includes(authRole)) {
    if (authRole === 'engineer') {
      return <Navigate to="/engineer/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
