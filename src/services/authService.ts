// client/src/services/authService.ts - FIXED VERSION (No TypeScript Errors)
import axios, { AxiosInstance } from "axios";
import { axiosInstance } from "../config/api";

// ✅ Export types for use in other files
export interface UserData {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
}

export interface AdminData {
  _id: string;
  email: string;
  name?: string;
  role: string;
}

export interface TokenPayload {
  userId?: string;
  adminId?: string;
  email: string;
  role?: string;
  exp: number;
  iat: number;
}

// ==================== 🆕 SESSION EXPIRY CALLBACK ====================
type SessionExpiredCallback = (isAdmin: boolean) => void;
let sessionExpiredCallback: SessionExpiredCallback | null = null;

/**
 * Register a callback to be called when session expires
 * This allows components to show notifications and redirect users
 */
export const onSessionExpired = (callback: SessionExpiredCallback): void => {
  sessionExpiredCallback = callback;
};

// ==================== Token Utilities ====================

/**
 * Decode JWT token (without verification)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000;
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= decoded.exp * 1000 - fiveMinutes;
};

/**
 * Validate token exists and not expired
 */
export const validateToken = (token: string | null): token is string => {
  if (!token) return false;
  return !isTokenExpired(token);
};

// ==================== User Authentication ====================

/**
 * Set user authentication data
 */
export const setUserAuth = (token: string, userData: UserData): void => {
  localStorage.setItem("userToken", token);
  localStorage.setItem("userData", JSON.stringify(userData));
};

/**
 * Get user token
 */
export const getUserToken = (): string | null => {
  return localStorage.getItem("userToken");
};

/**
 * Get user data
 */
export const getUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  const token = getUserToken();
  const userData = getUserData();
  return validateToken(token) && userData !== null;
};

/**
 * Clear user authentication
 */
export const clearUserAuth = (): void => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  
  // ✅ Dispatch custom event to notify components
  window.dispatchEvent(new Event("authCleared"));
};

// ==================== Admin Authentication ====================

/**
 * Set admin authentication data
 */
export const setAdminAuth = (token: string, adminData: AdminData): void => {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminData", JSON.stringify(adminData));
};

/**
 * Get admin token
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken");
};

/**
 * Get admin data
 */
export const getAdminData = (): AdminData | null => {
  try {
    const data = localStorage.getItem("adminData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error parsing admin data:", error);
    return null;
  }
};

/**
 * Check if admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
  const token = getAdminToken();
  const adminData = getAdminData();
  return validateToken(token) && adminData !== null;
};

/**
 * Clear admin authentication
 */
export const clearAdminAuth = (): void => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
  
  // ✅ Dispatch custom event to notify components
  window.dispatchEvent(new Event("authCleared"));
};

// ==================== Axios Instances ====================

/**
 * ✅ FIXED: Create authenticated axios instance using proper axios.create()
 * @param isAdmin - Whether to use admin token (default: false)
 */
export const createAuthAxios = (isAdmin: boolean = false): AxiosInstance => {
  const token = isAdmin ? getAdminToken() : getUserToken();

  if (!token) {
    throw new Error(
      `No ${isAdmin ? "admin" : "user"} authentication token available`
    );
  }

  // Check if token is expired before creating instance
  if (isTokenExpired(token)) {
    if (isAdmin) {
      clearAdminAuth();
    } else {
      clearUserAuth();
    }
    
    // Trigger callback if registered
    if (sessionExpiredCallback) {
      sessionExpiredCallback(isAdmin);
    }
    
    throw new Error(`${isAdmin ? "Admin" : "User"} session has expired`);
  }

  // ✅ FIXED: Use axios.create() properly with baseURL from axiosInstance
  return axios.create({
    baseURL: axiosInstance.defaults.baseURL,
    timeout: axiosInstance.defaults.timeout,
    headers: {
      ...axiosInstance.defaults.headers.common,
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * ✅ FIXED: Create axios instance that auto-detects auth
 * (works for both guest and authenticated)
 */
export const createAxios = (): AxiosInstance => {
  // Check for user token first, then admin token
  const userToken = getUserToken();
  const adminToken = getAdminToken();

  let token: string | null = null;

  if (userToken && validateToken(userToken)) {
    token = userToken;
  } else if (adminToken && validateToken(adminToken)) {
    token = adminToken;
  }

  // If we have a token, create authenticated instance
  if (token) {
    return axios.create({
      baseURL: axiosInstance.defaults.baseURL,
      timeout: axiosInstance.defaults.timeout,
      headers: {
        ...axiosInstance.defaults.headers.common,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // No token - return base instance for guest requests
  return axiosInstance;
};

// ==================== Token Validation ====================

/**
 * 🆕 ENHANCED: Validate all stored tokens and trigger callback if expired
 */
export const validateAllTokens = (): {
  userExpired: boolean;
  adminExpired: boolean;
} => {
  let userExpired = false;
  let adminExpired = false;

  // Validate user token
  const userToken = getUserToken();
  if (userToken && isTokenExpired(userToken)) {
    console.log("⏰ User token expired, clearing auth");
    clearUserAuth();
    userExpired = true;
    
    // Trigger callback for user session expiry
    if (sessionExpiredCallback) {
      sessionExpiredCallback(false);
    }
  }

  // Validate admin token
  const adminToken = getAdminToken();
  if (adminToken && isTokenExpired(adminToken)) {
    console.log("⏰ Admin token expired, clearing auth");
    clearAdminAuth();
    adminExpired = true;
    
    // Trigger callback for admin session expiry
    if (sessionExpiredCallback) {
      sessionExpiredCallback(true);
    }
  }

  return { userExpired, adminExpired };
};

// ==================== Logout ====================

/**
 * Logout (clears both user and admin auth)
 */
export const logout = (): void => {
  clearUserAuth();
  clearAdminAuth();
};

// ✅ Export everything as named exports for useAuth hook
export default {
  // Types
  decodeToken,
  isTokenExpired,
  isTokenExpiringSoon,
  validateToken,

  // User auth
  setUserAuth,
  getUserToken,
  getUserData,
  isUserAuthenticated,
  clearUserAuth,

  // Admin auth
  setAdminAuth,
  getAdminToken,
  getAdminData,
  isAdminAuthenticated,
  clearAdminAuth,

  // Axios
  createAuthAxios,
  createAxios,

  // Utilities
  validateAllTokens,
  onSessionExpired,
  logout,
};