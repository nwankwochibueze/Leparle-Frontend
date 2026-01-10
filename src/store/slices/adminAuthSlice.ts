import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../config/api";
import type { User } from "../../types/user";

interface AdminAuthState {
  adminUser: User | null;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Convert technical errors to user-friendly messages for admins
const getAdminFriendlyError = (error: unknown): string => {
  // Type guard for axios errors
  if (typeof error === 'object' && error !== null) {
    const err = error as {
      message?: string;
      code?: string;
      response?: {
        status?: number;
        data?: {
          message?: string;
          error?: string;
        };
      };
    };

    // Network/connection errors
    if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
      return "Connection error. Please check your network and try again.";
    }

    // Server timeout
    if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
      return "Server timeout. Please try again.";
    }

    // Service unavailable
    if (err.response?.status === 503 || err.response?.status === 502) {
      return "Service temporarily unavailable. Please try again shortly.";
    }

    // Authentication errors (401)
    if (err.response?.status === 401) {
      return "Invalid admin credentials. Please check your email and password.";
    }

    // Not an admin (403)
    if (err.response?.status === 403) {
      return "Access denied. Admin privileges required.";
    }

    // Rate limiting (429)
    if (err.response?.status === 429) {
      return "Too many attempts. Please wait before trying again.";
    }

    // Server errors (500+)
    if (err.response?.status && err.response.status >= 500) {
      return "Server error. Please try again later.";
    }

    // Check for specific backend error messages
    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    if (err.response?.data?.error) {
      return err.response.data.error;
    }

    // Generic fallback
    if (err.message) {
      return err.message;
    }
  }

  return "Login failed. Please try again.";
};

// Load admin token/user on startup
const adminToken = localStorage.getItem("admin-token");
const adminUserStr = localStorage.getItem("admin-user");
const adminUser = adminUserStr ? (JSON.parse(adminUserStr) as User) : null;

const initialState: AdminAuthState = {
  adminUser,
  adminToken,
  isAdminAuthenticated: !!adminToken && adminUser?.role === "admin",
  loading: false,
  error: null,
};

// Admin Login
export const adminLogin = createAsyncThunk(
  "adminAuth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/admin/login", credentials);

      // Verify admin role
      if (response.data.user.role !== "admin") {
        return rejectWithValue("Access denied. Admin privileges required.");
      }

      return response.data;
    } catch (error) {
      const friendlyError = getAdminFriendlyError(error);
      return rejectWithValue(friendlyError);
    }
  }
);

// Get Admin Profile
export const getAdminProfile = createAsyncThunk(
  "adminAuth/getProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { adminAuth: AdminAuthState };
      const response = await axiosInstance.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${state.adminAuth.adminToken}`,
        },
      });
      return response.data;
    } catch (error) {
      const friendlyError = getAdminFriendlyError(error);
      return rejectWithValue(friendlyError);
    }
  }
);

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminLogout: (state) => {
      state.adminUser = null;
      state.adminToken = null;
      state.isAdminAuthenticated = false;
      state.error = null;
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin-user");
    },
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Admin Login
    builder
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.adminUser = action.payload.user;
        state.adminToken = action.payload.token;
        state.isAdminAuthenticated = true;
        localStorage.setItem("admin-token", action.payload.token);
        localStorage.setItem("admin-user", JSON.stringify(action.payload.user));
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Admin login failed. Please try again.";
      });

    // Get Admin Profile
    builder
      .addCase(getAdminProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.adminUser = action.payload.user;
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to load profile.";
        state.adminUser = null;
        state.adminToken = null;
        state.isAdminAuthenticated = false;
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");
      });
  },
});

export const { adminLogout, clearAdminError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;