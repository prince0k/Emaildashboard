import axios from "axios";

export const API_ROOT = process.env.NEXT_PUBLIC_BASE_PATH || "";

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME || "token";
      const cookiePath = process.env.NEXT_PUBLIC_COOKIE_PATH || "/";
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      document.cookie = `${cookieName}=; path=${cookiePath}; max-age=0`;
      window.location.href = basePath + "/login";
    }
    return Promise.reject(error);
  }
);

export default api;