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

const getAdminFriendlyError = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      message?: string;
      code?: string;
      response?: {
        status?: number;
        data?: { message?: string; error?: string };
      };
    };
    if (err.message?.includes("Network Error") || err.code === "ERR_NETWORK")
      return "Connection error. Please check your network and try again.";
    if (err.message?.includes("timeout") || err.code === "ECONNABORTED")
      return "Server timeout. Please try again.";
    if (err.response?.status === 503 || err.response?.status === 502)
      return "Service temporarily unavailable. Please try again shortly.";
    if (err.response?.status === 401)
      return "Invalid admin credentials. Please check your email and password.";
    if (err.response?.status === 403)
      return "Access denied. Admin privileges required.";
    if (err.response?.status === 429)
      return "Too many attempts. Please wait before trying again.";
    if (err.response?.status && err.response.status >= 500)
      return "Server error. Please try again later.";
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.error) return err.response.data.error;
    if (err.message) return err.message;
  }
  return "Login failed. Please try again.";
};

// ✅ All keys consistent: adminToken and adminData
const adminToken = localStorage.getItem("adminToken");
const adminUserStr = localStorage.getItem("adminData");
const adminUser = adminUserStr ? (JSON.parse(adminUserStr) as User) : null;

const initialState: AdminAuthState = {
  adminUser,
  adminToken,
  isAdminAuthenticated: !!adminToken && adminUser?.role === "admin",
  loading: false,
  error: null,
};

export const adminLogin = createAsyncThunk(
  "adminAuth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/admin/login", credentials);
      if (response.data.user.role !== "admin") {
        return rejectWithValue("Access denied. Admin privileges required.");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(getAdminFriendlyError(error));
    }
  }
);

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
      return rejectWithValue(getAdminFriendlyError(error));
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
      localStorage.removeItem("adminToken"); // ✅
      localStorage.removeItem("adminData");  // ✅
    },
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
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
        localStorage.setItem("adminToken", action.payload.token); // ✅
        localStorage.setItem("adminData", JSON.stringify(action.payload.user)); // ✅
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Admin login failed. Please try again.";
      });

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
        state.error =
          (action.payload as string) || "Failed to load profile.";
        state.adminUser = null;
        state.adminToken = null;
        state.isAdminAuthenticated = false;
        localStorage.removeItem("adminToken"); // ✅
        localStorage.removeItem("adminData");  // ✅
      });
  },
});

export const { adminLogout, clearAdminError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;