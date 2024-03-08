import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const apiKey = localStorage.getItem('api_key');
  
  if (!apiKey) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;