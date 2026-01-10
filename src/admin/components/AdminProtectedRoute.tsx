// client/src/admin/components/AdminProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { adminLogout } from "../../store/slices/adminAuthSlice";

interface Props {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: Props) {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { adminUser, isAdminAuthenticated, loading } = useAppSelector(
    (state) => state.adminAuth
  );

  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAdminToken = async () => {
      const token = localStorage.getItem("admin-token");

      // No token → logout
      if (!token) {
        dispatch(adminLogout());
        setVerifying(false);
        return;
      }

      try {
        // Verify token with backend
        const response = await axios.get(
          "http://localhost:5000/admin/verify-token",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success) {
          throw new Error("Invalid token");
        }
      } catch (err) {
        console.error("Token verification failed:", err);

        // Remove invalid token
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");

        dispatch(adminLogout());
      } finally {
        setVerifying(false);
      }
    };

    verifyAdminToken();
  }, [dispatch]);

  // Show loading while Redux or verification is loading
  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Authenticated but not admin → redirect home
  if (adminUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Access granted → render children
  return <>{children}</>;
}
