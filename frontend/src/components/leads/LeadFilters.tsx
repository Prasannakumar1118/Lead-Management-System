import { Search, RotateCcw } from 'lucide-react';
import { LeadFilterParams, LeadStatus } from '../../types';
import { Button } from '../ui/Button';

export interface LeadFiltersProps {
  filters: LeadFilterParams;
  onChange: (updated: Partial<LeadFilterParams>) => void;
  onReset: () => void;
  totalResults: number;
}

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const hasActiveFilters =
    !!filters.search ||
    !!filters.status ||
    !!filters.created_after ||
    !!filters.created_before ||
    !!filters.follow_up_after ||
    !!filters.follow_up_before;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-6 space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            placeholder="Search by lead name, email, phone, or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || undefined, page: 1 })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Page size */}
          <select
            value={filters.page_size || 10}
            onChange={(e) => onChange({ page_size: Number(e.target.value), page: 1 })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-slate-500 hover:text-rose-600 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Secondary filter chips & result count bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">{totalResults}</span>{' '}
          {totalResults === 1 ? 'record found' : 'records found'}
          {filters.status && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full text-[11px] border border-indigo-100">
              Status: {filters.status}
              <button
                onClick={() => onChange({ status: undefined, page: 1 })}
                className="hover:text-indigo-900 ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full text-[11px] border border-indigo-100">
              Query: "{filters.search}"
              <button
                onClick={() => onChange({ search: undefined, page: 1 })}
                className="hover:text-indigo-900 ml-0.5"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
