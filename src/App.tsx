import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import authService from "./services/authService";
import { AuthProvider } from "./components/AuthProvider";
import { useDispatch } from "react-redux";
import { rehydrateAuth } from "./store/slices/authSlice";
import { HomepageProvider } from "./context/homepage/HomepageProvider";

import Home from "./pages/home/Home";
import Store from "./pages/store/Store";
import Sale from "./pages/sale/Sale";
import CustomerCare from "./pages/customerCare/CustomerCare";
import Cart from "./pages/cart/Cart";
import ProductPage from "./pages/product/ProductPage";
import NotFound from "./pages/NotFound/NotFound";
import Shop from "./pages/shop/Shop";
import Checkout from "./pages/checkout/Checkout";
import OrderSuccess from "./pages/orderSucess/OrderSucess";
import OrderPage from "./pages/order/OrderPage";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Profile from "./pages/profile/Profile";

import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import AdminLogin from "./admin/auth/AdminLogin";
import AdminDashboardWrapper from "./admin/AdminDashboardWrapper";

function App() {
  const dispatch = useDispatch();

  // Initialize and validate auth tokens on app mount
  useEffect(() => {
    authService.validateAllTokens();
    dispatch(rehydrateAuth());
  }, [dispatch]);

  return (
    <HomepageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="sale" element={<Sale />} />
            <Route path="store" element={<Store />} />
            <Route path="customercare" element={<CustomerCare />} />
            <Route path="cart" element={<Cart />} />
            <Route path="products/:id" element={<ProductPage />} />

            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />

            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success" element={<OrderSuccess />} />

            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <OrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminDashboardWrapper />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </HomepageProvider>
  );
}

export default App;