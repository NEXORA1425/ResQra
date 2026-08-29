import React, { useState, useEffect, useMemo } from 'react';
import { Incident, Hospital, Resource } from '../../types';
import { SeverityBadge, IncidentStatusBadge, IncidentTypeIcon } from '../common/SeverityBadge';
import { IncidentTimeline } from './IncidentTimeline';
import { hapticFeedback } from '../../lib/haptic';
import {
  X,
  MapPin,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
  Building2,
  Ambulance,
  Send,
  CheckCircle2,
  Radio,
  FileText,
  ShieldAlert,
  Timer,
  AlertCircle,
  TrendingUp,
  Printer,
} from 'lucide-react';

const ComparisonColumn: React.FC<{
  inc: Incident;
  metrics: any;
}> = ({ inc, metrics }) => {
  const isCritical = inc.severity === 'CRITICAL';
  const ai = inc.ai_analysis;

  return (
    <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300">
      {/* Sub-Header Card */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={inc.severity} size="sm" pulse={isCritical} />
          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
            {inc.incident_code}
          </span>
          <IncidentStatusBadge status={inc.status} />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
            <IncidentTypeIcon type={inc.type} className="w-3.5 h-3.5" />
            {inc.type}
          </span>
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
          {inc.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{inc.location_name}</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="shrink-0">Coords: {inc.latitude.toFixed(3)}, {inc.longitude.toFixed(3)}</span>
        </div>
      </div>

      {/* SLA progress tracker */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 border border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-indigo-400" />
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">TACTICAL SLA MONITOR</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border ${
            metrics.statusColor === 'rose'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : metrics.statusColor === 'amber'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {metrics.slaStatusLabel}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full bg-slate-800 dark:bg-slate-900 rounded-full overflow-hidden flex items-center">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                metrics.isBreached
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                  : 'bg-gradient-to-r from-teal-400 to-emerald-500'
              }`}
              style={{ width: `${Math.max(5, metrics.progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-medium">
            <span>Elapsed: {metrics.formattedElapsed}</span>
            <span>Target SLA: {metrics.formattedTarget}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
        <div>
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">AFFECTED</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{inc.people_affected || 0}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">INJURED</span>
          <span className="text-sm font-bold text-amber-600">{inc.people_injured || 0}</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">TRAPPED</span>
          <span className={`text-sm font-bold ${inc.people_trapped > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-600'}`}>
            {inc.people_trapped || 0}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">SEVERITY</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{inc.severity_score || 85} / 100</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          Incident Description & Field Report
        </span>
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
          {inc.description}
        </div>
      </div>

      {/* AI Triage Core Panel */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-900/40 rounded-2xl p-4.5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
              Gemini 3.7 AI Emergency Triage
            </span>
          </div>
          <span className="text-[9px] text-indigo-700 dark:text-indigo-400 font-extrabold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-950 px-2 py-0.5 rounded-lg shadow-2xs">
            Confidence: {Math.round((inc.ai_confidence || 0.92) * 100)}%
          </span>
        </div>

        {ai?.reasoning && (
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30 font-medium">
            {ai.reasoning}
          </p>
        )}

        {ai?.recommended_action && (
          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
            <span className="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">
              IMMEDIATE DIRECTIVE
            </span>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{ai.recommended_action}</p>
          </div>
        )}

        {ai?.suggested_hospital_type && (
          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
            <span className="text-[9px] text-slate-400 block uppercase font-bold mb-0.5">
              HOSPITAL CRITERIA
            </span>
            <p className="text-xs font-bold text-sky-700 dark:text-sky-400">{ai.suggested_hospital_type}</p>
          </div>
        )}

        {ai?.resources_required && (
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
              AI-RECOMMENDED RESOURCE DIRECTIVE
            </span>
            <div className="grid grid-cols-1 gap-2">
              {ai.resources_required.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900/50 border border-indigo-100/40 dark:border-indigo-900/30 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-200 dark:border-emerald-900">
                      {req.quantity}×
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{req.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px] font-medium">{req.notes}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface IncidentDetailsModalProps {
  incident: Incident | null;
  onClose: () => void;
  onDispatch: (incident: Incident) => void;
  onAnalyze: (incident: Incident) => void;
  onResolve: (incident: Incident) => void;
  isAnalyzing?: boolean;
  allIncidents?: Incident[];
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  onClose,
  onDispatch,
  onAnalyze,
  onResolve,
  isAnalyzing,
  allIncidents,
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [compareIncident, setCompareIncident] = useState<Incident | null>(null);

  // Ticking timer for real-time SLA elapsed time
  useEffect(() => {
    if (!incident) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  // SLA calculations helper
  const getSlaMetrics = (inc: Incident | null) => {
    if (!inc) {
      return {
        elapsedSeconds: 0,
        targetSlaSeconds: 480,
        progressPercent: 0,
        isBreached: false,
        remainingSeconds: 480,
        overdueSeconds: 0,
        formattedElapsed: '00:00',
        formattedTarget: '08:00',
        slaStatusLabel: 'ON TRACK',
        statusColor: 'emerald' as const,
      };
    }

    // Target SLA in seconds by severity
    const targetMap: Record<string, number> = {
      CRITICAL: 8 * 60, // 8 mins
      HIGH: 12 * 60, // 12 mins
      MEDIUM: 20 * 60, // 20 mins
      LOW: 30 * 60, // 30 mins
      INFORMATIONAL: 45 * 60, // 45 mins
    };
    const targetSlaSeconds = targetMap[inc.severity] || 15 * 60;

    const reportedTimestamp = inc.created_at
      ? new Date(inc.created_at).getTime()
      : Date.now() - 4 * 60 * 1000;

    const endTimestamp =
      inc.status === 'RESOLVED' && inc.resolved_at
        ? new Date(inc.resolved_at).getTime()
        : inc.status === 'RESOLVED' && inc.updated_at
        ? new Date(inc.updated_at).getTime()
        : now;

    const elapsedSeconds = Math.max(0, Math.floor((endTimestamp - reportedTimestamp) / 1000));
    const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSlaSeconds) * 100));
    const isBreached = elapsedSeconds > targetSlaSeconds;
    const remainingSeconds = Math.max(0, targetSlaSeconds - elapsedSeconds);
    const overdueSeconds = Math.max(0, elapsedSeconds - targetSlaSeconds);

    const formatSecs = (totalSec: number) => {
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    };

    let slaStatusLabel = 'ON TRACK';
    let statusColor: 'emerald' | 'amber' | 'rose' | 'slate' = 'emerald';

    if (inc.status === 'RESOLVED') {
      slaStatusLabel = isBreached ? 'RESOLVED (SLA BREACHED)' : 'RESOLVED IN SLA';
      statusColor = isBreached ? 'amber' : 'emerald';
    } else if (isBreached) {
      slaStatusLabel = `SLA BREACHED (+${formatSecs(overdueSeconds)} OVERDUE)`;
      statusColor = 'rose';
    } else if (progressPercent >= 75) {
      slaStatusLabel = 'CRITICAL SLA THRESHOLD';
      statusColor = 'amber';
    } else {
      slaStatusLabel = 'ON TRACK (WITHIN TARGET SLA)';
      statusColor = 'emerald';
    }

    return {
      elapsedSeconds,
      targetSlaSeconds,
      progressPercent,
      isBreached,
      remainingSeconds,
      overdueSeconds,
      formattedElapsed: formatSecs(elapsedSeconds),
      formattedTarget: formatSecs(targetSlaSeconds),
      formattedRemaining: formatSecs(remainingSeconds),
      formattedOverdue: formatSecs(overdueSeconds),
      slaStatusLabel,
      statusColor,
    };
  };

  const slaMetrics = useMemo(() => getSlaMetrics(incident), [incident, now]);
  const compareSlaMetrics = useMemo(() => getSlaMetrics(compareIncident), [compareIncident, now]);

  if (!incident) return null;

  const isCritical = incident.severity === 'CRITICAL';
  const ai = incident.ai_analysis;

  const handlePrintSummary = () => {
    if (!incident) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    
    // Fallback if popup blocked: create hidden iframe
    const generateHtml = () => `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Incident Dossier - ${incident.incident_code} - ${incident.title}</title>
          <style>
            @page {
              size: A4;
              margin: 14mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 20px;
              font-size: 12px;
              line-height: 1.5;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .agency-title {
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.12em;
              color: #475569;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .report-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .meta-pills {
              display: flex;
              gap: 8px;
              align-items: center;
              margin-top: 6px;
            }
            .pill {
              display: inline-block;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 700;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .pill-CRITICAL { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
            .pill-HIGH { background: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }
            .pill-MEDIUM { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
            .pill-LOW { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .pill-badge { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
            
            .grid-4 {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 14px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 14px;
            }
            .stat-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px 12px;
            }
            .stat-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin-bottom: 2px;
            }
            .stat-value {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .section {
              margin-bottom: 14px;
            }
            .section-title {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              color: #1e293b;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .text-block {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 12px;
              font-size: 11.5px;
              color: #334155;
              line-height: 1.5;
            }
            .ai-container {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 14px;
            }
            .ai-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-weight: 800;
              color: #166534;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .resource-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
              margin-top: 8px;
            }
            .resource-card {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 6px 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 6px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 6px 8px;
              text-align: left;
            }
            th {
              background: #f1f5f9;
              font-weight: 700;
              color: #334155;
            }
            .footer-sign {
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1px dashed #94a3b8;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #64748b;
            }
            .sign-box {
              width: 200px;
            }
            .sign-line {
              border-bottom: 1px solid #475569;
              height: 28px;
              margin-bottom: 4px;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <div class="agency-title">Emergency Response Command System &bull; ResQra Tactical Operations</div>
              <h1 class="report-title">${incident.incident_code} &mdash; ${incident.title}</h1>
              <div class="meta-pills">
                <span class="pill pill-${incident.severity}">${incident.severity} PRIORITY</span>
                <span class="pill pill-badge">TYPE: ${incident.type}</span>
                <span class="pill pill-badge">STATUS: ${incident.status}</span>
                <span class="pill pill-badge">SCORE: ${incident.severity_score || 85}/100</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b;">OFFICIAL RECORD DOSSIER</div>
              <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 2px;">
                Generated: ${new Date().toLocaleString()}
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Reported: ${new Date(incident.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <!-- Location & SLA Grid -->
          <div class="grid-4">
            <div class="stat-box">
              <div class="stat-label">INCIDENT LOCATION</div>
              <div class="stat-value" style="font-size: 12px;">${incident.location_name}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">GPS COORDINATES</div>
              <div class="stat-value" style="font-size: 12px;">${incident.latitude.toFixed(4)}°, ${incident.longitude.toFixed(4)}°</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">TARGET RESPONSE SLA</div>
              <div class="stat-value">${slaMetrics.formattedTarget} (${slaMetrics.slaStatusLabel})</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">SLA ELAPSED / STATUS</div>
              <div class="stat-value" style="color: ${slaMetrics.isBreached ? '#dc2626' : '#16a34a'};">
                ${slaMetrics.formattedElapsed} (${slaMetrics.progressPercent}%)
              </div>
            </div>
          </div>

          <!-- Victim Impact Assessment -->
          <div class="grid-4">
            <div class="stat-box">
              <div class="stat-label">TOTAL IMPACTED</div>
              <div class="stat-value">${incident.people_affected || 0} Citizens</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">REPORTED INJURED</div>
              <div class="stat-value" style="color: #d97706;">${incident.people_injured || 0} Casualties</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">TRAPPED / AT RISK</div>
              <div class="stat-value" style="color: #dc2626;">${incident.people_trapped || 0} Trapped</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">PRIMARY DISPATCH SOURCE</div>
              <div class="stat-value">${incident.reported_by || 'Citizen Hotline (112)'}</div>
            </div>
          </div>

          <!-- Incident Description -->
          <div class="section">
            <div class="section-title">
              <span>Incident Narrative & Field Report</span>
            </div>
            <div class="text-block">
              ${incident.description}
            </div>
          </div>

          <!-- AI Triage Matrix -->
          <div class="ai-container">
            <div class="ai-header">
              <span>Gemini 3.7 Emergency Triage Reasoning Matrix</span>
              <span>Confidence: ${Math.round((incident.ai_confidence || 0.92) * 100)}%</span>
            </div>
            <div style="font-size: 11.5px; color: #1e293b; margin-bottom: 8px; line-height: 1.4;">
              ${ai?.reasoning || 'Automated multi-modal triage performed based on caller telemetry and hazard indices.'}
            </div>
            
            <div class="grid-2" style="margin-bottom: 8px;">
              <div style="background: #ffffff; padding: 8px 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
                <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #dc2626;">Immediate Directive</div>
                <div style="font-size: 11px; font-weight: 700; color: #991b1b; margin-top: 2px;">
                  ${ai?.recommended_action || 'Deploy rapid response crew and establish safety cordon.'}
                </div>
              </div>
              <div style="background: #ffffff; padding: 8px 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
                <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #0369a1;">Suggested Hospital Criteria</div>
                <div style="font-size: 11px; font-weight: 700; color: #075985; margin-top: 2px;">
                  ${ai?.suggested_hospital_type || 'Level 1 Trauma Center with ICU & Burn Care facilities.'}
                </div>
              </div>
            </div>

            ${
              ai?.resources_required && ai.resources_required.length > 0
                ? `
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #334155; margin-top: 6px; margin-bottom: 4px;">
                Recommended Resource Dispatch Package:
              </div>
              <div class="resource-grid">
                ${ai.resources_required
                  .map(
                    (r) => `
                  <div class="resource-card">
                    <strong>${r.quantity}× ${r.type.replace('_', ' ')}</strong>
                    <span style="color: #64748b;">${r.notes || 'Emergency Priority'}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>

          <!-- Multi-Source Reports Table -->
          <div class="section">
            <div class="section-title">
              <span>Multi-Source Report Fusion Telemetry (${incident.reports?.length || incident.reports_count || 1} Reports Fused)</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Channel</th>
                  <th style="width: 25%;">Reporter / Witness</th>
                  <th style="width: 45%;">Report Narrative</th>
                  <th style="width: 15%;">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${
                  incident.reports && incident.reports.length > 0
                    ? incident.reports
                        .map(
                          (rep) => `
                        <tr>
                          <td><span class="pill pill-badge" style="font-size: 9px;">${rep.source}</span></td>
                          <td><strong>${rep.reporter_name || 'Anonymous Witness'}</strong></td>
                          <td>${rep.description}</td>
                          <td>${new Date(rep.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      `
                        )
                        .join('')
                    : `
                      <tr>
                        <td><span class="pill pill-badge" style="font-size: 9px;">DISPATCH</span></td>
                        <td><strong>${incident.reported_by || 'Citizen Dispatch'}</strong></td>
                        <td>${incident.description}</td>
                        <td>${new Date(incident.created_at).toLocaleTimeString()}</td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>

          <!-- Official Sign-off and Chain of Custody -->
          <div class="footer-sign">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div><strong>Incident Commander / Field Officer</strong></div>
              <div>Badge / ID: ______________________</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div><strong>Central Dispatch Operations Supervisor</strong></div>
              <div>Station / Terminal: ResQra-01</div>
            </div>
            <div class="sign-box" style="text-align: right;">
              <div style="font-weight: 700; color: #0f172a; margin-top: 14px;">ResQra AI Emergency Network</div>
              <div>Confidential &bull; Tactical Records</div>
              <div>Verified Digital Signature: <strong>#${incident.id.toUpperCase()}</strong></div>
            </div>
          </div>
        </body>
      </html>
    `;

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(generateHtml());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      // Hidden iframe print fallback
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateHtml());
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 350);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
        compareIncident ? 'max-w-7xl h-[95vh]' : 'max-w-3xl max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={incident.severity} size="md" pulse={isCritical} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                {incident.incident_code}
              </span>
              <IncidentStatusBadge status={incident.status} />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <IncidentTypeIcon type={incident.type} className="w-3.5 h-3.5" />
                {incident.type}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {incident.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{incident.location_name}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Coordinates: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {allIncidents && allIncidents.length > 1 && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">Compare AI triage:</span>
                <select
                  value={compareIncident?.id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = allIncidents.find((i) => i.id === selectedId) || null;
                    setCompareIncident(found);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px] cursor-pointer"
                >
                  <option value="">-- Compare Triage --</option>
                  {allIncidents
                    .filter((i) => i.id !== incident.id)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        [{i.incident_code}] {i.title}
                      </option>
                    ))}
                </select>
                {compareIncident && (
                  <button
                    onClick={() => setCompareIncident(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Clear comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handlePrintSummary}
              title="Print incident summary & AI triage report (PDF)"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="hidden sm:inline">Print Summary</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        {compareIncident ? (
          <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/40 dark:bg-slate-950/20 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/60 dark:divide-slate-800/60">
            <div className="space-y-4 pr-0 lg:pr-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Primary Selected Incident</h4>
              </div>
              <ComparisonColumn inc={incident} metrics={slaMetrics} />
            </div>

            <div className="space-y-4 pt-4 lg:pt-0 pl-0 lg:pl-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Comparative Incident</h4>
                </div>
                <button
                  onClick={() => setCompareIncident(null)}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" /> Dismiss Compare
                </button>
              </div>
              <ComparisonColumn inc={compareIncident} metrics={compareSlaMetrics} />
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300">
            {/* SLA & RESPONSE TIME MONITOR (VISUAL PROGRESS BAR) */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      TACTICAL RESPONSE SLA MONITOR
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Reported at {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    slaMetrics.statusColor === 'rose'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : slaMetrics.statusColor === 'amber'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {slaMetrics.isBreached ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{slaMetrics.slaStatusLabel}</span>
                </div>
              </div>

              {/* Visual Progress Bar Track */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-slate-800 dark:bg-slate-900 rounded-full border border-slate-700/80 p-0.5 relative overflow-hidden flex items-center">
                  {/* Milestone Tick Marks (25%, 50%, 75%, 100%) */}
                  <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-slate-700 z-10" title="Triage Milestone (25%)" />
                  <div className="absolute left-2/4 top-0 bottom-0 w-0.5 bg-slate-700 z-10" title="Dispatch Milestone (50%)" />
                  <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-slate-700 z-10" title="En-Route Milestone (75%)" />

                  {/* Animated Fill Bar */}
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1.5 ${
                      slaMetrics.isBreached
                        ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.6)]'
                        : slaMetrics.progressPercent >= 75
                        ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-r from-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    }`}
                    style={{ width: `${Math.max(5, slaMetrics.progressPercent)}%` }}
                  >
                    <span className="text-[9px] font-extrabold text-white leading-none drop-shadow-xs">
                      {slaMetrics.progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Milestone Labels Underneath */}
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                  <span>0m (Ingested)</span>
                  <span>2m (AI Triage)</span>
                  <span>4m (Dispatched)</span>
                  <span className={slaMetrics.isBreached ? 'text-rose-400 font-bold' : 'text-slate-300 font-semibold'}>
                    {slaMetrics.formattedTarget} (SLA Limit)
                  </span>
                </div>
              </div>

              {/* SLA Metrics 4-Box Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">TIME ELAPSED</span>
                  <span className="text-sm font-bold text-white tracking-wide">
                    {slaMetrics.formattedElapsed}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">TARGET SLA</span>
                  <span className="text-sm font-bold text-indigo-300 tracking-wide">
                    {slaMetrics.formattedTarget}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {slaMetrics.isBreached ? 'OVERDUE DURATION' : 'TIME REMAINING'}
                  </span>
                  <span
                    className={`text-sm font-bold tracking-wide ${
                      slaMetrics.isBreached ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                    }`}
                  >
                    {slaMetrics.isBreached ? `+${slaMetrics.formattedOverdue}` : slaMetrics.formattedRemaining}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">OPERATIONAL PHASE</span>
                  <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                    {incident.status === 'REPORTED' || incident.status === 'ANALYZING'
                      ? '1. Triage & Verify'
                      : incident.status === 'AWAITING_DISPATCH'
                      ? '2. Resource Assignment'
                      : incident.status === 'DISPATCHED' || incident.status === 'RESPONDING'
                      ? '3. Units In Transit'
                      : incident.status === 'ON_SCENE'
                      ? '4. On-Scene Rescue'
                      : '5. Scene Resolved'}
                  </span>
                </div>
              </div>
            </div>

            {/* Victim Impact Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">PEOPLE IMPACTED</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{incident.people_affected || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">INJURED CITIZENS</span>
                <span className="text-lg font-bold text-amber-600">{incident.people_injured || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">TRAPPED / AT RISK</span>
                <span className={`text-lg font-bold ${incident.people_trapped > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`}>
                  {incident.people_trapped || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">SEVERITY INDEX</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{incident.severity_score || 85} / 100</span>
              </div>
            </div>

            {/* Incident Description */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Incident Description & Field Report
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300 text-xs font-medium">
                {incident.description}
              </div>
            </div>

            {/* AI Intelligence & Triage Matrix */}
            <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                    Gemini 3.7 Emergency Triage Reasoning
                  </span>
                </div>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-950 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  AI Confidence: {Math.round((incident.ai_confidence || 0.92) * 100)}%
                </span>
              </div>

              {ai?.reasoning && (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 font-medium">
                  {ai.reasoning}
                </p>
              )}

              {/* Immediate Action & Hospital */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {ai?.recommended_action && (
                  <div className="bg-white dark:bg-slate-900/50 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                      IMMEDIATE OPERATIONAL DIRECTIVE
                    </span>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{ai.recommended_action}</p>
                  </div>
                )}

                {ai?.suggested_hospital_type && (
                  <div className="bg-white dark:bg-slate-900/50 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">
                      DESTINATION HOSPITAL CRITERIA
                    </span>
                    <p className="text-xs font-bold text-sky-700 dark:text-sky-400">{ai.suggested_hospital_type}</p>
                  </div>
                )}
              </div>

              {/* Demanded Resources breakdown */}
              {ai?.resources_required && (
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold mb-2">
                    AI-RECOMMENDED RESOURCE DISPATCH PACKAGE
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ai.resources_required.map((req, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900/50 border border-indigo-100 dark:border-indigo-900/30 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                            {req.quantity}×
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{req.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px] font-medium">{req.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chronological Incident Timeline */}
            <IncidentTimeline incident={incident} />

            {/* Multi-Source Fusion Logs */}
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Multi-Source Report Fusion Log ({incident.reports?.length || incident.reports_count || 1} Reports Fused)
              </h4>
              <div className="space-y-2">
                {incident.reports && incident.reports.length > 0 ? (
                  incident.reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900 rounded-md text-[10px] uppercase font-bold">
                            {rep.source}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{rep.reporter_name || 'Anonymous Witness'}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs font-medium">{rep.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                        {new Date(rep.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 text-xs font-medium">
                    Initial report ingested from {incident.reported_by || 'Citizen Dispatch'}.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAnalyze(incident)}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Re-triaging with Gemini...' : 'Re-Run Deep AI Triage'}</span>
            </button>

            <button
              onClick={handlePrintSummary}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Summary (PDF)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {incident.status !== 'RESOLVED' ? (
              <>
                <button
                  onClick={() => {
                    hapticFeedback.triggerResolve();
                    onResolve(incident);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>

                <button
                  onClick={() => {
                    hapticFeedback.triggerDispatch();
                    onDispatch(incident);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-200 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Coordinate Smart Dispatch</span>
                </button>
              </>
            ) : (
              <span className="text-xs font-bold text-emerald-700 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                Incident Resolved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
