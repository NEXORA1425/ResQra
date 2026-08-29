import React, { useMemo } from 'react';
import { Incident } from '../../types';
import {
  BellRing,
  Sparkles,
  Send,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Radio,
  Timer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  phase: 'INGESTION' | 'AI_TRIAGE' | 'DISPATCH' | 'ON_SCENE' | 'RESOLUTION' | 'STATUS_UPDATE';
  title: string;
  description: string;
  timestamp: string;
  relativeTimeOffset: string;
  badgeLabel: string;
  badgeColor: 'blue' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'cyan' | 'slate';
  icon: React.ElementType;
  metaItems?: { label: string; value: string }[];
  isCompleted: boolean;
  isCurrent: boolean;
}

interface IncidentTimelineProps {
  incident: Incident;
  className?: string;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incident, className = '' }) => {
  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];
    const baseTimeMs = new Date(incident.created_at || Date.now()).getTime();

    const formatOffset = (eventTimeMs: number) => {
      const diffSecs = Math.max(0, Math.floor((eventTimeMs - baseTimeMs) / 1000));
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatClock = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch {
        return '00:00:00';
      }
    };

    // 1. Initial Alert Event
    list.push({
      id: 'event-alert-ingested',
      phase: 'INGESTION',
      title: 'Emergency Alert Ingested',
      description: `Report received via ${incident.reported_by || 'Citizen SOS (112)'} at ${incident.location_name}. Caller noted: "${incident.description.slice(0, 95)}${incident.description.length > 95 ? '...' : ''}"`,
      timestamp: incident.created_at,
      relativeTimeOffset: 'T+00:00',
      badgeLabel: 'ALERT INGESTION',
      badgeColor: 'blue',
      icon: BellRing,
      metaItems: [
        { label: 'Reporter', value: incident.reported_by || 'Citizen Hotline' },
        { label: 'Initial Impact', value: `${incident.people_affected || 1} citizens` },
        { label: 'Coordinates', value: `${incident.latitude.toFixed(4)}°, ${incident.longitude.toFixed(4)}°` },
      ],
      isCompleted: true,
      isCurrent: incident.status === 'REPORTED',
    });

    // 1b. Additional Fused Reports (if any)
    if (incident.reports && incident.reports.length > 1) {
      const fusedRep = incident.reports[1];
      const repTimeMs = new Date(fusedRep.timestamp).getTime();
      list.push({
        id: 'event-report-fused',
        phase: 'INGESTION',
        title: `Multi-Source Telemetry Fused (+${incident.reports.length - 1} Signals)`,
        description: `Corroborating witness dispatch merged from ${fusedRep.reporter_name || 'Field Sensor'} (${fusedRep.source}).`,
        timestamp: fusedRep.timestamp,
        relativeTimeOffset: formatOffset(repTimeMs),
        badgeLabel: 'DATA FUSION',
        badgeColor: 'cyan',
        icon: Radio,
        metaItems: [
          { label: 'Source', value: fusedRep.source },
          { label: 'Fused Count', value: `${incident.reports.length} Reports` },
        ],
        isCompleted: true,
        isCurrent: false,
      });
    }

    // 2. AI Triage Event
    const triageTimeMs = incident.ai_analysis?.generated_at
      ? new Date(incident.ai_analysis.generated_at).getTime()
      : baseTimeMs + 24 * 1000;
    const triageIso = new Date(triageTimeMs).toISOString();

    const hasAI = Boolean(incident.ai_analysis || incident.severity_score);
    list.push({
      id: 'event-ai-triage',
      phase: 'AI_TRIAGE',
      title: 'Gemini 3.7 Multimodal Triage Completed',
      description: incident.ai_analysis?.reasoning?.[0] ||
        incident.ai_analysis?.recommended_action ||
        `Automated triage indexed severity at ${incident.severity_score}/100 with ${(incident.ai_confidence ? incident.ai_confidence * 100 : 92).toFixed(0)}% AI confidence. Priority class set to ${incident.severity}.`,
      timestamp: triageIso,
      relativeTimeOffset: formatOffset(triageTimeMs),
      badgeLabel: 'AI TRIAGE MATRIX',
      badgeColor: 'indigo',
      icon: Sparkles,
      metaItems: [
        { label: 'Severity Index', value: `${incident.severity_score || 85}/100 (${incident.severity})` },
        { label: 'AI Confidence', value: `${((incident.ai_confidence || 0.92) * 100).toFixed(0)}%` },
        { label: 'Suggested Care', value: incident.ai_analysis?.recommended_hospital_specialty || 'Level-1 Trauma' },
      ],
      isCompleted: hasAI && incident.status !== 'REPORTED',
      isCurrent: incident.status === 'ANALYZING',
    });

    // 3. Dispatch Deployment Event
    const isDispatchedOrBeyond = [
      'AWAITING_DISPATCH',
      'DISPATCHED',
      'RESPONDING',
      'ON_SCENE',
      'RESOLVED',
    ].includes(incident.status);

    const dispatchTimeMs = baseTimeMs + 78 * 1000;
    const dispatchIso = new Date(dispatchTimeMs).toISOString();

    if (isDispatchedOrBeyond) {
      const activeDispatches = incident.dispatches || [];
      const hasSpecificDispatches = activeDispatches.length > 0;
      
      list.push({
        id: 'event-dispatch-deployment',
        phase: 'DISPATCH',
        title: incident.status === 'AWAITING_DISPATCH' ? 'Resource Package Formulated' : 'Tactical Units Dispatched',
        description: incident.status === 'AWAITING_DISPATCH'
          ? 'Recommended rescue assets packaged and queued for commander authorization.'
          : hasSpecificDispatches
          ? `Mission orders dispatched to ${activeDispatches.length} emergency unit(s). Priority sirens active.`
          : `Nearest available emergency response fleet assigned and routed to ${incident.location_name}.`,
        timestamp: dispatchIso,
        relativeTimeOffset: formatOffset(dispatchTimeMs),
        badgeLabel: incident.status === 'AWAITING_DISPATCH' ? 'DISPATCH QUEUED' : 'FLEET DEPLOYED',
        badgeColor: incident.status === 'AWAITING_DISPATCH' ? 'amber' : 'rose',
        icon: Send,
        metaItems: [
          {
            label: 'Phase',
            value: incident.status === 'AWAITING_DISPATCH' ? 'Awaiting Confirmation' : 'Units En-Route',
          },
          {
            label: 'Target SLA',
            value: incident.severity === 'CRITICAL' ? '8 mins' : '15 mins',
          },
        ],
        isCompleted: ['DISPATCHED', 'RESPONDING', 'ON_SCENE', 'RESOLVED'].includes(incident.status),
        isCurrent: incident.status === 'AWAITING_DISPATCH' || incident.status === 'DISPATCHED' || incident.status === 'RESPONDING',
      });
    }

    // 4. On-Scene Arrival Event
    const isOnSceneOrBeyond = ['ON_SCENE', 'RESOLVED'].includes(incident.status);
    if (isOnSceneOrBeyond) {
      const onSceneTimeMs = baseTimeMs + 290 * 1000;
      const onSceneIso = new Date(onSceneTimeMs).toISOString();

      list.push({
        id: 'event-on-scene',
        phase: 'ON_SCENE',
        title: 'First Responders Arrived On-Scene',
        description: `Command post established at coordinates. On-ground victim stabilization and hazard suppression active.`,
        timestamp: onSceneIso,
        relativeTimeOffset: formatOffset(onSceneTimeMs),
        badgeLabel: 'ON-SCENE COMMAND',
        badgeColor: 'amber',
        icon: Users,
        metaItems: [
          { label: 'Casualties Verified', value: `${incident.people_injured || 0} Injured` },
          { label: 'Cordon Status', value: 'Perimeter Secured' },
        ],
        isCompleted: true,
        isCurrent: incident.status === 'ON_SCENE',
      });
    }

    // 5. Resolution Event (or Active Progress Indicator)
    if (incident.status === 'RESOLVED') {
      const resTimeMs = incident.resolved_at
        ? new Date(incident.resolved_at).getTime()
        : incident.updated_at
        ? new Date(incident.updated_at).getTime()
        : baseTimeMs + 480 * 1000;

      list.push({
        id: 'event-resolved',
        phase: 'RESOLUTION',
        title: 'Incident Mission Successfully Resolved',
        description: `All casualties safely evacuated and transferred to trauma facilities. Field commander verified scene safety.`,
        timestamp: new Date(resTimeMs).toISOString(),
        relativeTimeOffset: formatOffset(resTimeMs),
        badgeLabel: 'SCENE RESOLVED',
        badgeColor: 'emerald',
        icon: CheckCircle2,
        metaItems: [
          { label: 'Outcome', value: 'Closed & Archived' },
          { label: 'Resolution Code', value: `#${incident.id.slice(0, 8).toUpperCase()}` },
        ],
        isCompleted: true,
        isCurrent: true,
      });
    }

    return list;
  }, [incident]);

  const getBadgeStyle = (color: TimelineEvent['badgeColor']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60';
      case 'cyan':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/60';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';
      case 'rose':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getIconContainerStyle = (color: TimelineEvent['badgeColor'], isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md animate-pulse';
    }
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300';
      case 'amber':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300';
      case 'rose':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300';
      case 'emerald':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Chronological Incident Timeline & Audit Trail
        </h4>
        <span className="text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500">
          {events.length} Milestones Recorded
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-400 before:via-slate-300 before:to-emerald-400 dark:before:via-slate-700">
        {events.map((evt) => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} className="relative group">
              {/* Milestone Icon Node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center border border-white dark:border-slate-900 transition-transform group-hover:scale-110 ${getIconContainerStyle(
                  evt.badgeColor,
                  evt.isCurrent
                )}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>

              {/* Event Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-2xs">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border font-mono tracking-tight ${getBadgeStyle(
                        evt.badgeColor
                      )}`}
                    >
                      {evt.badgeLabel}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {evt.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                      {evt.relativeTimeOffset}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Narrative / Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-2.5">
                  {evt.description}
                </p>

                {/* Meta pills grid */}
                {evt.metaItems && evt.metaItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    {evt.metaItems.map((meta, idx) => (
                      <div
                        key={idx}
                        className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1"
                      >
                        <span className="text-slate-400 dark:text-slate-500 font-medium">
                          {meta.label}:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {meta.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
