import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform, Alert } from "react-native";

// ---------- STORAGE ----------
const storage = {
  async getItem(key) {
    try {
      if (Platform.OS === "web") return localStorage.getItem(key);
      const value = await SecureStore.getItemAsync(key);
      console.log(`Storage get ${key}:`, value ? "Found" : "Not found");
      return value;
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
        console.log(`Storage set ${key}: Success`);
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
const getBaseURL = () => "http://192.168.20.125:8000/";
function getCSRFToken() {
  if (Platform.OS !== "web") return null;
  const match = document.cookie.match(new RegExp("(^| )csrftoken=([^;]+)"));
  return match ? match[2] : null;
}

// ---------- TOKEN STATE ----------
let inMemoryToken = null;
let inMemoryCSRFToken = null;

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: Platform.OS === "web",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// ---------- GET TOKENS ----------
const getAuthToken = async () => {
  if (inMemoryToken) return inMemoryToken;
  const token = await storage.getItem("token");
  inMemoryToken = token;
  return token;
};

const getCSRFTokenForRequest = async () => {
  if (Platform.OS === "web") return getCSRFToken();
  if (inMemoryCSRFToken) return inMemoryCSRFToken;
  const token = await storage.getItem("csrfToken");
  console.log("getting csrf", token);
  inMemoryCSRFToken = token;
  return token;
};

// ---------- STORE TOKENS ----------
axiosInstance.initializeCSRF = async () => {
  if (Platform.OS !== "web") {
    try {
      const response = await axiosInstance.get("/csrf/");
      const csrfToken = response?.data?.csrf_token;
      if (csrfToken) {
        await storeCSRFToken(csrfToken);
        console.log("✅ CSRF token initialized for mobile:", csrfToken);
      } else {
        console.warn("⚠️ CSRF token not found in /csrf/ response.");
      }
    } catch (err) {
      console.error("❌ Failed to initialize CSRF token on mobile:", err);
    }
  }
};

const storeCSRFToken = async (csrfToken) => {
  if (!csrfToken) return;
  inMemoryCSRFToken = csrfToken;
  if (Platform.OS !== "web") await storage.setItem("csrfToken", csrfToken);
};

// ---------- INTERCEPTORS ----------
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    const csrfToken = await getCSRFTokenForRequest();

    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log("🔐 Adding auth token:", token);
    } else {
      console.warn("⚠️ No auth token found in storage");
    }

    if (csrfToken) config.headers["x-csrftoken"] = csrfToken;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes("/login/")) {
      const token = response.data.token;
      const csrf = response.data.csrf_token;

      if (token) {
        inMemoryToken = token;
        axiosInstance.defaults.headers.common["Authorization"] = `Token ${token}`;
        storage.setItem("token", token);
      }

      if (csrf) {
        storeCSRFToken(csrf);
      }
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;

    if (status === 403 && /CSRF/i.test(error.response?.data?.detail || "")) {
      Alert.alert("Security Error", "Session expired. Please log in again.");
      return Promise.reject(new Error("CSRF validation failed"));
    }

    if (status === 401) {
      inMemoryToken = null;
      inMemoryCSRFToken = null;
      await storage.multiRemove([
        "token", "csrfToken", "username", "role", "className"
      ]);
      Alert.alert("Session Expired", "Please log in again.");
      return Promise.reject(new Error("Unauthorized"));
    }

    return Promise.reject(error);
  }
);

// ---------- HELPERS ----------
axiosInstance.uploadFile = async (url, formData, progressCallback) => {
  const token = await getAuthToken();
  const csrfToken = await getCSRFTokenForRequest();
  const headers = {};
  if (token) headers.Authorization = `Token ${token}`;
  if (csrfToken) headers["x-csrftoken"] = csrfToken;

  return axiosInstance.post(url, formData, {
    headers,
    onUploadProgress: (event) => {
      if (progressCallback && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total);
        progressCallback(percent);
      }
    },
  });
};

axiosInstance.clearCSRF = async () => {
  inMemoryCSRFToken = null;
  await storage.removeItem("csrfToken");
};

export default axiosInstance;
