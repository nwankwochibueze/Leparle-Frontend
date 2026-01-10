import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import * as authService from "../services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  // Check Redux authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Fallback check for race condition on page refresh
  const localStorageAuth = authService.isUserAuthenticated();

  const isActuallyAuthenticated = isAuthenticated || localStorageAuth;

  if (!isActuallyAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;