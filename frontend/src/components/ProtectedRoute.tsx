import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  component: React.ReactElement;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component, requireAdmin = false }) => {
  const { token, user, authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <div className="app-shell">
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.rol !== 'admin') {
    return <Navigate to="/habitaciones" replace />;
  }

  return component;
};

export default ProtectedRoute;
