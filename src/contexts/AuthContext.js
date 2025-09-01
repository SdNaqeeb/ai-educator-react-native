import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import axiosInstance from "../api/axiosInstance";

const storage = {
  async getItem(key) {
    return Platform.OS === "web"
      ? localStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    Platform.OS === "web"
      ? localStorage.setItem(key, value)
      : await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    Platform.OS === "web"
      ? localStorage.removeItem(key)
      : await SecureStore.deleteItemAsync(key);
  },
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log("🔍 Checking authentication state...");
      const token = await storage.getItem("token");
      const storedUsername = await storage.getItem("username");
      const storedRole = await storage.getItem("role");
      const storedClassName = await storage.getItem("className");

      console.log("🔑 Auth check results:", {
        hasToken: !!token,
        hasUsername: !!storedUsername,
        role: storedRole,
        className: storedClassName,
      });

      if (token && storedUsername) {
        setUser(token);
        setUsername(storedUsername);
        setRole(storedRole || "student");
        setClassName(storedClassName || "");

        if (Platform.OS !== "web") {
          await axiosInstance.initializeCSRF();
        }
      } else {
        setUser(null);
        setUsername("");
        setRole("");
        setClassName("");
      }
    } catch (error) {
      console.error("❌ Error checking auth state:", error);
      setUser(null);
      setUsername("");
      setRole("");
      setClassName("");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (usernameParam, token, role = "student", userClassName = "", csrf) => {
    try {
      console.log("🔐 Starting login process...");
      if (token != null) await storage.setItem("token", String(token));
      if (usernameParam != null) await storage.setItem("username", String(usernameParam));
      if (role != null) await storage.setItem("role", String(role));
      if (userClassName != null) await storage.setItem("className", String(userClassName));
      if (csrf != null) await storage.setItem("csrfToken", String(csrf));

      setUser(token);
      setUsername(usernameParam);
      setRole(role);
      setClassName(userClassName);

      if (Platform.OS !== "web") {
        await axiosInstance.initializeCSRF();
      }

      console.log("✅ Login successful");
    } catch (error) {
      console.error("❌ Error during login:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Logging out...");
      await axiosInstance.post('logout/',{},{withCredentials: Platform.OS === "web",})
      const keysToRemove = [
        "token", "accessToken", "username", "role", "className", "csrfToken",
      ];
      await Promise.all(keysToRemove.map(storage.removeItem));
      await axiosInstance.clearCSRF();

      setUser(null);
      setUsername("");
      setRole("");
      setClassName("");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, username, role, className, isLoading, login, logout, checkAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};
