import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Lead } from '../../types';
import { formatDateTime } from '../../lib/utils';
import { Clock, AlertTriangle, Calendar, Building2, Phone, Mail, ChevronRight } from 'lucide-react';

export interface FollowUpAlertsListProps {
  upcoming: Lead[];
  overdue: Lead[];
  onSelectLead: (lead: Lead) => void;
  isLoading?: boolean;
}

export const FollowUpAlertsList: React.FC<FollowUpAlertsListProps> = ({
  upcoming,
  overdue,
  onSelectLead,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overdue' | 'upcoming'>('overdue');

  const currentList = activeTab === 'overdue' ? overdue : upcoming;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Follow-up Schedule</span>
          </CardTitle>
          <CardDescription>Scheduled contact reminders and overdue follow-ups</CardDescription>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overdue'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Overdue ({overdue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Next 7 Days ({upcoming.length})</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {activeTab === 'overdue' ? (
              <p>🎉 Excellent! No overdue follow-ups found.</p>
            ) : (
              <p>No upcoming follow-ups scheduled for the next 7 days.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {lead.name}
                    </h4>
                    <Badge variant="status" status={lead.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {lead.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.company}</span>
                      </span>
                    )}
                    {lead.phone_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lead.phone_number}</span>
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold block ${
                        activeTab === 'overdue' ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {formatDateTime(lead.follow_up_date)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {activeTab === 'overdue' ? 'Overdue' : 'Scheduled'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
