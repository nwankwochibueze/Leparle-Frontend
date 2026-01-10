import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { rehydrateAuth } from "../store/slices/authSlice";
import { validateAllTokens, onSessionExpired } from "../services/authService";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Register session expired callback and sync Redux
  useEffect(() => {
    onSessionExpired((isAdminSession) => {
      // Immediately sync Redux state
      dispatch(rehydrateAuth());

      if (isAdminSession) {
        // Admin: Immediate redirect for security
        navigate("/admin/login", {
          replace: true,
          state: { message: "Your admin session has expired. Please log in again." },
        });
      } else {
        // User: Show modal for better UX
        setShowSessionExpiredModal(true);
      }
    });
  }, [navigate, dispatch]);

  // Validate tokens on mount
  useEffect(() => {
    validateAllTokens();
  }, []);

  // Periodic validation every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const result = validateAllTokens();
      
      // Sync Redux if any token expired
      if (result.userExpired || result.adminExpired) {
        dispatch(rehydrateAuth());
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Listen for manual localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if auth tokens were removed
      if (e.key === "userToken" || e.key === "adminToken") {
        // Sync Redux with localStorage
        dispatch(rehydrateAuth());

        // Show modal if user token was removed
        if (!e.newValue && e.key === "userToken") {
          setShowSessionExpiredModal(true);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Listen for auth clear events in current tab
  useEffect(() => {
    const handleAuthClear = () => {
      dispatch(rehydrateAuth());
    };

    window.addEventListener("authCleared", handleAuthClear);
    return () => window.removeEventListener("authCleared", handleAuthClear);
  }, [dispatch]);

  // Handle modal close and redirect to login
  const handleSessionExpiredConfirm = () => {
    setShowSessionExpiredModal(false);
    
    // Save current location to redirect back after login
    navigate("/login", {
      state: {
        from: location.pathname,
        message: "Your session expired. Please log in to continue.",
      },
    });
  };

  return (
    <>
      {children}

      {showSessionExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 rounded-full p-3 mr-4">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Session Expired
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Your session has expired for security reasons. Please log in again
              to continue. Don't worry - your cart and order details are saved!
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSessionExpiredConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};