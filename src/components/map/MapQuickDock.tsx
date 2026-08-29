import React, { useState } from 'react';
import { hapticFeedback } from '../../lib/haptic';
import {
  Incident,
  Resource,
  Hospital,
  LiveWeatherReport,
} from '../../types';
import {
  Flame,
  Ambulance,
  Building2,
  CloudRain,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  Crosshair,
  Send,
  AlertTriangle,
  Radio,
  CheckCircle,
  Wind,
  Compass,
  ArrowRight,
  Shield,
  Layers,
  Activity,
  X,
} from 'lucide-react';

export type DockTabType = 'incidents' | 'fleet' | 'hospitals' | 'weather' | 'ai';

interface MapQuickDockProps {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  weather: LiveWeatherReport | null;
  onFocusLocation: (lat: number, lng: number, zoom?: number) => void;
  onSelectIncident?: (incident: Incident) => void;
  onQuickDispatch?: (incident: Incident) => void;
  onCalculateAISuggestions: (incident: Incident) => void;
  selectedIncident?: Incident | null;
}

export const MapQuickDock: React.FC<MapQuickDockProps> = ({
  incidents,
  resources,
  hospitals,
  weather,
  onFocusLocation,
  onSelectIncident,
  onQuickDispatch,
  onCalculateAISuggestions,
  selectedIncident,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTabType>('incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Filtered Incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      (inc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.incident_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.location_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      filterSeverity === 'ALL' ||
      (filterSeverity === 'CRITICAL' && inc.severity === 'CRITICAL') ||
      (filterSeverity === 'HIGH' && (inc.severity === 'CRITICAL' || inc.severity === 'HIGH'));
    return matchesSearch && matchesSeverity;
  });

  // Filtered Resources
  const filteredResources = resources.filter((res) => {
    return (
      (res.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.callsign || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filtered Hospitals
  const filteredHospitals = hospitals.filter((hosp) => {
    return (
      (hosp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hosp.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const availableFleetCount = resources.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div className="absolute top-3 left-3 z-30 flex items-start pointer-events-auto">
      {/* Minimized Quick Dock Toggle Pill when closed */}
      {!isOpen && (
        <button
          id="open-map-quick-dock-btn"
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/90 text-white rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs font-extrabold hover:border-indigo-500 hover:scale-[1.02] transition-all cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 group-hover:bg-indigo-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight text-slate-200 group-hover:text-white font-bold">
            Tactical Drawer
          </span>
          <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
            {incidents.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* Expanded Quick Access Tactical Dock */}
      {isOpen && (
        <div className="w-[calc(100vw-48px)] sm:w-84 max-w-[360px] bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100 max-h-[calc(100%-24px)] min-h-[340px] animate-in fade-in slide-in-from-left-4 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Tactical Command Dock
                </h3>
                <p className="text-[9.5px] text-slate-400">Instant access to field telemetry</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Dock"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation Strip */}
          <div className="grid grid-cols-5 bg-slate-950/90 p-1 border-b border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Active Incidents"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[9px]">Alerts ({incidents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Rescue Fleet"
            >
              <Ambulance className="w-3.5 h-3.5" />
              <span className="text-[9px]">Fleet ({availableFleetCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('hospitals')}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'hospitals'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Trauma Hospitals"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-[9px]">Hospitals</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'weather'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Weather Hazards"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span className="text-[9px]">Hazards</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`py-1.5 rounded-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="AI Route Dispatch"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="text-[9px]">AI Route</span>
            </button>
          </div>

          {/* Search & Sub-Filter Bar */}
          {activeTab !== 'weather' && activeTab !== 'ai' && (
            <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/60 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {activeTab === 'incidents' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterSeverity('ALL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      filterSeverity === 'ALL'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
                    }`}
                  >
                    All ({incidents.length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('HIGH')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      filterSeverity === 'HIGH'
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-400 hover:text-amber-300 bg-slate-950/60'
                    }`}
                  >
                    High+ ({incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length})
                  </button>
                  <button
                    onClick={() => setFilterSeverity('CRITICAL')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      filterSeverity === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-400 hover:text-rose-300 bg-slate-950/60'
                    }`}
                  >
                    Critical ({criticalCount})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Incidents List */}
          {activeTab === 'incidents' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-slate-800/40">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching emergency incidents found.
                </div>
              ) : (
                filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`pt-2 first:pt-0 p-2.5 rounded-2xl transition-all ${
                      selectedIncident?.id === inc.id
                        ? 'bg-rose-950/40 border border-rose-600/50'
                        : 'hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500 animate-pulse'
                              : inc.severity === 'HIGH'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-bold text-xs text-slate-100 truncate">
                          {inc.title}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                      📍 {inc.location_name}
                    </p>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60 text-[10px]">
                      {/* Zoom to map */}
                      <button
                        onClick={() => {
                          if (inc.latitude && inc.longitude) {
                            onFocusLocation(inc.latitude, inc.longitude, 16);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer font-semibold"
                      >
                        <Crosshair className="w-3 h-3 text-cyan-400" />
                        <span>Locate</span>
                      </button>

                      {/* AI Deploy */}
                      <button
                        onClick={() => onCalculateAISuggestions(inc)}
                        className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                        title="Calculate optimal 3 unit deployment"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI Route</span>
                      </button>

                      {/* Quick Dispatch */}
                      {onQuickDispatch && (
                        <button
                          onClick={() => {
                            hapticFeedback.triggerDispatch();
                            onQuickDispatch(inc);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 transition-colors cursor-pointer font-bold"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Fleet & Responders */}
          {activeTab === 'fleet' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredResources.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No rescue units found.
                </div>
              ) : (
                filteredResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          🚑
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-tight">
                            {res.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{res.callsign}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          res.status === 'AVAILABLE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>Fuel: {res.fuel_percent || 85}%</span>
                      {res.latitude && res.longitude && (
                        <button
                          onClick={() => onFocusLocation(res.latitude, res.longitude, 16)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Crosshair className="w-2.5 h-2.5" /> Locate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Hospitals */}
          {activeTab === 'hospitals' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredHospitals.map((hosp) => {
                const openBeds =
                  hosp.emergency_beds -
                  hosp.occupied_emergency_beds +
                  (hosp.icu_beds - hosp.occupied_icu_beds);
                return (
                  <div
                    key={hosp.id}
                    className="p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          🏥
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-tight">
                            {hosp.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {hosp.address || 'Lucknow Medical Corridor'}
                          </span>
                        </div>
                      </div>
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                        {openBeds} Open Beds
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400">ER Capacity: </span>
                        <strong className="text-emerald-400">
                          {hosp.emergency_beds - hosp.occupied_emergency_beds}/{hosp.emergency_beds}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400">ICU Capacity: </span>
                        <strong className="text-amber-400">
                          {hosp.icu_beds - hosp.occupied_icu_beds}/{hosp.icu_beds}
                        </strong>
                      </div>
                    </div>

                    {hosp.latitude && hosp.longitude && (
                      <button
                        onClick={() => onFocusLocation(hosp.latitude, hosp.longitude, 16)}
                        className="w-full py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold flex items-center justify-center gap-1 cursor-pointer text-[10px]"
                      >
                        <Crosshair className="w-3 h-3" /> Focus Trauma Center on Map
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 4: Weather Hazards */}
          {activeTab === 'weather' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
              <div className="p-2.5 bg-sky-950/40 border border-sky-800/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4" /> Live Lucknow Weather
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Open-Meteo</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Rainfall</span>
                    <strong className="text-sky-300">
                      {weather?.precipitation_mm || 0} mm/h
                    </strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Wind Speed</span>
                    <strong className="text-amber-300">
                      {weather?.wind_speed_kmh || 14} km/h
                    </strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Thermal</span>
                    <strong className="text-emerald-300">
                      {weather?.temperature_c || 28}°C
                    </strong>
                  </div>
                </div>
              </div>

              {/* Drone & Plume Advisory */}
              <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-300 block uppercase text-[10px]">
                  Drone & Plume Corridor Advisory
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Drone Flight Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {weather?.drone_flight_status || 'SAFE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Plume Drift Direction:</span>
                  <span className="text-amber-400 font-bold">
                    {weather?.wind_direction_cardinal || 'NE'} (Corridor active)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Flood Inundation Risk:</span>
                  <span className="text-sky-400 font-bold">
                    {weather?.flood_risk || 'LOW'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: AI Route Dispatcher */}
          {activeTab === 'ai' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              <div className="p-3 bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 rounded-2xl border border-indigo-700/60 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <h4 className="font-bold text-white text-xs">
                    Multi-Unit Route Optimization
                  </h4>
                </div>
                <p className="text-[11px] text-indigo-200">
                  Select an active emergency to compute optimal multi-corridor transit routes for the top 3 nearest units.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 px-1">
                  Select Emergency Target:
                </span>
                {incidents.slice(0, 4).map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => {
                      onCalculateAISuggestions(inc);
                      if (inc.latitude && inc.longitude) {
                        onFocusLocation(inc.latitude, inc.longitude, 15);
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-600/60 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-slate-200 group-hover:text-white block">
                        {inc.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{inc.location_name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
