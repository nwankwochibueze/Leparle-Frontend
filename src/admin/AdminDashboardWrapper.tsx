// src/admin/AdminDashboardWrapper.tsx
import { useLocation } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./Dashboard";
import UsersPanel from "./pages/UsersPanel";
import OrdersPanel from "./pages/OrdersPanel";
import AdminPanel from "./AdminPanel";

export default function AdminDashboardWrapper() {
  const location = useLocation();

  // Determine which content to show based on URL
  const renderContent = () => {
    const path = location.pathname;

    // Exact match for dashboard
    if (path === "/admin" || path === "/admin/") {
      return <Dashboard />;
    }

    // Users page
    if (path.startsWith("/admin/users")) {
      return <UsersPanel />;
    }

    // Orders page
    if (path.startsWith("/admin/orders")) {
      return <OrdersPanel />;
    }

    // Homepage or Products - Let React-Admin handle these
    if (
      path.startsWith("/admin/homepage") ||
      path.startsWith("/admin/products")
    ) {
      return <AdminPanel />;
    }

    // Default to dashboard
    return <Dashboard />;
  };

  return <AdminLayout>{renderContent()}</AdminLayout>;
}
