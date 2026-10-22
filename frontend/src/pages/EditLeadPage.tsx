import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import { Header } from '../components/layout/Header';
import { LeadForm } from '../components/forms/LeadForm';
import { useToast } from '../components/ui/Toast';
import { LeadFormData } from '../schemas/leadSchema';
import { getApiErrorMessage } from '../services/api';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const EditLeadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setMobileMenuOpen } = useOutletContext<{ setMobileMenuOpen: (o: boolean) => void }>();

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: LeadFormData) => leadService.updateLead(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      toast.success('Lead updated successfully!');
      navigate('/leads');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err), 'Update Failed');
    },
  });

  if (leadQuery.isLoading) {
    return (
      <div>
        <Header
          title="Edit Lead"
          subtitle="Loading lead details..."
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading lead information...</p>
        </div>
      </div>
    );
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <div>
        <Header
          title="Edit Lead"
          subtitle="Error loading record"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <div className="max-w-md mx-auto my-12 p-6 bg-white border border-rose-200 rounded-xl text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Lead Not Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            The lead you are trying to edit does not exist or you do not have permission to view it.
          </p>
          <Button onClick={() => navigate('/leads')} size="sm">
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Edit: ${leadQuery.data.name}`}
        subtitle="Update contact information, pipeline status, or follow-up schedule"
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
            initialData={leadQuery.data}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync(data);
            }}
            onCancel={() => navigate('/leads')}
            isLoading={updateMutation.isPending}
            submitButtonText="Save Changes"
          />
        </div>
      </div>
    </div>
  );
};
