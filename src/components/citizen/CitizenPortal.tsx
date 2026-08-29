import React, { useState } from 'react';
import { Incident, Hospital } from '../../types';
import { SeverityBadge, IncidentStatusBadge } from '../common/SeverityBadge';
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  Building2,
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Navigation,
  Compass,
} from 'lucide-react';

interface CitizenPortalProps {
  incidents: Incident[];
  hospitals: Hospital[];
  onOpenReportModal: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  incidents,
  hospitals,
  onOpenReportModal,
}) => {
  const [trackedCode, setTrackedCode] = useState('');
  const [trackedIncident, setTrackedIncident] = useState<Incident | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const q = trackedCode.trim().toLowerCase();
    const found = incidents.find(
      (i) => i.incident_code.toLowerCase() === q || i.id.toLowerCase() === q
    );
    setTrackedIncident(found || null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SOS Hero Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-white">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>CITIZEN EMERGENCY ASSISTANCE PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Need Immediate Emergency Rescue or Medical Relief?
          </h1>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl leading-relaxed font-medium">
            Report flood inundation, building collapse, or road collisions directly to the State Emergency Operations Center powered by AI incident triage.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <button
            onClick={onOpenReportModal}
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-rose-600 font-bold text-sm sm:text-base shadow-lg shadow-black/10 flex items-center gap-3 transition-all transform active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
            <span>TRANSMIT EMERGENCY REPORT</span>
          </button>
        </div>
      </div>

      {/* Track Incident Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-600" />
          TRACK YOUR EMERGENCY REPORT DISPATCH STATUS
        </h3>
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            placeholder="Enter Incident Code (e.g. INC-1042)..."
            value={trackedCode}
            onChange={(e) => setTrackedCode(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            Track Status
          </button>
        </form>

        {hasSearched && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {trackedIncident ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 font-bold">Report Found: #{trackedIncident.incident_code}</span>
                  <IncidentStatusBadge status={trackedIncident.status} />
                </div>
                <h4 className="text-slate-900 font-bold text-sm">{trackedIncident.title}</h4>
                <p className="text-slate-500 font-medium">{trackedIncident.location_name}</p>
                <div className="text-slate-700 pt-1 font-medium bg-white p-3 rounded-lg border border-slate-200">
                  <strong className="text-indigo-700">Status Update:</strong>{' '}
                  {trackedIncident.status === 'DISPATCHED' || trackedIncident.status === 'RESPONDING'
                    ? 'Emergency units have been assigned and are currently responding with high priority.'
                    : trackedIncident.status === 'ON_SCENE'
                    ? 'First responders have arrived on scene and are conducting operations.'
                    : trackedIncident.status === 'RESOLVED'
                    ? 'Incident response completed successfully.'
                    : 'Emergency report received and prioritized in State Operations Center triage queue.'}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs font-medium text-center border border-slate-100">
                No incident found with code "{trackedCode}". Please check your code and try again.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Helpline Directory & Active Shelters Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Emergency Helplines */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            24/7 EMERGENCY HOTLINES (UTTAR PRADESH)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-900 font-bold block">112 Universal Emergency</span>
                <span className="text-slate-500 text-[11px] font-medium">Police, Fire & Medical Unified Dispatch</span>
              </div>
              <a href="tel:112" className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs">112</a>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-900 font-bold block">108 Emergency Ambulance</span>
                <span className="text-slate-500 text-[11px] font-medium">Advanced Life Support Ambulance Service</span>
              </div>
              <a href="tel:108" className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs">108</a>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-900 font-bold block">1070 State Disaster Relief (SEOC)</span>
                <span className="text-slate-500 text-[11px] font-medium">Uttar Pradesh State Disaster Control Room</span>
              </div>
              <a href="tel:1070" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs">1070</a>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-900 font-bold block">1077 District Emergency Control</span>
                <span className="text-slate-500 text-[11px] font-medium">Lucknow District Disaster Management Authority</span>
              </div>
              <a href="tel:1077" className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs">1077</a>
            </div>
          </div>
        </div>

        {/* Public Hospitals & Relief Shelters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            NEARBY TRAUMA HOSPITALS & CAPACITY
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {hospitals.map((hosp) => (
              <div key={hosp.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900">{hosp.name}</h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {hosp.emergency_beds - hosp.occupied_emergency_beds} Beds Open
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{hosp.address}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
