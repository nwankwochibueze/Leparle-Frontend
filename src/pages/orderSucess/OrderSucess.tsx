// client/src/pages/OrderSuccess.tsx
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import * as authService from "../../services/authService";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reference, amountUSD, amountNGN, email, isGuest } =
    location.state || {};

  // ✅ FIX: Store auth status in state to prevent re-reading localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Check authentication ONCE on mount
  useEffect(() => {
    setIsAuthenticated(authService.isUserAuthenticated());
  }, []);

  useEffect(() => {
    if (!reference) {
      console.log("⚠️ No order reference found, redirecting to home");
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reference, navigate]);

  if (!reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Order Found
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecting you to the homepage...
          </p>
          <Link
            to="/"
            className="block w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">Thank you for your order</p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <p className="text-sm text-gray-600 mb-1">Reference</p>
          <p className="font-mono text-sm font-medium break-all">{reference}</p>

          {amountUSD && (
            <>
              <p className="text-sm text-gray-600 mt-3 mb-1">Amount Paid</p>
              <p className="font-medium">
                ${amountUSD.toFixed(2)}
                {amountNGN && ` (₦${amountNGN.toLocaleString()})`}
              </p>
            </>
          )}
        </div>

        {/* ✅ Conditional buttons based on auth status */}
        <div className="space-y-3">
          {isAuthenticated ? (
            // Logged-in user - show order history button
            <>
              <Link
                to="/orders"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View My Orders
              </Link>
              <Link
                to="/"
                className="block w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </>
          ) : (
            // Guest user - show signup/login options
            <>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 mb-3">
                  💡 Create an account to easily track your orders!
                </p>
                <Link
                  to="/signup"
                  state={{ email }}
                  className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors mb-2"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="block w-full bg-white border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Login to Existing Account
                </Link>
              </div>
              <Link
                to="/"
                className="block w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          {isGuest ? (
            <>
              A confirmation email has been sent to <strong>{email}</strong>.
              <br />
              Keep this reference number for order tracking.
            </>
          ) : (
            "A confirmation email has been sent to your registered email address."
          )}
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
