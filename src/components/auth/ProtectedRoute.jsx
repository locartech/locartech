import { useAuth } from '../../contexts/AuthContext';
import AccessDenied from './AccessDenied';

function ProtectedRoute({ adminOnly = false, children }) {
  const { isAdmin } = useAuth();

  if (adminOnly && !isAdmin) {
    return <AccessDenied />;
  }

  return children;
}

export default ProtectedRoute;
