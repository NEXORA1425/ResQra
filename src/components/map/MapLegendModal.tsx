import React from 'react';
import {
  Flame,
  AlertTriangle,
  Ambulance,
  Building,
  Shield,
  Radio,
  CloudRain,
  Compass,
  X,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface MapLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapLegendModal: React.FC<MapLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="map-legend-modal"
      className="absolute inset-0 z-[500] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-3xl p-5 text-white max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white uppercase">
                Tactical Map Symbology & Legend
              </h3>
              <p className="text-xs text-slate-400">
                Visual markers, operational radii, and telemetry encoding
              </p>
            </div>
          </div>
          <button
            id="close-map-legend-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Emergency Incidents */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5 uppercase">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Incident Markers
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs shrink-0 animate-pulse" />
                <span><strong className="text-rose-200">Critical / High</strong>: Active Fire, Hazmat, Explosion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs shrink-0" />
                <span><strong className="text-amber-200">Moderate</strong>: Road Collision, Medical Trauma</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-600 shadow-xs shrink-0" />
                <span><strong className="text-slate-200">Resolved</strong>: Mitigated & clear scene</span>
              </div>
            </div>
          </div>

          {/* Response Units */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5 uppercase">
              <Ambulance className="w-3.5 h-3.5 text-emerald-400" /> Rescue Fleet Units
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs shrink-0" />
                <span><strong className="text-emerald-200">AVAILABLE</strong>: Ready for instant dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-xs shrink-0 animate-spin" />
                <span><strong className="text-blue-200">DISPATCHED / EN ROUTE</strong>: Active navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-bold">
                  LIVE GPS
                </span>
                <span>Real-time GPS telemetry vector enabled</span>
              </div>
            </div>
          </div>

          {/* Hospital & Trauma Centers */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5 uppercase">
              <Building className="w-3.5 h-3.5 text-indigo-400" /> Trauma Centers
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">
                  H
                </span>
                <span>Regional Medical Centers with live bed status</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Click any hospital to inspect open Emergency and ICU beds.
              </p>
            </div>
          </div>

          {/* Environmental Threat & Radar */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
            <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5 uppercase">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Weather & Wind Vectors
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span><strong className="text-amber-200">Wind Direction</strong>: Plume dispersion corridor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-500/50 border border-sky-400" />
                <span><strong className="text-sky-200">Rainfall Heatmap</strong>: Flash flood hazard risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Containment Perimeters & Zones */}
        <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
          <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Evacuation Perimeter Radii
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-rose-800/50">
              <span className="font-bold text-rose-400 block">Critical Exclusion</span>
              <span>1.2 km radius (Immediate total evacuation)</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-amber-800/50">
              <span className="font-bold text-amber-400 block">Hazard Buffer</span>
              <span>800 m radius (First responders only)</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-yellow-800/50">
              <span className="font-bold text-yellow-400 block">Advisory Perimeter</span>
              <span>400 m radius (Traffic diverted)</span>
            </div>
          </div>
        </div>

        {/* AI Route Optimization notice */}
        <div className="p-2.5 bg-gradient-to-r from-indigo-950/70 to-cyan-950/70 rounded-2xl border border-indigo-700/60 flex items-center gap-2.5 text-xs text-indigo-200">
          <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 animate-pulse" />
          <p className="text-[11px] leading-tight">
            <strong>AI Optimal Deployment</strong> calculates real-time Haversine distance, speed, and unit capability matches for the top 3 nearest units.
          </p>
        </div>
      </div>
    </div>
  );
};
