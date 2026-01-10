import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../config/api";
import authService from "../../services/authService";

interface User {
  _id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Convert technical errors to user-friendly messages
const getUserFriendlyError = (error: unknown): string => {
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
      return "Poor internet connection. Please check your network and try again.";
    }

    // Server timeout
    if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
      return "Server is taking too long to respond. Please try again later.";
    }

    // Service unavailable
    if (err.response?.status === 503 || err.response?.status === 502) {
      return "Service temporarily unavailable. Please try again in a few minutes.";
    }

    // Authentication errors (401)
    if (err.response?.status === 401) {
      return "Invalid email or password. Please check your credentials and try again.";
    }

    // Account not found (404)
    if (err.response?.status === 404) {
      return "Account not found. Please check your email or sign up.";
    }

    // Account disabled (403)
    if (err.response?.status === 403) {
      return "Your account has been disabled. Please contact support.";
    }

    // Rate limiting (429)
    if (err.response?.status === 429) {
      return "Too many login attempts. Please wait a few minutes and try again.";
    }

    // Email already exists (409) - for registration
    if (err.response?.status === 409) {
      return "An account with this email already exists. Please login instead.";
    }

    // Invalid data (400)
    if (err.response?.status === 400) {
      return err.response.data?.message || "Invalid information provided. Please check your details.";
    }

    // Server errors (500+)
    if (err.response?.status && err.response.status >= 500) {
      return "Our servers are experiencing issues. Please try again later.";
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

  return "Something went wrong. Please try again.";
};

// Initialize auth state from localStorage
const initializeAuthState = (): AuthState => {
  try {
    authService.validateAllTokens();
    const isAuth = authService.isUserAuthenticated();
    const userData = authService.getUserData();

    return {
      user: userData,
      isAuthenticated: isAuth,
      loading: false,
      error: null,
    };
  } catch {
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }
};

const initialState: AuthState = initializeAuthState();

// Login thunk
export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      // Save to localStorage
      authService.setUserAuth(response.data.token, response.data.user);

      return response.data;
    } catch (error) {
      const friendlyError = getUserFriendlyError(error);
      return rejectWithValue(friendlyError);
    }
  }
);

// Register thunk
export const register = createAsyncThunk(
  "auth/register",
  async (
    {
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/auth/register", {
        email,
        password,
        firstName,
        lastName,
      });

      // Save to localStorage
      authService.setUserAuth(response.data.token, response.data.user);

      return response.data;
    } catch (error) {
      const friendlyError = getUserFriendlyError(error);
      return rejectWithValue(friendlyError);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Clear from localStorage
      authService.clearUserAuth();

      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Rehydrate from localStorage
    rehydrateAuth: (state) => {
      authService.validateAllTokens();
      const userData = authService.getUserData();
      const isAuth = authService.isUserAuthenticated();

      state.user = userData;
      state.isAuthenticated = isAuth;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Login failed. Please try again.";
        state.isAuthenticated = false;
        state.user = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Registration failed. Please try again.";
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { logout, clearError, rehydrateAuth } = authSlice.actions;
export default authSlice.reducer;