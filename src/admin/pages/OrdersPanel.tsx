// client/src/admin/pages/OrdersPanel.tsx
import { useState, useEffect } from "react";
import {
  FiSearch,
  FiPackage,
  FiEye,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiUserX,
} from "react-icons/fi";

interface OrderItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  imageUrl: string;
}

interface Order {
  _id: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null; // ✅ Can be null for guest orders
  items: OrderItem[];
  shippingInfo: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    phone: string;
  };
  paymentInfo: {
    reference: string;
    status: string;
    amount: number;
    method: string;
  };
  totalAmount: number;
  orderStatus: string;
  isGuestOrder?: boolean; // ✅ Added guest order flag
  createdAt: string;
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<
    "all" | "registered" | "guest"
  >("all"); // ✅ New filter
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, customerTypeFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin-token");

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (customerTypeFilter !== "all")
        params.append("customerType", customerTypeFilter); // ✅ Add filter

      const response = await fetch(`${API_URL}/admin/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin-token");
      await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      pending: FiPackage,
      processing: FiPackage,
      shipped: FiTruck,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
    };
    const Icon = icons[status] || FiPackage;
    return <Icon className="w-4 h-4" />;
  };

  // ✅ Helper to check if order is from guest
  const isGuestOrder = (order: Order) => {
    return order.isGuestOrder || !order.userId;
  };

  // ✅ Calculate guest order stats
  const guestOrdersCount = orders.filter(isGuestOrder).length;
  const registeredOrdersCount = orders.filter((o) => !isGuestOrder(o)).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Order Management
          </h1>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by customer name, email, or order details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* ✅ Customer Type Filter */}
            <select
              value={customerTypeFilter}
              onChange={(e) =>
                setCustomerTypeFilter(
                  e.target.value as "all" | "registered" | "guest"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Customers</option>
              <option value="registered">Registered Users</option>
              <option value="guest">Guest Checkout</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {/* ✅ Added Customer Type Stats */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Registered</p>
              <p className="text-2xl font-bold text-indigo-700">
                {registeredOrdersCount}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Guest</p>
              <p className="text-2xl font-bold text-orange-700">
                {guestOrdersCount}
              </p>
            </div>

            {/* Original Status Stats */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {orders.filter((o) => o.orderStatus === "pending").length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Processing</p>
              <p className="text-2xl font-bold text-blue-700">
                {orders.filter((o) => o.orderStatus === "processing").length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Shipped</p>
              <p className="text-2xl font-bold text-purple-700">
                {orders.filter((o) => o.orderStatus === "shipped").length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-700">
                {orders.filter((o) => o.orderStatus === "delivered").length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Cancelled</p>
              <p className="text-2xl font-bold text-red-700">
                {orders.filter((o) => o.orderStatus === "cancelled").length}
              </p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type {/* ✅ New column */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.shippingInfo.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shippingInfo.email}
                        </div>
                      </td>
                      {/* ✅ Customer Type Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isGuestOrder(order) ? (
                          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            <FiUserX className="w-3 h-3" />
                            Guest
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            <FiUser className="w-3 h-3" />
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FiEye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    {/* ✅ Guest/User Badge in Modal */}
                    {isGuestOrder(selectedOrder) ? (
                      <span className="px-3 py-1 inline-flex items-center gap-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                        <FiUserX className="w-4 h-4" />
                        Guest Order
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex items-center gap-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        <FiUser className="w-4 h-4" />
                        Registered User
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 font-mono">
                    #{selectedOrder._id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    {/* ✅ Show registered user info if available */}
                    {selectedOrder.userId && !isGuestOrder(selectedOrder) && (
                      <div className="mb-3 pb-3 border-b">
                        <p className="text-xs text-gray-500 uppercase mb-1">
                          Registered User
                        </p>
                        <p className="font-medium">
                          {selectedOrder.userId.firstName}{" "}
                          {selectedOrder.userId.lastName}
                        </p>
                        <p className="text-gray-600">
                          {selectedOrder.userId.email}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 uppercase mb-2">
                      Shipping Details
                    </p>
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedOrder.shippingInfo.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedOrder.shippingInfo.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedOrder.shippingInfo.phone || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {selectedOrder.shippingInfo.address || "N/A"},{" "}
                      {selectedOrder.shippingInfo.city || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedOrder.paymentInfo.method}
                    </p>
                    <p>
                      <span className="font-medium">Reference:</span>{" "}
                      {selectedOrder.paymentInfo.reference}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span className="capitalize">
                        {selectedOrder.paymentInfo.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Total:</span> $
                      {selectedOrder.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-4 border p-3 rounded-lg"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-600">
                          Size: {item.selectedSize}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Update */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Update Order Status</h3>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "pending",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        updateOrderStatus(selectedOrder._id, status)
                      }
                      disabled={selectedOrder.orderStatus === status}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                        selectedOrder.orderStatus === status
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="mt-6 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
