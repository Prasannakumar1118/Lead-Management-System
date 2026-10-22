import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DeleteLeadDialog } from '../components/leads/DeleteLeadDialog';
import { useToast } from '../components/ui/Toast';
import { LeadStatus } from '../types';
import { formatDateTime, isFollowUpOverdue, isFollowUpUpcoming } from '../lib/utils';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  AlertTriangle,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

export const LeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setMobileMenuOpen } = useOutletContext<{ setMobileMenuOpen: (o: boolean) => void }>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const leadQuery = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getLead(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: LeadStatus) => leadService.updateLead(id!, { status: newStatus }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['lead', id], updated);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      toast.success(`Pipeline status updated to ${updated.status}`);
    },
    onError: () => {
      toast.error('Failed to update lead status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadService.deleteLead(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-followups'] });
      toast.success('Lead deleted successfully');
      navigate('/leads');
    },
    onError: () => {
      toast.error('Failed to delete lead');
    },
  });

  if (leadQuery.isLoading) {
    return (
      <div>
        <Header
          title="Lead Details"
          subtitle="Loading record..."
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
          title="Lead Details"
          subtitle="Record Not Found"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <div className="max-w-md mx-auto my-12 p-6 bg-white border border-rose-200 rounded-xl text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Lead Not Found</h3>
          <p className="text-xs text-slate-500 mb-6">
            The requested lead does not exist or you do not have permission to access it.
          </p>
          <Button onClick={() => navigate('/leads')} size="sm">
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const lead = leadQuery.data;
  const overdue = isFollowUpOverdue(lead.follow_up_date, lead.status);
  const upcoming = isFollowUpUpcoming(lead.follow_up_date, lead.status);

  return (
    <div>
      <Header
        title={lead.name}
        subtitle={lead.company ? `${lead.company} · Lead Details` : 'Lead Details Overview'}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/leads')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/leads/${lead.id}/edit`)}
              className="gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Lead</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Lead Main Banner */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
                <Badge variant="status" status={lead.status} />
              </div>
              {lead.company && (
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {lead.company}
                </p>
              )}
            </div>

            {/* Quick Status Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
              <span className="font-semibold text-slate-600 px-2">Pipeline Stage:</span>
              <select
                value={lead.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as LeadStatus)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Contact Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email
                </span>
                <span className="font-medium text-slate-900 select-all">
                  {lead.email || <span className="text-slate-300">Not provided</span>}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Phone
                </span>
                <span className="font-medium text-slate-900 select-all">
                  {lead.phone_number || <span className="text-slate-300">Not provided</span>}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" /> Service Interested
                </span>
                <span className="font-medium text-slate-900">
                  {lead.service_interested || <span className="text-slate-300">Not specified</span>}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" /> Acquisition Source
                </span>
                <span className="font-medium text-slate-900">
                  {lead.source || <span className="text-slate-300">Not specified</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Follow-up & System Metadata */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Follow-up Schedule
            </h3>
            <div
              className={`border rounded-xl p-4 text-xs ${
                overdue
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : upcoming
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                  : 'bg-slate-50/50 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {overdue && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                {upcoming && <Clock className="w-4 h-4 text-indigo-600 shrink-0" />}
                {!overdue && !upcoming && <Calendar className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="font-semibold text-sm">
                  {lead.follow_up_date
                    ? formatDateTime(lead.follow_up_date)
                    : 'No follow-up scheduled'}
                </span>
              </div>
              {overdue && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  This follow-up is overdue. Please reach out to this contact.
                </p>
              )}
              {upcoming && (
                <p className="text-[11px] text-indigo-600 mt-1">
                  Scheduled within the next 7 days.
                </p>
              )}
            </div>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div>Created: <span className="text-slate-600 font-medium">{formatDateTime(lead.created_at)}</span></div>
              <div>Last Updated: <span className="text-slate-600 font-medium">{formatDateTime(lead.updated_at)}</span></div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Notes & Business Requirements
          </h3>
          {lead.notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200/60">
              {lead.notes}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No notes recorded for this lead.</p>
          )}
        </div>
      </div>

      <DeleteLeadDialog
        lead={lead}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
