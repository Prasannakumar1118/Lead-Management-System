import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { leadService } from '../services/leadService';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusDistributionChart } from '../components/dashboard/StatusDistributionChart';
import { TrendChart } from '../components/dashboard/TrendChart';
import { FollowUpAlertsList } from '../components/dashboard/FollowUpAlertsList';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { LeadDetailsDrawer } from '../components/leads/LeadDetailsDrawer';
import { DeleteLeadDialog } from '../components/leads/DeleteLeadDialog';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Lead, LeadStatus } from '../types';
import { getApiErrorMessage } from '../services/api';
import {
  Users,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Award,
  XCircle,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setMobileMenuOpen } = useOutletContext<{ setMobileMenuOpen: (o: boolean) => void }>();

  const [viewAll, setViewAll] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Queries
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', viewAll],
    queryFn: () => leadService.getDashboardStats(viewAll),
  });

  const chartsQuery = useQuery({
    queryKey: ['dashboard-charts', viewAll],
    queryFn: () => leadService.getDashboardCharts(viewAll),
  });

  const followUpsQuery = useQuery({
    queryKey: ['dashboard-followups', viewAll],
    queryFn: () => leadService.getFollowUpAlerts(viewAll),
  });

  const refetchAll = () => {
    statsQuery.refetch();
    chartsQuery.refetch();
    followUpsQuery.refetch();
    toast.info('Dashboard metrics updated');
  };

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateModalOpen(false);
      toast.success('Lead created successfully!');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Failed to create lead');
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      leadService.updateLead(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(updated);
      setIsEditModalOpen(false);
      toast.success('Lead updated successfully!');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Update Failed');
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsDeleteModalOpen(false);
      setIsDetailsOpen(false);
      toast.success('Lead deleted successfully.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Delete Failed');
    },
  });

  const stats = statsQuery.data || {
    total_leads: 0,
    new_leads: 0,
    contacted_leads: 0,
    qualified_leads: 0,
    converted_leads: 0,
    lost_leads: 0,
    conversion_rate: 0,
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLeadMutation.mutateAsync({ id: leadId, data: { status: newStatus } });
  };

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Analytics Dashboard"
        subtitle="Swan Digital Solutions sales performance & conversion funnel"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            {user?.role === 'ADMIN' && (
              <label className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={viewAll}
                  onChange={(e) => setViewAll(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>All Company Leads</span>
              </label>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              title="Refresh Metrics"
              className="p-2"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </Button>
          </div>
        }
      />

      <main className="px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Conversion Rate Highlight Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl shadow-indigo-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Conversion Funnel Health</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Pipeline Conversion Rate
            </h3>
            <p className="text-xs text-indigo-200/80">
              Calculated dynamically: (Converted Leads / Total Leads) × 100
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15">
            <span className="text-3xl font-extrabold tracking-tight">
              {stats.conversion_rate}%
            </span>
            <span className="text-xs text-indigo-200 font-medium">overall rate</span>
          </div>
        </div>

        {/* 6 Core Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Total Leads"
            value={stats.total_leads}
            icon={Users}
            variant="indigo"
            subtitle="All records"
          />
          <MetricCard
            title="New"
            value={stats.new_leads}
            icon={Sparkles}
            variant="blue"
            subtitle="Uncontacted"
          />
          <MetricCard
            title="Contacted"
            value={stats.contacted_leads}
            icon={PhoneCall}
            variant="amber"
            subtitle="Engaged"
          />
          <MetricCard
            title="Qualified"
            value={stats.qualified_leads}
            icon={CheckCircle2}
            variant="purple"
            subtitle="High Intent"
          />
          <MetricCard
            title="Converted"
            value={stats.converted_leads}
            icon={Award}
            variant="emerald"
            subtitle="Won Deals"
          />
          <MetricCard
            title="Lost"
            value={stats.lost_leads}
            icon={XCircle}
            variant="rose"
            subtitle="Unconverted"
          />
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusDistributionChart
            data={chartsQuery.data?.distribution || []}
            isLoading={chartsQuery.isLoading}
          />
          <TrendChart
            data={chartsQuery.data?.trend || []}
            isLoading={chartsQuery.isLoading}
          />
        </div>

        {/* Follow-up Alerts Schedule */}
        <div className="w-full">
          <FollowUpAlertsList
            upcoming={followUpsQuery.data?.upcoming || []}
            overdue={followUpsQuery.data?.overdue || []}
            onSelectLead={handleSelectLead}
            isLoading={followUpsQuery.isLoading}
          />
        </div>
      </main>

      {/* Drawers and Modals */}
      <LeadDetailsDrawer
        lead={selectedLead}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(lead) => {
          setLeadToEdit(lead);
          setIsEditModalOpen(true);
        }}
        onDelete={(lead) => {
          setLeadToDelete(lead);
          setIsDeleteModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
        isUpdatingStatus={updateLeadMutation.isPending}
      />

      <LeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          await createLeadMutation.mutateAsync(data);
        }}
        isLoading={createLeadMutation.isPending}
      />

      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={leadToEdit}
        onSubmit={async (data) => {
          if (leadToEdit) {
            await updateLeadMutation.mutateAsync({ id: leadToEdit.id, data });
          }
        }}
        isLoading={updateLeadMutation.isPending}
      />

      <DeleteLeadDialog
        lead={leadToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (leadToDelete) {
            await deleteLeadMutation.mutateAsync(leadToDelete.id);
          }
        }}
        isLoading={deleteLeadMutation.isPending}
      />
    </div>
  );
};
