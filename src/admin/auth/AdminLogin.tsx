// client/src/admin/pages/AdminLogin.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { adminLogin, clearAdminError } from "../../store/slices/adminAuthSlice";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showTokenClearMessage, setShowTokenClearMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { loading, error, adminUser, isAdminAuthenticated } = useAppSelector(
    (state) => state.adminAuth
  );

  // Get session expired message from location state
  const sessionMessage = location.state?.message;

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearAdminError());
  }, [dispatch]);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdminAuthenticated && adminUser?.role === "admin") {
      navigate("/admin");
    }
  }, [isAdminAuthenticated, adminUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(adminLogin({ email, password })).unwrap();
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem("adminToken");
    setShowTokenClearMessage(true);

    // Hide message after 3 seconds
    setTimeout(() => {
      setShowTokenClearMessage(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-3xl">🛍️</span>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Admin Login
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Sign in to access the admin panel
        </p>

        {/* Token Cleared Success Message */}
        {showTokenClearMessage && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">
              Old token cleared! Please login again.
            </span>
          </div>
        )}

        {/* Session Expired Warning */}
        {sessionMessage && (
          <div className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{sessionMessage}</span>
          </div>
        )}

        {/* Login Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Logging in...</span>
            </>
          ) : (
            "Login to Admin Panel"
          )}
        </button>

        {/* Clear Old Token Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleClearToken}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
          >
            Having issues? Clear old token
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This is a secure admin area. Unauthorized access is prohibited.
          </p>
        </div>
      </form>
    </div>
  );
}
