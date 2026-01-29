import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

/**
 * PublicRoute Component
 * Redirects authenticated users away from public pages (login/register)
 * Useful to prevent already logged-in users from seeing the login form
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  // If authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // If not authenticated, show the content (login/register)
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default PublicRoute;
