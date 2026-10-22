import React, { useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { LeadFilters } from '../components/leads/LeadFilters';
import { LeadTable } from '../components/leads/LeadTable';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { LeadDetailsDrawer } from '../components/leads/LeadDetailsDrawer';
import { DeleteLeadDialog } from '../components/leads/DeleteLeadDialog';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Lead, LeadFilterParams, LeadStatus } from '../types';
import { getApiErrorMessage } from '../services/api';
import { Plus, Download, Loader2 } from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setMobileMenuOpen } = useOutletContext<{ setMobileMenuOpen: (o: boolean) => void }>();

  // State
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Parse filters from URL searchParams
  const filters: LeadFilterParams = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_dir: (searchParams.get('sort_dir') as 'asc' | 'desc') || 'desc',
    page: Number(searchParams.get('page')) || 1,
    page_size: Number(searchParams.get('page_size')) || 10,
    view_all: searchParams.get('view_all') === 'true',
  };

  const updateFilters = (updated: Partial<LeadFilterParams>) => {
    const next = { ...filters, ...updated };
    const params = new URLSearchParams();

    Object.entries(next).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.set(k, String(v));
      }
    });

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Query
  const leadsQuery = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadService.getLeads(filters),
  });

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
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
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
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
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      setIsDeleteModalOpen(false);
      setIsDetailsOpen(false);
      toast.success('Lead deleted successfully.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Delete Failed');
    },
  });

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await leadService.exportCsv(filters);
      toast.success('Leads CSV exported successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err), 'CSV Export Failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (column: string) => {
    if (filters.sort_by === column) {
      updateFilters({
        sort_dir: filters.sort_dir === 'asc' ? 'desc' : 'asc',
      });
    } else {
      updateFilters({
        sort_by: column,
        sort_dir: 'asc',
      });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLeadMutation.mutateAsync({ id: leadId, data: { status: newStatus } });
  };

  const paginationData = leadsQuery.data || {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  return (
    <div className="flex-1 pb-12">
      <Header
        title="Lead Pipeline"
        subtitle="Manage, qualify, and track your active sales prospects"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        actions={
          <div className="flex items-center gap-2">
            {user?.role === 'ADMIN' && (
              <label className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.view_all || false}
                  onChange={(e) => updateFilters({ view_all: e.target.checked, page: 1 })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>All Company Leads</span>
              </label>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="gap-1.5"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </Button>
          </div>
        }
      />

      <main className="px-4 sm:px-8 py-6 max-w-7xl mx-auto">
        <LeadFilters
          filters={filters}
          onChange={updateFilters}
          onReset={handleResetFilters}
          totalResults={paginationData.total}
        />

        <LeadTable
          leads={paginationData.items}
          total={paginationData.total}
          page={paginationData.page}
          pageSize={paginationData.page_size}
          totalPages={paginationData.total_pages}
          filters={filters}
          onSort={handleSort}
          onPageChange={(newPage) => updateFilters({ page: newPage })}
          onViewDetails={(lead) => {
            setSelectedLead(lead);
            setIsDetailsOpen(true);
          }}
          onEditLead={(lead) => {
            setLeadToEdit(lead);
            setIsEditModalOpen(true);
          }}
          onDeleteLead={(lead) => {
            setLeadToDelete(lead);
            setIsDeleteModalOpen(true);
          }}
          onCreateLead={() => setIsCreateModalOpen(true)}
          isLoading={leadsQuery.isLoading}
        />
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
