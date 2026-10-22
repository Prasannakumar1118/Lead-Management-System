import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ChartStatusItem, LeadStatus } from '../../types';

export interface StatusDistributionChartProps {
  data: ChartStatusItem[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  New: '#3B82F6',
  Contacted: '#F59E0B',
  Qualified: '#A855F7',
  Converted: '#10B981',
  Lost: '#F43F5E',
};

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
  isLoading,
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ChartStatusItem;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-800">
          <p className="font-semibold text-slate-100">{item.status}</p>
          <p className="text-slate-300 mt-0.5">
            {item.count} leads ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Breakdown across active pipeline stages</CardDescription>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {total} Total
        </span>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-6">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : total === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <p>No lead data available yet.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-1/2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={STATUS_COLORS[entry.status] || '#94A3B8'}
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom accessible legend */}
            <div className="w-full sm:w-1/2 space-y-2.5">
              {data.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[item.status] }}
                    />
                    <span className="font-medium text-slate-700">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">{item.count}</span>
                    <span className="text-slate-400 w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
