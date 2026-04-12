import axios, { AxiosInstance } from "axios";
import { axiosInstance } from "../config/api";

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

type SessionExpiredCallback = (isAdmin: boolean) => void;
let sessionExpiredCallback: SessionExpiredCallback | null = null;

export const onSessionExpired = (callback: SessionExpiredCallback): void => {
  sessionExpiredCallback = callback;
};

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

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return Date.now() >= decoded.exp * 1000;
};

export const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= decoded.exp * 1000 - fiveMinutes;
};

export const validateToken = (token: string | null): token is string => {
  if (!token) return false;
  return !isTokenExpired(token);
};

// ==================== User Authentication ====================

export const setUserAuth = (token: string, userData: UserData): void => {
  localStorage.setItem("userToken", token);
  localStorage.setItem("userData", JSON.stringify(userData));
};

export const getUserToken = (): string | null => {
  return localStorage.getItem("userToken");
};

export const getUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const isUserAuthenticated = (): boolean => {
  const token = getUserToken();
  const userData = getUserData();
  return validateToken(token) && userData !== null;
};

export const clearUserAuth = (): void => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userData");
  window.dispatchEvent(new Event("authCleared"));
};

// ==================== Admin Authentication ====================

export const setAdminAuth = (token: string, adminData: AdminData): void => {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminData", JSON.stringify(adminData));
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken"); // ✅
};

export const getAdminData = (): AdminData | null => {
  try {
    const data = localStorage.getItem("adminData"); // ✅
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error parsing admin data:", error);
    return null;
  }
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAdminToken();
  const adminData = getAdminData();
  return validateToken(token) && adminData !== null;
};

export const clearAdminAuth = (): void => {
  localStorage.removeItem("adminToken"); // ✅
  localStorage.removeItem("adminData");  // ✅
  window.dispatchEvent(new Event("authCleared"));
};

// ==================== Axios Instances ====================

export const createAuthAxios = (isAdmin: boolean = false): AxiosInstance => {
  const token = isAdmin ? getAdminToken() : getUserToken();

  if (!token) {
    throw new Error(
      `No ${isAdmin ? "admin" : "user"} authentication token available`
    );
  }

  if (isTokenExpired(token)) {
    if (isAdmin) {
      clearAdminAuth();
    } else {
      clearUserAuth();
    }
    if (sessionExpiredCallback) {
      sessionExpiredCallback(isAdmin);
    }
    throw new Error(`${isAdmin ? "Admin" : "User"} session has expired`);
  }

  return axios.create({
    baseURL: axiosInstance.defaults.baseURL,
    timeout: axiosInstance.defaults.timeout,
    headers: {
      ...axiosInstance.defaults.headers.common,
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createAxios = (): AxiosInstance => {
  const userToken = getUserToken();
  const adminToken = getAdminToken();

  let token: string | null = null;

  if (userToken && validateToken(userToken)) {
    token = userToken;
  } else if (adminToken && validateToken(adminToken)) {
    token = adminToken;
  }

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

  return axiosInstance;
};

export const validateAllTokens = (): {
  userExpired: boolean;
  adminExpired: boolean;
} => {
  let userExpired = false;
  let adminExpired = false;

  const userToken = getUserToken();
  if (userToken && isTokenExpired(userToken)) {
    clearUserAuth();
    userExpired = true;
    if (sessionExpiredCallback) sessionExpiredCallback(false);
  }

  const adminToken = getAdminToken();
  if (adminToken && isTokenExpired(adminToken)) {
    clearAdminAuth();
    adminExpired = true;
    if (sessionExpiredCallback) sessionExpiredCallback(true);
  }

  return { userExpired, adminExpired };
};

export const logout = (): void => {
  clearUserAuth();
  clearAdminAuth();
};

export default {
  decodeToken,
  isTokenExpired,
  isTokenExpiringSoon,
  validateToken,
  setUserAuth,
  getUserToken,
  getUserData,
  isUserAuthenticated,
  clearUserAuth,
  setAdminAuth,
  getAdminToken,
  getAdminData,
  isAdminAuthenticated,
  clearAdminAuth,
  createAuthAxios,
  createAxios,
  validateAllTokens,
  onSessionExpired,
  logout,
};