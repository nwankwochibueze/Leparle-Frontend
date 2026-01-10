// ==================== STEP 3: UPDATE ADMIN LAYOUT ====================
// client/src/admin/layout/AdminLayout.tsx

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiEdit,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiMenu,
  FiX,
  FiLogOut,
} from "react-icons/fi";
import axios from "axios";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Global axios interceptor - catches ALL 401/403 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if error is authentication related
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.response?.data?.code === "TOKEN_EXPIRED" ||
          error.response?.data?.code === "INVALID_TOKEN"
        ) {
          console.log("🔒 Session expired - redirecting to login");

          // Clear admin credentials
          localStorage.removeItem("admin-token");
          localStorage.removeItem("admin-user");

          // Redirect to login with message
          navigate("/admin/login", {
            state: {
              message:
                "Your session has expired after 30 days. Please login again.",
            },
            replace: true,
          });
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  const handleLogout = () => {
    console.log("👋 Admin logging out");
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-user");
    navigate("/admin/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: FiHome },
    { label: "Homepage", path: "/admin/homepage", icon: FiEdit },
    { label: "Products", path: "/admin/products", icon: FiShoppingBag },
    { label: "Users", path: "/admin/users", icon: FiUsers },
    { label: "Orders", path: "/admin/orders", icon: FiPackage },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo/Header */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🛍️</span>
                </div>
                <div>
                  {/* <h2 className="text-xl font-bold text-white">Modernize</h2> */}
                  <h2 className="text-xl text-blue-100">Admin Panel</h2>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:text-blue-100"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* HOME Section */}
          <div className="px-4 pt-6 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              HOME
            </p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto px-3">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={index}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          active ? "text-blue-600" : "text-gray-500"
                        }`}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {active && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* APPS Section */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
              APPS
            </p>
          </div>

          <nav className="px-3 pb-4">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* User Profile at Bottom */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-800"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
