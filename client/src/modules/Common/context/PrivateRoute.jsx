// src/context/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { validRoles } from '../utils/SidebarMenuitem';

const PrivateRoute = ({ allowedRole, children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const isAuthenticated = !!user;
  const userRole = user?.role?.name;

  // Public routes
  if (!isAuthenticated && (allowedRole === 'public' || allowedRole === 'login')) {
    return children;
  }

  // Redirect authenticated users from login/public
  if (isAuthenticated && (allowedRole === 'public' || allowedRole === 'login')) {
    return <Navigate to={`/${userRole.replace('_', '-')}-dashboard`} replace />;
  }

  // Invalid role
  if (!validRoles.includes(allowedRole)) {
    return <Navigate to={`/${userRole.replace('_', '-')}-dashboard`} replace />;
  }

  // Role mismatch
  if (userRole !== allowedRole) {
    return <Navigate to={`/${userRole.replace('_', '-')}-dashboard`} replace />;
  }

  // Authorized
  return children;
};

export default PrivateRoute;