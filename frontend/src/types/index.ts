export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

export interface Lead {
  id: string;
  owner_id: string;
  name: string;
  email?: string | null;
  phone_number?: string | null;
  company?: string | null;
  service_interested?: string | null;
  source?: string | null;
  status: LeadStatus;
  follow_up_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadPagination {
  items: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LeadFilterParams {
  search?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
  follow_up_after?: string;
  follow_up_before?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
  view_all?: boolean;
}

export interface DashboardStats {
  total_leads: number;
  new_leads: number;
  contacted_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
  conversion_rate: number;
}

export interface ChartStatusItem {
  status: LeadStatus;
  count: number;
  percentage: number;
}

export interface ChartTrendItem {
  date: string;
  count: number;
}

export interface DashboardCharts {
  distribution: ChartStatusItem[];
  trend: ChartTrendItem[];
}

export interface FollowUpAlerts {
  upcoming: Lead[];
  overdue: Lead[];
}
