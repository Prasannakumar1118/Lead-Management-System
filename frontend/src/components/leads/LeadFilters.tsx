import React, { useState } from 'react';
import { Search, RotateCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showDateFilters, setShowDateFilters] = useState(
    !!filters.created_after ||
    !!filters.created_before ||
    !!filters.follow_up_after ||
    !!filters.follow_up_before
  );

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

        {/* Status Filter & Controls */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Date Filter Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDateFilters(!showDateFilters)}
            className={`gap-1.5 ${
              filters.created_after || filters.created_before || filters.follow_up_after || filters.follow_up_before
                ? 'border-indigo-300 text-indigo-700 bg-indigo-50/50'
                : 'text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Dates</span>
            {showDateFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

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

      {/* Expandable Date Filters Section */}
      {showDateFilters && (
        <div className="pt-3 pb-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Created After</label>
            <input
              type="date"
              value={filters.created_after?.slice(0, 10) || ''}
              onChange={(e) =>
                onChange({
                  created_after: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Created Before</label>
            <input
              type="date"
              value={filters.created_before?.slice(0, 10) || ''}
              onChange={(e) =>
                onChange({
                  created_before: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Follow-up After</label>
            <input
              type="date"
              value={filters.follow_up_after?.slice(0, 10) || ''}
              onChange={(e) =>
                onChange({
                  follow_up_after: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Follow-up Before</label>
            <input
              type="date"
              value={filters.follow_up_before?.slice(0, 10) || ''}
              onChange={(e) =>
                onChange({
                  follow_up_before: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
                  page: 1,
                })
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Secondary filter chips & result count bar */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
          {filters.created_after && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full text-[11px]">
              From: {filters.created_after.slice(0, 10)}
              <button
                onClick={() => onChange({ created_after: undefined, page: 1 })}
                className="hover:text-slate-900 ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {filters.created_before && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-full text-[11px]">
              To: {filters.created_before.slice(0, 10)}
              <button
                onClick={() => onChange({ created_before: undefined, page: 1 })}
                className="hover:text-slate-900 ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {filters.follow_up_after && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
              Follow-up &gt;= {filters.follow_up_after.slice(0, 10)}
              <button
                onClick={() => onChange({ follow_up_after: undefined, page: 1 })}
                className="hover:text-amber-900 ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {filters.follow_up_before && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
              Follow-up &lt;= {filters.follow_up_before.slice(0, 10)}
              <button
                onClick={() => onChange({ follow_up_before: undefined, page: 1 })}
                className="hover:text-amber-900 ml-0.5"
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
