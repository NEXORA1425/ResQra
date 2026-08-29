import React from 'react';
import { AnalyticsOverview } from '../../types';
import {
  AlertTriangle,
  Flame,
  Users,
  Ambulance,
  Clock,
  Building2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface KPIGridProps {
  data: AnalyticsOverview & { total_resources?: number; available_resources?: number };
}

export const KPIGrid: React.FC<KPIGridProps> = ({ data }) => {
  const cards = [
    {
      id: 'kpi-active',
      title: 'Active Incidents',
      value: data.active_incidents,
      subtext: `${data.total_incidents} logged total`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-critical',
      title: 'Critical Incidents',
      value: data.critical_incidents,
      subtext: 'Immediate Action',
      icon: Flame,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: data.critical_incidents > 0 ? 'border-rose-300' : 'border-slate-200/90',
      pulse: data.critical_incidents > 0,
    },
    {
      id: 'kpi-affected',
      title: 'People Impacted',
      value: data.people_assisted.toLocaleString(),
      subtext: 'Active Disaster Zones',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-fleet',
      title: 'Responders Ready',
      value: `${data.available_resources || 28}/${data.total_resources || 43}`,
      subtext: `${data.resource_utilization_percent}% Fleet Deployed`,
      icon: Ambulance,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-response-time',
      title: 'Avg Response Time',
      value: `${data.average_response_time_minutes}m`,
      subtext: `AI Triage ~${data.average_triage_time_seconds}s`,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-hospitals',
      title: 'Hospital Capacity',
      value: `${100 - data.hospital_bed_occupancy_percent}%`,
      subtext: 'Emergency Beds Open',
      icon: Building2,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-icu',
      title: 'ICU Availability',
      value: `${100 - data.icu_occupancy_percent}%`,
      subtext: 'Trauma Beds Open',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-slate-200/90',
    },
    {
      id: 'kpi-resolved',
      title: 'Resolved Today',
      value: data.resolved_today,
      subtext: 'Missions Closed',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-slate-200/90',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className="relative bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-w-0 overflow-hidden"
          >
            {/* Absolute positioned symbol badge to guarantee a perfect layout fit */}
            <div className={`absolute top-3 right-3 sm:top-3.5 sm:right-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${card.bgColor} dark:bg-slate-800/95 flex items-center justify-center shrink-0 border border-slate-100/50 dark:border-slate-700/50 shadow-xs`}>
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color} dark:text-slate-200`} />
            </div>

            <div className="flex flex-col justify-between h-full pr-6 sm:pr-7">
              <div className="mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight min-h-[22px] flex items-center min-w-0 break-words pr-1">
                  {card.title}
                </span>
              </div>

              <div className="my-1.5">
                <span className={`text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white ${card.pulse ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                  {card.value}
                </span>
              </div>

              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

