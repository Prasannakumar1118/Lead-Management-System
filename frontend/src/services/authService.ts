import { apiClient } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: { email: string; full_name: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Invalidate locally regardless
    } finally {
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_user');
    }
  },
};
