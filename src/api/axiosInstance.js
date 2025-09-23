import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform, Alert } from "react-native";

// Global navigation reference
let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

// Navigate function that can be called from anywhere
const navigate = (name, params) => {
  if (navigationRef && navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

// ---------- STORAGE ----------
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === "web") return localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
    }
  },
  async removeItem(key) {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },
  async multiRemove(keys) {
    for (const key of keys) await this.removeItem(key);
  },
};

// ---------- CONFIG ----------
const axiosInstance = axios.create({
  baseURL: "https://autogen.aieducator.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 180000,
});

// ---------- TOKEN HELPERS ----------
const getAccessToken = async () => {
  return await storage.getItem(ACCESS_KEY);
};

const getRefreshToken = async () => {
  return await storage.getItem(REFRESH_KEY);
};

const setAccessToken = async (token) => {
  await storage.setItem(ACCESS_KEY, token);
};

const setRefreshToken = async (token) => {
  await storage.setItem(REFRESH_KEY, token);
};

const clearAccessToken = async () => {
  await storage.removeItem(ACCESS_KEY);
};

const clearRefreshToken = async () => {
  await storage.removeItem(REFRESH_KEY);
};

const clearAllTokens = async () => {
  await clearAccessToken();
  await clearRefreshToken();
  // Clear other auth-related items
  await storage.multiRemove([
    "token",
    "username",
    "streakData",
    "rewardData",
    "completedChapters",
    "userRole",
    "userEmail",
    "csrfToken",
    "fullName",
    "className"
  ]);
};

// ---------- REFRESH QUEUE ----------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ---------- INTERCEPTORS ----------
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token && !config.url.includes("/api/token/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Do not set Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timed out. Please try again."));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If token endpoint itself fails, clear tokens and redirect
      if (originalRequest.url?.includes("/api/token/")) {
        await clearAllTokens();
        Alert.alert("Session Expired", "Please log in again.");
        navigate("Login");
        return Promise.reject(error);
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearAllTokens();
        Alert.alert("Session Expired", "Please log in again.");
        navigate("Login");
        return Promise.reject(new Error("No refresh token available"));
      }

      try {
        const refreshResponse = await axios.post(
          `${axiosInstance.defaults.baseURL}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = refreshResponse.data;
        await setAccessToken(access);

        processQueue(null, access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearAllTokens();
        Alert.alert("Session Expired", "Please log in again.");
        navigate("Login");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ---------- AUTH METHODS ----------
axiosInstance.login = async (username, password) => {
  const response = await axiosInstance.post("/api/token/", { username, password });
  const { access, refresh, username: user, role, email, full_name, class_name } = response.data;
  
  // Set tokens
  await setAccessToken(access);
  await setRefreshToken(refresh);
  
  // Set other user data for compatibility
  if (user) await storage.setItem("username", user);
  if (role) await storage.setItem("userRole", role);
  if (email) await storage.setItem("userEmail", email);
  if (full_name) await storage.setItem("fullName", full_name);
  if (class_name) await storage.setItem("className", class_name);
  
  // Compatibility with existing context expecting "token"
  await storage.setItem("token", access);
  
  return response.data;
};

axiosInstance.logout = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await axiosInstance.post("/api/logout/", { refresh: refreshToken });
    }
  } catch (e) {
    console.error("Logout error:", e);
  } finally {
    await clearAllTokens();
  }
};

axiosInstance.verifyToken = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error("No token found");
  const response = await axiosInstance.get("/api/token/verify/");
  return response.data;
};

// ---------- FILE UPLOAD ----------
axiosInstance.uploadFile = async (url, formData, progressCallback) => {
  const token = await getAccessToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // On native (Android/iOS), use fetch for more reliable multipart uploads
  if (Platform.OS !== 'web') {
    try {
      const requestUrl = `${axiosInstance.defaults.baseURL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers, // Do not set Content-Type; let fetch set proper boundary
        body: formData,
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const error = new Error(text || `Upload failed with status ${response.status}`);
        error.status = response.status;
        
        // Add friendly error messages
        if (response.status === 413) {
          error.friendlyMessage = "File too large. Please upload a smaller file.";
        } else {
          error.friendlyMessage = "Error uploading file. Please try again.";
        }
        
        throw error;
      }
      
      // Try to parse JSON, fallback to text
      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      if (!error.friendlyMessage) {
        error.friendlyMessage = "Upload failed. Please try again.";
      }
      throw error;
    }
  }

  // Web: keep axios to support upload progress
  try {
    const response = await axiosInstance.post(url, formData, {
      timeout: 180000,
      headers,
      onUploadProgress: (event) => {
        if (progressCallback && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          progressCallback(percent);
        }
      },
    });
    return response;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      error.friendlyMessage = "Upload timed out. Please try again.";
    } else if (error.response?.status === 413) {
      error.friendlyMessage = "File too large. Please upload a smaller file.";
    } else {
      error.friendlyMessage = "Error uploading file. Please try again.";
    }
    throw error;
  }
};

// CSRF helpers kept for API compatibility (no-ops for JWT on mobile)
axiosInstance.initializeCSRF = async () => {};
axiosInstance.clearCSRF = async () => {
  await storage.removeItem("csrfToken");
};

export default axiosInstance;