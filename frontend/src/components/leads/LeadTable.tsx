import React from 'react';
import { Lead, LeadFilterParams } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  formatDate,
  isFollowUpOverdue,
  isFollowUpUpcoming,
} from '../../lib/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

export interface LeadTableProps {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: LeadFilterParams;
  onSort: (column: string) => void;
  onPageChange: (newPage: number) => void;
  onViewDetails: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onCreateLead: () => void;
  isLoading?: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  total,
  page,
  pageSize,
  totalPages,
  filters,
  onSort,
  onPageChange,
  onViewDetails,
  onEditLead,
  onDeleteLead,
  onCreateLead,
  isLoading,
}) => {
  const getSortIcon = (column: string) => {
    if (filters.sort_by !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline" />;
    }
    return filters.sort_dir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 ml-1 inline" />
    );
  };

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  if (!isLoading && leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No leads found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
          {filters.search || filters.status
            ? 'No leads matched your filter criteria. Try adjusting or clearing filters.'
            : 'Get started by creating your first sales lead to track opportunities.'}
        </p>
        <Button onClick={onCreateLead} size="md">
          Create New Lead
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
              <th
                onClick={() => onSort('name')}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-800 transition-colors"
              >
                Lead Name {getSortIcon('name')}
              </th>
              <th
                onClick={() => onSort('company')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                Company {getSortIcon('company')}
              </th>
              <th className="py-3.5 px-4">Contact Details</th>
              <th className="py-3.5 px-4">Service</th>
              <th
                onClick={() => onSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                Status {getSortIcon('status')}
              </th>
              <th
                onClick={() => onSort('follow_up_date')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                Follow-up {getSortIcon('follow_up_date')}
              </th>
              <th
                onClick={() => onSort('created_at')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                Created {getSortIcon('created_at')}
              </th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {leads.map((lead) => {
              const overdue = isFollowUpOverdue(lead.follow_up_date, lead.status);
              const upcoming = isFollowUpUpcoming(lead.follow_up_date, lead.status);

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onViewDetails(lead)}
                >
                  <td className="py-3.5 px-6 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {lead.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {lead.company || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    <div className="space-y-0.5">
                      {lead.email && <div className="text-slate-700">{lead.email}</div>}
                      {lead.phone_number && <div className="text-slate-500">{lead.phone_number}</div>}
                      {!lead.email && !lead.phone_number && <span className="text-slate-300">—</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {lead.service_interested || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="status" status={lead.status} />
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {lead.follow_up_date ? (
                      <div className="flex items-center gap-1.5">
                        {overdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        {upcoming && <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                        <span
                          className={
                            overdue
                              ? 'text-rose-600 font-semibold'
                              : upcoming
                              ? 'text-indigo-600 font-medium'
                              : 'text-slate-600'
                          }
                        >
                          {formatDate(lead.follow_up_date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {formatDate(lead.created_at)}
                  </td>
                  <td
                    className="py-3.5 px-6 text-right space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onViewDetails(lead)}
                      title="View Details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditLead(lead)}
                      title="Edit Lead"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLead(lead)}
                      title="Delete Lead"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onViewDetails(lead)}
            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{lead.name}</h4>
                {lead.company && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {lead.company}
                  </p>
                )}
              </div>
              <Badge variant="status" status={lead.status} />
            </div>

            <div className="text-xs text-slate-500 space-y-1 pt-1">
              {lead.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone_number && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.phone_number}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Created: {formatDate(lead.created_at)}</span>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEditLead(lead)}
                  className="p-1 text-slate-500 hover:text-indigo-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteLead(lead)}
                  className="p-1 text-slate-500 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{startIdx}</span> to{' '}
          <span className="font-semibold text-slate-800">{endIdx}</span> of{' '}
          <span className="font-semibold text-slate-800">{total}</span> leads
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <span className="text-xs font-semibold text-slate-700 px-2">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
