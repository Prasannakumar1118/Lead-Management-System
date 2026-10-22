import { apiClient } from './api';
import {
  Lead,
  LeadPagination,
  LeadFilterParams,
  DashboardStats,
  DashboardCharts,
  FollowUpAlerts,
} from '../types';

export const leadService = {
  async getLeads(params?: LeadFilterParams): Promise<LeadPagination> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });
    }
    const response = await apiClient.get<LeadPagination>('/leads', { params: cleanParams });
    return response.data;
  },

  async getLead(id: string): Promise<Lead> {
    const response = await apiClient.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const response = await apiClient.post<Lead>('/leads', data);
    return response.data;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const response = await apiClient.patch<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },

  async exportCsv(params?: LeadFilterParams): Promise<void> {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && key !== 'page' && key !== 'page_size') {
          cleanParams[key] = val;
        }
      });
    }
    const response = await apiClient.get('/leads/export/csv', {
      params: cleanParams,
      responseType: 'blob',
    });

    // Create a temporary link to download the blob
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getDashboardStats(viewAll: boolean = false): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
      params: { view_all: viewAll },
    });
    return response.data;
  },

  async getDashboardCharts(viewAll: boolean = false): Promise<DashboardCharts> {
    const response = await apiClient.get<DashboardCharts>('/dashboard/charts', {
      params: { view_all: viewAll },
    });
    return response.data;
  },

  async getFollowUpAlerts(viewAll: boolean = false): Promise<FollowUpAlerts> {
    const response = await apiClient.get<FollowUpAlerts>('/dashboard/follow-ups', {
      params: { view_all: viewAll },
    });
    return response.data;
  },
};
