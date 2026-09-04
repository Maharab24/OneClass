import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { auth } = useAuth();

  if (!auth) {
    return <Navigate to="/select-role" replace />;
  }

  if (requiredRole && auth.role !== requiredRole) {
    return <Navigate to="/select-role" replace />;
  }

  return children;
}
