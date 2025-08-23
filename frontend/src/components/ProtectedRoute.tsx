import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  userOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  userOnly = false 
}) => {
  const { user, isLoading } = useAuth();

  // Check if there's a token in localStorage during loading
  const hasToken = localStorage.getItem('token');
  const hasUserData = localStorage.getItem('user');

  if (isLoading || (hasToken && hasUserData && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (userOnly && user.role === 'read-only') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
