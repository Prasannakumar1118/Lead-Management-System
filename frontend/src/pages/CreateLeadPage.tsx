import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import { Header } from '../components/layout/Header';
import { LeadForm } from '../components/forms/LeadForm';
import { useToast } from '../components/ui/Toast';
import { LeadFormData } from '../schemas/leadSchema';
import { getApiErrorMessage } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export const CreateLeadPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setMobileMenuOpen } = useOutletContext<{ setMobileMenuOpen: (o: boolean) => void }>();

  const createMutation = useMutation({
    mutationFn: (data: LeadFormData) => leadService.createLead(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      toast.success('Lead created successfully!');
      navigate('/leads');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Failed to create lead');
    },
  });

  return (
    <div>
      <Header
        title="Create New Lead"
        subtitle="Add a new potential client or deal to your sales pipeline"
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <div className="max-w-3xl mx-auto py-6">
        <button
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          <LeadForm
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
            }}
            onCancel={() => navigate('/leads')}
            isLoading={createMutation.isPending}
            submitButtonText="Create Lead"
          />
        </div>
      </div>
    </div>
  );
};
