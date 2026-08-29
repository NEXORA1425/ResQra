import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Compass,
  Satellite,
  Layers,
  Sparkles,
  Crosshair,
  Info,
  Maximize2,
  Minimize2,
  CloudRain,
  Activity,
  Flame,
  Ambulance,
  Building,
  Shield,
  ChevronDown,
  Check,
  Zap,
} from 'lucide-react';

export type MapEngineType = 'google' | 'tactical';
export type GoogleMapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
export type SeverityFilterType = 'ALL' | 'CRITICAL_HIGH';

interface MapControlBarProps {
  mapEngine: MapEngineType;
  setMapEngine: (engine: MapEngineType) => void;
  mapTypeId: GoogleMapTypeId;
  setMapTypeId: (type: GoogleMapTypeId) => void;
  severityFilter: SeverityFilterType;
  setSeverityFilter: (filter: SeverityFilterType) => void;
  totalIncidentsCount: number;
  criticalIncidentsCount: number;

  // Layer Toggles
  showIncidents: boolean;
  setShowIncidents: (val: boolean) => void;
  showResources: boolean;
  setShowResources: (val: boolean) => void;
  showHospitals: boolean;
  setShowHospitals: (val: boolean) => void;
  showPerimeters: boolean;
  setShowPerimeters: (val: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (val: boolean) => void;
  showWeather: boolean;
  setShowWeather: (val: boolean) => void;

  counts: {
    incidents: number;
    resources: number;
    hospitals: number;
  };

  // AI & Utility Actions
  onTriggerAISuggestions: () => void;
  isAISuggestionsActive: boolean;
  onRecenter: () => void;
  onToggleLegend: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const MapControlBar: React.FC<MapControlBarProps> = ({
  mapEngine,
  setMapEngine,
  mapTypeId,
  setMapTypeId,
  severityFilter,
  setSeverityFilter,
  totalIncidentsCount,
  criticalIncidentsCount,
  showIncidents,
  setShowIncidents,
  showResources,
  setShowResources,
  showHospitals,
  setShowHospitals,
  showPerimeters,
  setShowPerimeters,
  showHeatmap,
  setShowHeatmap,
  showWeather,
  setShowWeather,
  counts,
  onTriggerAISuggestions,
  isAISuggestionsActive,
  onRecenter,
  onToggleLegend,
  isExpanded,
  onToggleExpand,
}) => {
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);

  const engineRef = useRef<HTMLDivElement | null>(null);
  const layersRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (engineRef.current && !engineRef.current.contains(e.target as Node)) {
        setShowEngineDropdown(false);
      }
      if (layersRef.current && !layersRef.current.contains(e.target as Node)) {
        setShowLayersDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute active layer count
  const activeLayersCount = [
    showIncidents,
    showResources,
    showHospitals,
    showPerimeters,
    showHeatmap,
    showWeather,
  ].filter(Boolean).length;

  // View Preset Handler
  const applyPreset = (preset: 'ALL' | 'CRISIS' | 'FLEET' | 'WEATHER') => {
    if (preset === 'ALL') {
      setShowIncidents(true);
      setShowResources(true);
      setShowHospitals(true);
      setShowPerimeters(true);
      setShowHeatmap(true);
      setShowWeather(true);
    } else if (preset === 'CRISIS') {
      setShowIncidents(true);
      setShowPerimeters(true);
      setShowHeatmap(true);
      setShowResources(false);
      setShowHospitals(false);
      setShowWeather(false);
    } else if (preset === 'FLEET') {
      setShowIncidents(true);
      setShowResources(true);
      setShowHospitals(true);
      setShowPerimeters(false);
      setShowHeatmap(false);
      setShowWeather(false);
    } else if (preset === 'WEATHER') {
      setShowIncidents(true);
      setShowWeather(true);
      setShowPerimeters(true);
      setShowHeatmap(true);
      setShowResources(false);
      setShowHospitals(false);
    }
    setShowLayersDropdown(false);
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800/90 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20 shrink-0 text-slate-100">
      {/* LEFT SECTION: Engine Switch, Filter, and AI Optimization */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Base Map Engine Selector Dropdown */}
        <div ref={engineRef} className="relative">
          <button
            id="map-engine-menu-btn"
            onClick={() => {
              setShowEngineDropdown(!showEngineDropdown);
              setShowLayersDropdown(false);
            }}
            className="bg-slate-800/90 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            {mapEngine === 'google' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="capitalize">
                  Google Maps ({mapTypeId})
                </span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Tactical Radar</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Engine & Styles Popover */}
          {showEngineDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900/98 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 z-50 text-xs text-slate-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 block mb-1">
                  Primary Map Engine
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      setMapEngine('google');
                      setShowEngineDropdown(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      mapEngine === 'google'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </button>

                  <button
                    onClick={() => {
                      setMapEngine('tactical');
                      setShowEngineDropdown(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      mapEngine === 'tactical'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Tactical Radar</span>
                  </button>
                </div>
              </div>

              {mapEngine === 'google' && (
                <div className="border-t border-slate-800 pt-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 block mb-1">
                    Google Imagery Layer
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['roadmap', 'satellite', 'hybrid', 'terrain'] as GoogleMapTypeId[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setMapTypeId(type);
                          setShowEngineDropdown(false);
                        }}
                        className={`px-2 py-1.5 rounded-xl font-semibold capitalize flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                          mapTypeId === type
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{type}</span>
                        {mapTypeId === type && <Check className="w-3 h-3 text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Severity Quick Filter */}
        <div className="bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 shadow-xs flex items-center gap-0.5">
          <button
            id="filter-all-events-btn"
            onClick={() => setSeverityFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-750 hover:text-white'
            }`}
          >
            All ({totalIncidentsCount})
          </button>
          <button
            id="filter-critical-events-btn"
            onClick={() => setSeverityFilter('CRITICAL_HIGH')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              severityFilter === 'CRITICAL_HIGH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-400 hover:bg-rose-950/50'
            }`}
          >
            <span>🔥 Critical ({criticalIncidentsCount})</span>
          </button>
        </div>

        {/* 3. AI Optimal Deployment Action */}
        <button
          id="ai-deployment-trigger-btn"
          onClick={onTriggerAISuggestions}
          title="Automatically calculate optimal deployment routes for closest available resources"
          className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isAISuggestionsActive
              ? 'bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 shadow-indigo-500/40'
              : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/25 hover:shadow-indigo-500/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200 shrink-0" />
          <span className="whitespace-nowrap tracking-tight">AI Deployment</span>
        </button>
      </div>

      {/* RIGHT SECTION: Layer Manager Popover, Shortcuts & View Controls */}
      <div className="flex items-center gap-1.5">
        {/* Quick Shortcut: Weather */}
        <button
          id="quick-weather-toggle-btn"
          onClick={() => setShowWeather(!showWeather)}
          title="Toggle Real-Time Environmental Threats & Atmospheric Radar"
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            showWeather
              ? 'bg-sky-600 text-white shadow-sky-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-sky-400 hover:bg-slate-750'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Weather</span>
        </button>

        {/* Quick Shortcut: Heatmap */}
        <button
          id="quick-heatmap-toggle-btn"
          onClick={() => setShowHeatmap(!showHeatmap)}
          title="Toggle D3 Incident Density Heatmap"
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            showHeatmap
              ? 'bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-rose-400 hover:bg-slate-750'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Heatmap</span>
        </button>

        {/* 4. Consolidated Layer Manager Popover */}
        <div ref={layersRef} className="relative">
          <button
            id="map-layers-menu-btn"
            onClick={() => {
              setShowLayersDropdown(!showLayersDropdown);
              setShowEngineDropdown(false);
            }}
            className={`px-3 py-1.5 rounded-xl border shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              showLayersDropdown
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Layers ({activeLayersCount}/6)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Layer Controls Dropdown */}
          {showLayersDropdown && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-slate-900/98 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 z-50 text-xs text-slate-200">
              {/* Presets */}
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Quick Focus Presets
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={() => applyPreset('ALL')}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                  >
                    <span>🌐</span> All Active
                  </button>
                  <button
                    onClick={() => applyPreset('CRISIS')}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                  >
                    <span>🔥</span> Crisis Only
                  </button>
                  <button
                    onClick={() => applyPreset('FLEET')}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                  >
                    <span>🚑</span> Fleet Ops
                  </button>
                  <button
                    onClick={() => applyPreset('WEATHER')}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-sky-950 hover:text-sky-300 text-slate-300 font-bold transition-all text-left flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                  >
                    <span>⛈️</span> Weather
                  </button>
                </div>
              </div>

              {/* Individual Layer Toggles */}
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                  Visible Map Overlays
                </span>

                {/* Incidents */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Incidents</span>
                    <span className="text-[10px] text-slate-400 font-normal">({counts.incidents})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showIncidents}
                    onChange={(e) => setShowIncidents(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Units */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Ambulance className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Rescue Units</span>
                    <span className="text-[10px] text-slate-400 font-normal">({counts.resources})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showResources}
                    onChange={(e) => setShowResources(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Hospitals */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hospitals</span>
                    <span className="text-[10px] text-slate-400 font-normal">({counts.hospitals})</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHospitals}
                    onChange={(e) => setShowHospitals(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Perimeters */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Evacuation Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showPerimeters}
                    onChange={(e) => setShowPerimeters(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Heatmap */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>D3 Crisis Heatmap</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                {/* Weather */}
                <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    <span>Weather Radar</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showWeather}
                    onChange={(e) => setShowWeather(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 5. Recenter Crosshair */}
        <button
          id="recenter-map-btn"
          onClick={onRecenter}
          title="Recenter Map to Command Dispatch Center"
          className="bg-slate-800 text-slate-200 hover:text-white p-2 rounded-xl border border-slate-700 shadow-xs transition-colors hover:bg-slate-750 cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-indigo-400" />
        </button>

        {/* 6. Symbology & Legend Info */}
        <button
          id="map-legend-toggle-btn"
          onClick={onToggleLegend}
          title="Open Tactical Map Legend & Icon Key"
          className="bg-slate-800 text-slate-200 hover:text-white p-2 rounded-xl border border-slate-700 shadow-xs transition-colors hover:bg-slate-750 cursor-pointer"
        >
          <Info className="w-4 h-4 text-slate-300" />
        </button>

        {/* 7. Fullscreen / Height Expansion */}
        <button
          id="map-expand-toggle-btn"
          onClick={onToggleExpand}
          title={isExpanded ? 'Collapse Map View' : 'Expand Map View for Maximum Screen Coverage'}
          className="bg-slate-800 text-slate-200 hover:text-white p-2 rounded-xl border border-slate-700 shadow-xs transition-colors hover:bg-slate-750 cursor-pointer"
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-indigo-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );
};
