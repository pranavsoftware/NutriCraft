import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Leaf } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-700">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4 shadow-sm animate-pulse">
          <Leaf className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
          <span>Authenticating with NutriCraft...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user profile is not completed, enforce completing profile first
  if (user && user.isProfileComplete === false && location.pathname !== '/dashboard/profile') {
    return <Navigate to="/dashboard/profile" state={{ profileSetupRequired: true }} replace />;
  }

  return <>{children}</>;
}
