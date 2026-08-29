import React from 'react';
import { Severity, IncidentType, IncidentStatus, ResourceStatus, DispatchStatus } from '../../types';
import {
  Flame,
  Waves,
  Car,
  HeartPulse,
  Building2,
  AlertTriangle,
  Train,
  Biohazard,
  HelpCircle,
} from 'lucide-react';

export const SeverityBadge: React.FC<{ severity: Severity; size?: 'sm' | 'md' | 'lg'; pulse?: boolean }> = ({
  severity,
  size = 'md',
  pulse = true,
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  switch (severity) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-xs ${sizeClasses} ${
            pulse ? 'beacon-critical' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg uppercase tracking-wider bg-yellow-50 text-yellow-800 border border-yellow-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Medium
        </span>
      );
    case 'LOW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Low
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          Info
        </span>
      );
  }
};

export const IncidentTypeIcon: React.FC<{ type: IncidentType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'FIRE':
      return <Flame className={`${className} text-orange-500`} />;
    case 'FLOOD':
      return <Waves className={`${className} text-cyan-600`} />;
    case 'ROAD_ACCIDENT':
      return <Car className={`${className} text-amber-600`} />;
    case 'MEDICAL':
      return <HeartPulse className={`${className} text-rose-500`} />;
    case 'BUILDING_COLLAPSE':
      return <Building2 className={`${className} text-amber-600`} />;
    case 'HAZMAT':
      return <Biohazard className={`${className} text-emerald-600`} />;
    case 'RAILWAY':
      return <Train className={`${className} text-blue-600`} />;
    case 'EARTHQUAKE':
      return <AlertTriangle className={`${className} text-yellow-600`} />;
    default:
      return <HelpCircle className={`${className} text-slate-500`} />;
  }
};

export const IncidentStatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  const [isPulsing, setIsPulsing] = React.useState(false);
  const prevStatusRef = React.useRef<IncidentStatus | null>(null);

  React.useEffect(() => {
    if (prevStatusRef.current !== null && prevStatusRef.current !== status) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1200);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [status]);

  const map: Record<IncidentStatus, { label: string; color: string }> = {
    REPORTED: { label: 'Reported', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ANALYZING: { label: 'AI Analyzing', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' },
    VERIFIED: { label: 'Verified', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    AWAITING_DISPATCH: { label: 'Awaiting Dispatch', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    DISPATCHED: { label: 'Dispatched', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    RESPONDING: { label: 'En Route', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    ON_SCENE: { label: 'On Scene', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    RESOLVED: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  const item = map[status] || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border transition-all duration-500 ease-in-out origin-center ${
        item.color
      } ${isPulsing ? 'animate-status-pulse' : ''}`}
    >
      {item.label}
    </span>
  );
};

export const ResourceStatusBadge: React.FC<{ status: ResourceStatus }> = ({ status }) => {
  const map: Record<ResourceStatus, { label: string; color: string; dot: string }> = {
    AVAILABLE: { label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    DISPATCHED: { label: 'Dispatched', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
    BUSY: { label: 'Busy (On Scene)', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    OFFLINE: { label: 'Offline', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    MAINTENANCE: { label: 'Maintenance', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  };

  const item = map[status] || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${item.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

