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

  // 2. When accessed over HTTPS (e.g. GitHub Pages or Netlify), enforce HTTPS to avoid Mixed Content
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.trim() && envUrl.startsWith('https://')) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    return 'https://petite-bats-divide.loca.lt/api/v1';
  }

  // 3. Build-time environment variable for HTTP / local environments
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 4. Default for local HTTP development
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
  timeout: 15000,
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
      return `Connection Timeout: The API server at "${currentBaseUrl}" did not respond within 15 seconds.`;
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
