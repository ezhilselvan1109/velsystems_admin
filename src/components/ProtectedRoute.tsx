import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  // if (requiredRole && user?.role !== requiredRole) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
  //         <p className="text-gray-600 mb-4">
  //           You don't have permission to access this page.
  //         </p>
  //         <button
  //           onClick={() => window.history.back()}
  //           className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Go Back
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
};

export default ProtectedRoute;