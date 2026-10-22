import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Lead, LeadStatus } from '../../types';
import {
  formatDateTime,
  isFollowUpOverdue,
  isFollowUpUpcoming,
} from '../../lib/utils';
import {
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
} from 'lucide-react';

export interface LeadDetailsDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => Promise<void>;
  isUpdatingStatus?: boolean;
}

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus,
}) => {
  if (!lead) return null;

  const overdue = isFollowUpOverdue(lead.follow_up_date, lead.status);
  const upcoming = isFollowUpUpcoming(lead.follow_up_date, lead.status);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Lead Overview">
      <div className="space-y-6">
        {/* Lead Main Header */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{lead.name}</h3>
              {lead.company && (
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {lead.company}
                </p>
              )}
            </div>
            <Badge variant="status" status={lead.status} />
          </div>

          {/* Quick status transition dropdown */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Pipeline Stage:</span>
            <select
              value={lead.status}
              disabled={isUpdatingStatus}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Contact Information
          </h4>
          <div className="space-y-2.5 bg-white border border-slate-200/80 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" /> Email
              </span>
              <span className="font-medium text-slate-900 select-all">
                {lead.email || <span className="text-slate-300">Not provided</span>}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" /> Phone
              </span>
              <span className="font-medium text-slate-900 select-all">
                {lead.phone_number || <span className="text-slate-300">Not provided</span>}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" /> Service Interested
              </span>
              <span className="font-medium text-slate-900">
                {lead.service_interested || <span className="text-slate-300">Not specified</span>}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" /> Lead Source
              </span>
              <span className="font-medium text-slate-900">
                {lead.source || <span className="text-slate-300">Not specified</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Follow-up Reminder */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Follow-up Reminder
          </h4>
          <div
            className={`border rounded-xl p-4 text-xs ${
              overdue
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : upcoming
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                : 'bg-white border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {overdue && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              {upcoming && <Clock className="w-4 h-4 text-indigo-600 shrink-0" />}
              {!overdue && !upcoming && <Calendar className="w-4 h-4 text-slate-400 shrink-0" />}
              <span className="font-semibold">
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
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Notes & Context
          </h4>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
            {lead.notes || <span className="text-slate-400 italic">No notes recorded yet.</span>}
          </div>
        </div>

        {/* Audit Meta */}
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Lead ID:</span>
            <span className="font-mono text-slate-600">{lead.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formatDateTime(lead.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{formatDateTime(lead.updated_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              onClose();
              onEdit(lead);
            }}
          >
            <Pencil className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit</span>
          </Button>
          <Button
            variant="danger"
            className="flex-1 gap-2"
            onClick={() => {
              onClose();
              onDelete(lead);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
