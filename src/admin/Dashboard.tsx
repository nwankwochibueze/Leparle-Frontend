import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
} from "react-icons/fi";
import { createAuthAxios } from "../services/authService";
// Add these two imports:
import { useAppDispatch } from "../store/hooks";
import { adminLogout } from "../store/slices/adminAuthSlice";

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: {
    pending?: number;
    processing?: number;
    shipped?: number;
    delivered?: number;
    cancelled?: number;
  };
  recentOrders: Array<{
    _id: string;
    shippingInfo: {
      fullName: string;
    };
    totalAmount: number;
    orderStatus: string;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      // Use admin token for authentication
      const axiosInstance = createAuthAxios(true);
      const response = await axiosInstance.get("/admin/stats");

      setStats(response.data.data);
      setError(null);
    } catch (error) {
      // Handle session expiration
      if (error instanceof Error) {
        if (error.message.includes("session has expired")) {
          setError("Session expired. Please log in again.");
          setTimeout(() => navigate("/admin/login"), 2000);
        } else {
          setError("Failed to load dashboard stats");
        }
      }

      // Set default stats to prevent undefined errors
      setStats({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        statusCounts: {},
        recentOrders: [],
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    window.location.replace("/admin/login");
    dispatch(adminLogout());
  };
  const links = [
    { label: "Edit Homepage", path: "/admin/homepage", icon: FiPackage },
    { label: "Manage Products", path: "/admin/products", icon: FiShoppingBag },
    { label: "View Users", path: "/admin/users", icon: FiUsers },
    { label: "Manage Orders", path: "/admin/orders", icon: FiPackage },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <FiPackage className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">{error}</h2>
          <button
            onClick={() => navigate("/admin/login")}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Here's your store overview.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/users"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all users →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.totalOrders || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FiShoppingBag className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/admin/orders"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View all orders →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    ${(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FiDollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                <FiTrendingUp className="w-4 h-4" />
                <span>Active sales</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Orders
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.statusCounts?.pending || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FiPackage className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  Requires attention
                </span>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Order Status Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.statusCounts?.pending || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">
                  {stats.statusCounts?.processing || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">Processing</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">
                  {stats.statusCounts?.shipped || 0}
                </p>
                <p className="text-sm text-purple-600 mt-1">Shipped</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {stats.statusCounts?.delivered || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">Delivered</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">
                  {stats.statusCounts?.cancelled || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">Cancelled</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {links.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.path}
                  className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition"
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {stats && stats.recentOrders && stats.recentOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
              <Link
                to="/admin/orders"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {order.shippingInfo?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full capitalize bg-blue-100 text-blue-800">
                          {order.orderStatus || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
