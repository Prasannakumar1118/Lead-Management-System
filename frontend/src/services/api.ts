import axios, { AxiosError } from 'axios';

// Dynamic API Base URL resolution supporting local dev, cloud tunnels, and user overrides
export function getApiBaseUrl(): string {
  // 1. User manual override stored in localStorage
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('leadflow_api_url');
    if (savedUrl && savedUrl.trim()) {
      return savedUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Build-time environment variable (explicit override)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. When deployed on Vercel (same-origin full-stack architecture)
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return '/api/v1';
  }

  // 4. When accessed over HTTPS (e.g. GitHub Pages or Netlify), connect to live production Vercel API
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://leadflow-liart-tau.vercel.app/api/v1';
  }

  // 5. Default for local HTTP development
  return 'http://localhost:8000/api/v1';
}

export function setApiBaseUrl(url: string): void {
  const cleaned = url.trim().replace(/\/+$/, '');
  localStorage.setItem('leadflow_api_url', cleaned);
  apiClient.defaults.baseURL = cleaned;
}

export function resetApiBaseUrl(): void {
  localStorage.removeItem('leadflow_api_url');
  apiClient.defaults.baseURL = getApiBaseUrl();
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 60000,
});

// Attach JWT access token and ensure baseURL is fresh
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('leadflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept unauthorized 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('leadflow_token');
        localStorage.removeItem('leadflow_user');
        window.dispatchEvent(new Event('leadflow:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const currentBaseUrl = getApiBaseUrl();

    // Check for Mixed Content blocking or Network Errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        currentBaseUrl.startsWith('http://')
      ) {
        return `Mixed Content Block: Browser blocked insecure HTTP request to "${currentBaseUrl}". In deployed HTTPS environments, configure an HTTPS backend URL in the API Server Settings below.`;
      }
      return `Network Error: Could not connect to API server at "${currentBaseUrl}". Please verify the backend is running and CORS allows "${
        typeof window !== 'undefined' ? window.location.origin : 'this origin'
      }".`;
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return `Connection Timeout: The API server at "${currentBaseUrl}" did not respond within 60 seconds. If the backend is hosted on a free cloud tier (such as Render), it may be cold-starting. Please wait a moment and try again.`;
    }

    if (error.response?.status === 503) {
      return `Backend Service Suspended (HTTP 503): The cloud backend at "${currentBaseUrl}" is suspended. Please resume the service in your Render dashboard (https://dashboard.render.com) or enter an active backend URL in the API Server Settings below.`;
    }

    if (error.response?.status === 502) {
      return `Bad Gateway (HTTP 502): The cloud backend at "${currentBaseUrl}" is currently booting. Please wait 30 seconds for the container to start, or enter an active backend URL below.`;
    }

    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('detail' in data) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          const firstErr = data.detail[0];
          return firstErr.msg || 'Validation failed';
        }
      }
      if ('message' in data && typeof data.message === 'string') return data.message;
    }
    if (error.response?.status === 401) return 'Invalid email or password.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 409) return 'A conflict occurred. Record already exists.';
    if (error.message) return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
