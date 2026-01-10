// client/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import type { UserData, AdminData } from "../services/authService";

interface UseAuthReturn {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: UserData | AdminData | null;
  token: string | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  loginAdmin: (token: string, adminData: AdminData) => void;
  logoutAdmin: () => void;
  createAuthAxios: (
    isAdmin?: boolean
  ) => ReturnType<typeof authService.createAuthAxios>;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();

  // ✅ CRITICAL FIX: Initialize state directly from localStorage
  // This runs ONCE and is synchronous, preventing race conditions
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    user: UserData | AdminData | null;
  }>(() => {
    // Validate tokens first
    authService.validateAllTokens();

    const userAuth = authService.isUserAuthenticated();
    const adminAuth = authService.isAdminAuthenticated();

    console.log("🔐 useAuth initializing:", { userAuth, adminAuth });

    return {
      isAuthenticated: userAuth || adminAuth,
      isAdmin: adminAuth,
      user: adminAuth
        ? authService.getAdminData()
        : userAuth
        ? authService.getUserData()
        : null,
    };
  });

  // ✅ Listen for storage changes (login/logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key?.includes("token") ||
        e.key?.includes("user") ||
        e.key?.includes("admin")
      ) {
        console.log("🔄 Storage changed, updating auth state");

        authService.validateAllTokens();

        const userAuth = authService.isUserAuthenticated();
        const adminAuth = authService.isAdminAuthenticated();

        setAuthState({
          isAuthenticated: userAuth || adminAuth,
          isAdmin: adminAuth,
          user: adminAuth
            ? authService.getAdminData()
            : userAuth
            ? authService.getUserData()
            : null,
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ User login - Updates localStorage AND state
  const login = useCallback((token: string, userData: UserData) => {
    console.log("✅ Logging in user:", userData.email);
    authService.setUserAuth(token, userData);
    setAuthState({
      isAuthenticated: true,
      isAdmin: false,
      user: userData,
    });
  }, []);

  // ✅ User logout
  const logout = useCallback(() => {
    console.log("🚪 Logging out user");
    authService.clearUserAuth();
    setAuthState({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    });
    navigate("/login");
  }, [navigate]);

  // ✅ Admin login
  const loginAdmin = useCallback((token: string, adminData: AdminData) => {
    console.log("✅ Logging in admin:", adminData.email);
    authService.setAdminAuth(token, adminData);
    setAuthState({
      isAuthenticated: true,
      isAdmin: true,
      user: adminData,
    });
  }, []);

  // ✅ Admin logout
  const logoutAdmin = useCallback(() => {
    console.log("🚪 Logging out admin");
    authService.clearAdminAuth();
    setAuthState({
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    });
    navigate("/admin/login");
  }, [navigate]);

  // Get token
  const token = authState.isAdmin
    ? authService.getAdminToken()
    : authService.getUserToken();

  return {
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    user: authState.user,
    token,
    login,
    logout,
    loginAdmin,
    logoutAdmin,
    createAuthAxios: authService.createAuthAxios,
  };
};

interface UseUserAuthReturn {
  isAuthenticated: boolean;
  user: UserData | null;
  token: string | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  createAuthAxios: () => ReturnType<typeof authService.createAuthAxios>;
}

export const useUserAuth = (): UseUserAuthReturn => {
  const {
    isAuthenticated,
    isAdmin,
    user,
    token,
    login,
    logout,
    createAuthAxios,
  } = useAuth();

  return {
    isAuthenticated: isAuthenticated && !isAdmin,
    user: (!isAdmin ? user : null) as UserData | null,
    token,
    login,
    logout,
    createAuthAxios: () => createAuthAxios(false),
  };
};

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  admin: AdminData | null;
  token: string | null;
  login: (token: string, adminData: AdminData) => void;
  logout: () => void;
  createAuthAxios: () => ReturnType<typeof authService.createAuthAxios>;
}

export const useAdminAuth = (): UseAdminAuthReturn => {
  const { isAdmin, user, token, loginAdmin, logoutAdmin, createAuthAxios } =
    useAuth();

  return {
    isAuthenticated: isAdmin,
    admin: (isAdmin ? user : null) as AdminData | null,
    token,
    login: loginAdmin,
    logout: logoutAdmin,
    createAuthAxios: () => createAuthAxios(true),
  };
};
