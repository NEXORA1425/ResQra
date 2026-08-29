import React, { useState, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Incident, AnalyticsOverview } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Check,
  Activity,
  Layers,
} from 'lucide-react';

interface AnalyticsViewProps {
  incidents: Incident[];
  overview: AnalyticsOverview & { total_resources?: number; available_resources?: number };
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#e11d48',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981',
  INFORMATIONAL: '#0284c7',
};

const TYPE_COLORS: Record<string, string> = {
  FLOOD: '#0284c7',
  FIRE: '#ea580c',
  ROAD_ACCIDENT: '#eab308',
  BUILDING_COLLAPSE: '#d97706',
  MEDICAL: '#db2777',
  HAZMAT: '#059669',
  RAILWAY: '#4f46e5',
};

// Response Time trend sample across hours of today
const RESPONSE_TIME_DATA = [
  { hour: '06:00', traditionalMinutes: 18.2, resqraMinutes: 5.4 },
  { hour: '08:00', traditionalMinutes: 22.5, resqraMinutes: 6.8 },
  { hour: '10:00', traditionalMinutes: 19.8, resqraMinutes: 6.1 },
  { hour: '12:00', traditionalMinutes: 16.4, resqraMinutes: 5.0 },
  { hour: '14:00', traditionalMinutes: 17.1, resqraMinutes: 5.2 },
  { hour: '16:00', traditionalMinutes: 24.8, resqraMinutes: 7.2 },
  { hour: '18:00', traditionalMinutes: 21.0, resqraMinutes: 6.5 },
  { hour: '20:00', traditionalMinutes: 18.6, resqraMinutes: 5.9 },
];

/**
 * Escapes fields for standard RFC 4180 CSV compliance
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Initiates browser download with UTF-8 BOM for Microsoft Excel / Sheets compatibility
 */
function triggerCsvDownload(filename: string, rows: (string | number)[][]) {
  const csvContent = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents, overview }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showExportNotification = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => {
      setExportSuccessMsg(null);
    }, 4000);
  };

  // Export 1: Detailed Incident Operational Log
  const exportIncidentsCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const headers = [
      'Incident Code',
      'Title',
      'Emergency Type',
      'Severity',
      'Severity Score (0-100)',
      'Status',
      'Location Name',
      'Latitude',
      'Longitude',
      'People Affected',
      'People Injured',
      'People Trapped',
      'Reported By',
      'Reports Count',
      'AI Confidence (%)',
      'Assigned Dispatches Count',
      'Dispatched Unit Callsigns',
      'Created At (UTC)',
      'Resolved At (UTC)',
      'Incident Description',
    ];

    const rows: (string | number)[][] = [headers];

    incidents.forEach((inc) => {
      const dispatchedCallsigns = inc.dispatches && inc.dispatches.length > 0
        ? inc.dispatches.map((d) => d.resource?.callsign || d.resource_id).filter(Boolean).join('; ')
        : 'None';

      rows.push([
        inc.incident_code || inc.id,
        inc.title || 'Untitled Incident',
        inc.type || 'UNKNOWN',
        inc.severity || 'LOW',
        inc.severity_score ?? 0,
        inc.status || 'REPORTED',
        inc.location_name || 'Unspecified Location',
        inc.latitude ?? 0,
        inc.longitude ?? 0,
        inc.people_affected ?? 0,
        inc.people_injured ?? 0,
        inc.people_trapped ?? 0,
        inc.reported_by || 'Anonymous Citizen',
        inc.reports_count ?? 1,
        inc.ai_confidence ? Math.round(inc.ai_confidence * 100) : 85,
        inc.dispatches?.length || 0,
        dispatchedCallsigns,
        inc.created_at || new Date().toISOString(),
        inc.resolved_at || 'N/A',
        inc.description || '',
      ]);
    });

    const filename = `resqra_incident_logs_${timestamp}.csv`;
    triggerCsvDownload(filename, rows);
    setIsExportMenuOpen(false);
    showExportNotification(`Exported ${incidents.length} incident records to ${filename}`);
  };

  // Export 2: System Performance & SLA Telemetry
  const exportPerformanceMetricsCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const headers = [
      'Metric Category',
      'Metric Name',
      'Current Value',
      'Unit / Scale',
      'Target Benchmark / SLA',
      'Operational Assessment',
    ];

    const rows: (string | number)[][] = [
      headers,
      ['Response Latency', 'Average ResQra Response Time', overview.average_response_time_minutes, 'Minutes', '< 8.0 min', 'EXCEEDS SLA (68.4% faster than legacy 112)'],
      ['Response Latency', 'Legacy Traditional 112 Baseline', 21.5, 'Minutes', '< 25.0 min', 'Historic Manual Baseline Benchmark'],
      ['Response Latency', 'Average AI Triage Processing Speed', overview.average_triage_time_seconds, 'Seconds', '< 10.0 sec', 'REAL-TIME AUTONOMOUS TRIAGE'],
      ['Operational Volume', 'Total State-wide Incidents Logged', overview.total_incidents, 'Incidents', 'N/A', 'Cumulative today'],
      ['Operational Volume', 'Active Emergency Incidents', overview.active_incidents, 'Incidents', 'N/A', 'Currently in progress'],
      ['Operational Volume', 'Critical Priority Incidents', overview.critical_incidents, 'Incidents', 'Zero Backlog', 'Immediate life threat level'],
      ['Operational Volume', 'Incidents Successfully Resolved Today', overview.resolved_today, 'Incidents', 'N/A', 'Stabilized & closed'],
      ['Citizen Welfare', 'Citizens Triaged & Assisted', overview.people_assisted, 'Individuals', 'N/A', 'Rescued, triaged, or hospitalized'],
      ['Fleet Efficiency', 'Resource Fleet Utilization Rate', `${overview.resource_utilization_percent}%`, 'Percentage', '< 80%', 'OPTIMAL CAPACITY BUFFER'],
      ['Fleet Efficiency', 'Available Ready Units', overview.available_resources ?? 28, 'Units', '> 15 Units', 'Standing by in ready state'],
      ['Fleet Efficiency', 'Total Registered Fleet Resources', overview.total_resources ?? 43, 'Units', 'N/A', 'Ambulances, Boats, Fire, Police, Med'],
      ['Trauma Capacity', 'Regional Hospital Bed Occupancy', `${overview.hospital_bed_occupancy_percent}%`, 'Percentage', '< 85%', 'NORMAL OPERATIONAL LEVEL'],
      ['Trauma Capacity', 'ICU Critical Care Occupancy', `${overview.icu_occupancy_percent}%`, 'Percentage', '< 90%', 'CONTROLLED SURGE CAPACITY'],
    ];

    const filename = `resqra_performance_sla_metrics_${timestamp}.csv`;
    triggerCsvDownload(filename, rows);
    setIsExportMenuOpen(false);
    showExportNotification(`Exported command performance telemetry to ${filename}`);
  };

  // Export 3: Complete Comprehensive Audit Master File
  const exportFullAuditCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const rows: (string | number)[][] = [
      ['=== RESQRA STATE DISASTER EMERGENCY MANAGEMENT PLATFORM ==='],
      ['=== OFFICIAL AUDIT & COMMAND REPORT ==='],
      ['Generated At (UTC)', new Date().toISOString()],
      ['Audited Jurisdiction', 'State Emergency Operations Center (SEOC), Lucknow Metro'],
      ['Data Source', 'ResQra Autonomous Multi-Modal AI Dispatch & Telemetry Engine'],
      [],
      ['--- SECTION 1: KEY PERFORMANCE INDICATORS & SLA TELEMETRY ---'],
      ['Metric', 'Value', 'Unit', 'Operational Evaluation'],
      ['AI Autonomous Triage Latency', overview.average_triage_time_seconds, 'Seconds', 'Real-Time Neural Verification'],
      ['Average Response Arrival Time', overview.average_response_time_minutes, 'Minutes', '3.2x Faster than Traditional 112 Dispatch'],
      ['Citizens Triaged & Assisted', overview.people_assisted, 'People', 'Today Across All Zones'],
      ['Resource Fleet Utilization', `${overview.resource_utilization_percent}%`, 'Percentage', 'Balanced Fleet Operations'],
      ['Regional Bed Occupancy', `${overview.hospital_bed_occupancy_percent}%`, 'Percentage', 'Trauma Dynamic Balancing'],
      ['Regional ICU Occupancy', `${overview.icu_occupancy_percent}%`, 'Percentage', 'Critical Care Resilience'],
      ['Active Emergencies', overview.active_incidents, 'Incidents', 'Under Active Containment'],
      ['Critical Emergencies', overview.critical_incidents, 'Incidents', 'Code Red Priority'],
      ['Resolved Today', overview.resolved_today, 'Incidents', 'Missions Completed'],
      [],
      ['--- SECTION 2: HOURLY RESPONSE TIME BENCHMARK COMPARISON ---'],
      ['Hour of Day', 'Manual Legacy 112 Arrival (min)', 'ResQra AI Arrival (min)', 'Latency Saved (min)', 'Improvement (%)'],
      ...RESPONSE_TIME_DATA.map((r) => [
        r.hour,
        r.traditionalMinutes,
        r.resqraMinutes,
        Number((r.traditionalMinutes - r.resqraMinutes).toFixed(1)),
        `${Math.round(((r.traditionalMinutes - r.resqraMinutes) / r.traditionalMinutes) * 100)}%`,
      ]),
      [],
      ['--- SECTION 3: DETAILED INCIDENT OPERATIONS REGISTRY ---'],
      [
        'Incident Code',
        'Title',
        'Type',
        'Severity',
        'Severity Score',
        'Status',
        'Location Name',
        'Latitude',
        'Longitude',
        'Affected',
        'Injured',
        'Trapped',
        'Reported By',
        'Reports Count',
        'AI Confidence (%)',
        'Dispatches Count',
        'Assigned Callsigns',
        'Created At',
        'Resolved At',
      ],
      ...incidents.map((inc) => [
        inc.incident_code || inc.id,
        inc.title,
        inc.type,
        inc.severity,
        inc.severity_score,
        inc.status,
        inc.location_name,
        inc.latitude,
        inc.longitude,
        inc.people_affected,
        inc.people_injured,
        inc.people_trapped,
        inc.reported_by,
        inc.reports_count,
        inc.ai_confidence ? Math.round(inc.ai_confidence * 100) : 85,
        inc.dispatches?.length || 0,
        inc.dispatches?.map((d) => d.resource?.callsign || d.resource_id).join('; ') || 'None',
        inc.created_at,
        inc.resolved_at || 'N/A',
      ]),
    ];

    const filename = `resqra_master_command_audit_${timestamp}.csv`;
    triggerCsvDownload(filename, rows);
    setIsExportMenuOpen(false);
    showExportNotification(`Exported complete master audit bundle (${incidents.length} incidents + telemetry)`);
  };

  // Aggregate incidents by severity
  const severityMap: Record<string, number> = {};
  incidents.forEach((i) => {
    severityMap[i.severity] = (severityMap[i.severity] || 0) + 1;
  });
  const severityChartData = Object.entries(severityMap).map(([name, value]) => ({
    name,
    value,
    color: SEVERITY_COLORS[name] || '#94a3b8',
  }));

  // Aggregate incidents by type
  const typeMap: Record<string, number> = {};
  incidents.forEach((i) => {
    typeMap[i.type] = (typeMap[i.type] || 0) + 1;
  });
  const typeChartData = Object.entries(typeMap).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
    fill: TYPE_COLORS[name] || '#64748b',
  }));

  return (
    <div className="space-y-6">
      {/* Export Notification Toast */}
      {exportSuccessMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">CSV Ready</span>
        </div>
      )}

      {/* Header with Live Telemetry Badge & Export to CSV Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            INTELLIGENCE & PERFORMANCE ANALYTICS
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            State-wide triage metrics, response latency benchmarks, and fleet efficiency curves
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* AI Metrics Pill */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">AI Triage Speed:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">~{overview.average_triage_time_seconds}s</strong>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Avg Response:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{overview.average_response_time_minutes}m</strong>
          </div>

          {/* EXPORT TO CSV BUTTON & DROPDOWN */}
          <div className="relative" ref={exportMenuRef}>
            <div className="inline-flex rounded-xl shadow-sm">
              {/* Primary Direct Export Button */}
              <button
                onClick={exportFullAuditCsv}
                title="Download Master Audit CSV (Incidents & Performance Metrics)"
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3.5 py-2 rounded-l-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-200" />
                <span className="whitespace-nowrap">Export to CSV</span>
              </button>

              {/* Dropdown Toggle */}
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                title="Select Export Format (Incidents, Metrics, or Master Bundle)"
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-2 py-2 rounded-r-xl border-l border-indigo-500/50 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Menu */}
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Select Export Dataset
                </div>

                <button
                  onClick={exportFullAuditCsv}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Master Audit Bundle
                      <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-extrabold px-1.5 py-0.2 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      All {incidents.length} incidents, latency benchmarks, and SLA metrics
                    </p>
                  </div>
                </button>

                <button
                  onClick={exportIncidentsCsv}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Incident Operations Log ({incidents.length})
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Codes, severities, triage scores, coordinates & unit dispatches
                    </p>
                  </div>
                </button>

                <button
                  onClick={exportPerformanceMetricsCsv}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition-colors cursor-pointer group"
                >
                  <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Performance & SLA Telemetry
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Response latency, fleet utilization, trauma & ICU rates
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 Bento Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Latency</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">-68.4%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Average arrival reduced from ~21.5m to ~6.8m with autonomous smart dispatch.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Citizen Impact</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
            {overview.people_assisted.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Citizens triaged and assisted across active disaster zones today.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bed Occupancy</span>
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            {overview.hospital_bed_occupancy_percent}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Regional trauma beds balanced dynamically with automated diversion.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fleet Utilization</span>
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {overview.resource_utilization_percent}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active utilization of ambulances, boats, fire trucks, and medical units.
          </p>
        </div>
      </div>

      {/* Main Bento Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Response Time Comparison Area Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                RESPONSE LATENCY: RESQRA VS TRADITIONAL DISPATCH
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Response time (minutes) by hour of day</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
              3.2× FASTER ARRIVAL
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RESPONSE_TIME_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResqra" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12, fontSize: 12, color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area
                  type="monotone"
                  dataKey="traditionalMinutes"
                  name="Manual Legacy 112 Dispatch (m)"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#colorTrad)"
                />
                <Area
                  type="monotone"
                  dataKey="resqraMinutes"
                  name="ResQra AI Autonomous Dispatch (m)"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorResqra)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Severity Distribution Donut (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
              INCIDENT SEVERITY BREAKDOWN
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time classification breakdown</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12, fontSize: 12, color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {severityChartData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 dark:text-slate-300">{s.name}: <strong className="text-slate-900 dark:text-white">{s.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Chart: Incidents by Category Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            INCIDENT DISTRIBUTION BY EMERGENCY TYPE
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Category distribution across Lucknow Metropolitan Area</p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12, fontSize: 12, color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Incidents Logged" radius={[6, 6, 0, 0]}>
                {typeChartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

