import axios from 'axios';

// Resolve base URL for local development or Vercel frontend connected to Render backend
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s timeout to prevent hanging on unstable/slow connections
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Request interceptor: Attach JWT access token and ensure no-cache headers on every call
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nutripro_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Auto refresh access token on 401 TOKEN_EXPIRED
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Auto refresh access token on 401 TOKEN_EXPIRED
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = localStorage.getItem('nutripro_refresh_token');
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        if (response.data.success && response.data.accessToken) {
          const newToken = response.data.accessToken;
          localStorage.setItem('nutripro_access_token', newToken);
          if (response.data.refreshToken) {
            localStorage.setItem('nutripro_refresh_token', response.data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('nutripro_access_token');
        localStorage.removeItem('nutripro_refresh_token');
        localStorage.removeItem('nutripro_user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    // 2. Network Resilience: Auto-retry idempotent GET requests once on transient network drops/timeouts
    if (
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      !originalRequest._networkRetry &&
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response)
    ) {
      originalRequest._networkRetry = true;
      // Wait 1.2s before retrying
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return api(originalRequest);
    }

    // 3. User-friendly formatting for network disconnects and timeouts
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = 'Connection timed out. Please verify your internet connection and try again.';
    } else if (!error.response && (error.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && !navigator.onLine))) {
      error.message = 'You appear to be offline. Please check your internet connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
