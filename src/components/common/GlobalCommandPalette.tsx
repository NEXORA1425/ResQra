import React, { useState, useEffect } from 'react';
import { hapticFeedback } from '../../lib/haptic';
import {
  Search,
  Flame,
  Ambulance,
  Building2,
  Cpu,
  BarChart3,
  MapPin,
  Send,
  Smartphone,
  ShieldQuestion,
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  X,
  Compass,
  ArrowRight,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { Incident, Resource, Hospital } from '../../types';
import { TabType } from '../layout/Navigation';
import { soundManager } from './TacticalAudioAlert';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  onSelectIncident?: (incident: Incident) => void;
  onQuickDispatch?: (incident: Incident) => void;
  onTriggerFloodScenario?: () => void;
  onResetDemo?: () => void;
  onOpenReportModal?: () => void;
  onToggleDarkMode?: () => void;
  darkMode?: boolean;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  incidents,
  resources,
  hospitals,
  onSelectIncident,
  onQuickDispatch,
  onTriggerFloodScenario,
  onResetDemo,
  onOpenReportModal,
  onToggleDarkMode,
  darkMode,
}) => {
  const [query, setQuery] = useState('');

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Matched incidents
  const matchedIncidents = incidents
    .filter(
      (i) =>
        i.title.toLowerCase().includes(normalizedQuery) ||
        i.location_name.toLowerCase().includes(normalizedQuery) ||
        i.incident_code.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 4);

  // Matched resources
  const matchedResources = resources
    .filter(
      (r) =>
        r.name.toLowerCase().includes(normalizedQuery) ||
        r.callsign.toLowerCase().includes(normalizedQuery) ||
        r.type.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 3);

  // Matched hospitals
  const matchedHospitals = hospitals
    .filter(
      (h) =>
        h.name.toLowerCase().includes(normalizedQuery) ||
        (h.address || '').toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 3);

  // Navigation pages
  const pages: Array<{ id: TabType; title: string; desc: string; icon: any }> = [
    { id: 'dashboard', title: 'Command Center Dashboard', desc: 'KPI telemetry & synthesis overview', icon: LayoutDashboard },
    { id: 'map', title: 'Full Tactical Map & GIS View', desc: 'Real-time interactive spatial map & layers', icon: Compass },
    { id: 'incidents', title: 'Live Incidents & AI Triage', desc: 'Prioritized event feed and deep triage', icon: Flame },
    { id: 'dispatch', title: 'Dispatch Operations Center', desc: 'Resource assignment and mission logs', icon: Send },
    { id: 'resources', title: 'Rescue Fleet & Asset Manager', desc: 'Live unit status and GPS tracking', icon: Ambulance },
    { id: 'hospitals', title: 'Hospital Network & Trauma ICU', desc: 'Bed capacity, surge tracking', icon: Building2 },
    { id: 'simulation', title: 'Crisis Simulator (AI)', desc: 'Monte Carlo flood & hazmat forecasting', icon: Cpu },
    { id: 'analytics', title: 'Analytics & Intelligence Reports', desc: 'Historical response time & heatmaps', icon: BarChart3 },
    { id: 'responder', title: 'Field Responder Mobile HUD', desc: 'Real-time navigation and mission status', icon: Smartphone },
    { id: 'citizen', title: 'Citizen Emergency Portal', desc: 'SOS report submission and safe zones', icon: ShieldQuestion },
  ];

  const matchedPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.desc.toLowerCase().includes(normalizedQuery) ||
      p.id.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div
      id="global-command-palette-backdrop"
      className="fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="global-command-palette-container"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any incident, rescue unit, hospital, view, or command..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(82vh-100px)]">
          {/* Quick Actions Strip */}
          {!normalizedQuery && (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 block">
                Quick Shortcuts & Actions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {onOpenReportModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReportModal();
                    }}
                    className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-left hover:border-rose-400 transition-all cursor-pointer group"
                  >
                    <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 mb-1.5" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Report Incident
                    </span>
                    <span className="text-[10px] text-slate-500">Citizen SOS broadcast</span>
                  </button>
                )}

                {onTriggerFloodScenario && (
                  <button
                    onClick={() => {
                      onClose();
                      onTriggerFloodScenario();
                    }}
                    className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-left hover:border-sky-400 transition-all cursor-pointer group"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 mb-1.5" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Trigger Flood Crisis
                    </span>
                    <span className="text-[10px] text-slate-500">Demo crisis injection</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab('map');
                  }}
                  className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-left hover:border-indigo-400 transition-all cursor-pointer group"
                >
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Full Tactical Map
                  </span>
                  <span className="text-[10px] text-slate-500">Interactive GIS radar</span>
                </button>

                {onToggleDarkMode && (
                  <button
                    onClick={() => {
                      onToggleDarkMode();
                    }}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-slate-400 transition-all cursor-pointer group"
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-400 mb-1.5" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600 mb-1.5" />
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Toggle Theme
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {darkMode ? 'Light Theme' : 'Dark Mode'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Incidents */}
          {matchedIncidents.length > 0 && (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 block">
                🚨 Emergency Incidents ({matchedIncidents.length})
              </span>
              <div className="space-y-1.5">
                {matchedIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      onClose();
                      if (onSelectIncident) onSelectIncident(inc);
                      else onNavigateTab('incidents');
                    }}
                    className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {inc.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {inc.incident_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {inc.location_name} ·{' '}
                          <span
                            className={
                              inc.severity === 'CRITICAL'
                                ? 'text-rose-600 font-bold'
                                : 'text-amber-600 font-bold'
                            }
                          >
                            {inc.severity}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onQuickDispatch && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback.triggerDispatch();
                            onClose();
                            onQuickDispatch(inc);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Dispatch
                        </button>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Views */}
          {matchedPages.length > 0 && (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 block">
                🧭 Application Workspaces & Views
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        onClose();
                        onNavigateTab(page.id);
                      }}
                      className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-left transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {page.title}
                          </span>
                          <span className="text-[10px] text-slate-400">{page.desc}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fleet & Hospital Matches */}
          {matchedResources.length > 0 && (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 block">
                🚑 Response Fleet Units
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {matchedResources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      onClose();
                      onNavigateTab('resources');
                    }}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {res.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {res.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{res.callsign}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchedHospitals.length > 0 && (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1.5 block">
                🏥 Hospital & Trauma Centers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {matchedHospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    onClick={() => {
                      onClose();
                      onNavigateTab('hospitals');
                    }}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all cursor-pointer"
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      {hosp.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      {hosp.emergency_beds - hosp.occupied_emergency_beds} Beds Available
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
