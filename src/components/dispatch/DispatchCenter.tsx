import React, { useState, useEffect } from 'react';
import { Incident, Resource, Hospital, Dispatch, DispatchStatus } from '../../types';
import { api } from '../../lib/api';
import { SeverityBadge, IncidentStatusBadge } from '../common/SeverityBadge';
import { soundManager } from '../common/TacticalAudioAlert';
import { hapticFeedback } from '../../lib/haptic';
import {
  Send,
  Sparkles,
  MapPin,
  Clock,
  Building2,
  Ambulance,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  RefreshCw,
  Radio,
} from 'lucide-react';

interface DispatchCenterProps {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  dispatches: Dispatch[];
  initialSelectedIncidentId?: string | null;
  onDispatchCreated?: () => void;
  onDispatchUpdated?: () => void;
}

export const DispatchCenter: React.FC<DispatchCenterProps> = ({
  incidents,
  resources,
  hospitals,
  dispatches,
  initialSelectedIncidentId,
  onDispatchCreated,
  onDispatchUpdated,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    initialSelectedIncidentId || (incidents.find((i) => i.status !== 'RESOLVED')?.id || '')
  );

  const [recommendedResources, setRecommendedResources] = useState<
    Array<{ resource: Resource; score: number; distance_km: number; eta_minutes: number; reason: string }>
  >([]);
  const [recommendedHospitals, setRecommendedHospitals] = useState<
    Array<Hospital & { distance_km: number; score: number; reason: string }>
  >([]);

  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');

  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  // Fetch AI Recommendations when selected incident changes
  useEffect(() => {
    if (!selectedIncidentId) return;

    let isMounted = true;
    setIsLoadingRecommendations(true);

    Promise.all([
      api.resources.recommend(selectedIncidentId),
      api.hospitals.recommend(selectedIncidentId),
    ])
      .then(([resRec, hospRec]) => {
        if (!isMounted) return;
        if (resRec.success && resRec.recommendations) {
          setRecommendedResources(resRec.recommendations);
          // auto-select highest score available resource
          const topAvailable = resRec.recommendations.find((r) => r.resource.status === 'AVAILABLE');
          if (topAvailable) {
            setSelectedResourceId(topAvailable.resource.id);
          }
        }
        if (hospRec.success && hospRec.recommendations) {
          setRecommendedHospitals(hospRec.recommendations);
          if (hospRec.recommendations.length > 0) {
            setSelectedHospitalId(hospRec.recommendations[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load recommendations', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecommendations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedIncidentId]);

  // Handle Dispatch Form Submission
  const handleExecuteDispatch = async () => {
    if (!selectedIncidentId || !selectedResourceId) return;

    setIsSubmitting(true);
    hapticFeedback.triggerDispatch();
    try {
      const res = await api.dispatch.create({
        incident_id: selectedIncidentId,
        resource_id: selectedResourceId,
        hospital_id: selectedHospitalId || undefined,
        assigned_by: 'State Emergency Operations Commander (SEOC)',
        notes: dispatchNotes || 'Immediate emergency deployment order with priority routing.',
      });

      if (res.success) {
        soundManager.playDispatchSuccess();
        setSuccessToast(`Dispatch order transmitted successfully to Unit ${selectedResourceId}!`);
        setTimeout(() => setSuccessToast(null), 5000);
        if (onDispatchCreated) onDispatchCreated();
      }
    } catch (err: any) {
      alert(err.message || 'Dispatch creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Dispatch status update (En Route -> On Scene -> Completed)
  const handleUpdateStatus = async (dispatchId: string, nextStatus: DispatchStatus) => {
    if (nextStatus === 'COMPLETED') {
      hapticFeedback.triggerResolve();
    } else {
      hapticFeedback.triggerNotification();
    }
    try {
      const res = await api.dispatch.updateStatus(dispatchId, nextStatus);
      if (res.success && onDispatchUpdated) {
        onDispatchUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AUTONOMOUS DISPATCH & FLEET COORDINATION
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              GEMINI OPTIMIZED
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Proximity-weighted, capability-matched fleet allocation and trauma bed routing
          </p>
        </div>

        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dispatch Configurator (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step 1: Select Active Incident */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                Target Emergency Incident
              </span>

              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.incident_code}] {inc.title.slice(0, 38)}... ({inc.severity})
                  </option>
                ))}
              </select>
            </div>

            {selectedIncident && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={selectedIncident.severity} size="sm" />
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">{selectedIncident.incident_code}</span>
                    <IncidentStatusBadge status={selectedIncident.status} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Trapped: <strong className="text-rose-600 font-bold">{selectedIncident.people_trapped || 0}</strong>
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{selectedIncident.title}</h4>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{selectedIncident.location_name}</span>
                </div>

                {selectedIncident.ai_analysis?.recommended_action && (
                  <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-indigo-700 text-[10px] font-bold block uppercase tracking-wider">AI Recommended Strategy:</strong>
                      {selectedIncident.ai_analysis.recommended_action}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Choose AI Recommended Fleet Asset */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                Recommended Fleet Units (Proximity & Capability Ranked)
              </span>

              {isLoadingRecommendations && (
                <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ranking Units...
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recommendedResources.map((rec) => {
                const isSelected = selectedResourceId === rec.resource.id;
                const isAvailable = rec.resource.status === 'AVAILABLE';

                return (
                  <div
                    key={rec.resource.id}
                    onClick={() => setSelectedResourceId(rec.resource.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg text-xs font-bold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-emerald-700'}`}>
                          {rec.resource.type === 'AMBULANCE' ? '🚑' : rec.resource.type === 'RESCUE_BOAT' ? '🚤' : rec.resource.type === 'FIRE_TRUCK' ? '🚒' : '🚓'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">{rec.resource.callsign}</span>
                          <span className="text-[11px] text-slate-500 font-medium ml-2">{rec.resource.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          rec.score >= 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          Match: {rec.score}%
                        </span>
                        <span className="text-slate-500 font-semibold">ETA ~{rec.eta_minutes}m</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>{rec.reason}</span>
                      <span className={isAvailable ? 'text-emerald-600 font-bold' : 'text-amber-600 font-semibold'}>
                        {rec.resource.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Destination Hospital Routing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                Designated Trauma Hospital Destination
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recommendedHospitals.slice(0, 4).map((hosp) => {
                const isSelected = selectedHospitalId === hosp.id;
                const freeBeds = hosp.emergency_beds - hosp.occupied_emergency_beds;
                const freeIcu = hosp.icu_beds - hosp.occupied_icu_beds;

                return (
                  <div
                    key={hosp.id}
                    onClick={() => setSelectedHospitalId(hosp.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{hosp.name}</h5>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-lg border border-indigo-200">
                        {hosp.trauma_level.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Emergency Beds:</span>
                        <strong className="text-emerald-600">{freeBeds} Free</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>ICU Capacity:</span>
                        <strong className="text-indigo-600">{freeIcu} Free</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <span>{hosp.distance_km} km</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Transmit Dispatch Directive */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold text-xs uppercase mb-1">
                Commander Deployment Orders / Tactical Notes
              </label>
              <input
                type="text"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g. Code 3 sirens authorized, coordinate with Lucknow Traffic Control on Shaheed Path..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleExecuteDispatch}
              disabled={isSubmitting || !selectedIncidentId || !selectedResourceId}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 tracking-wide cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'TRANSMITTING MISSION ORDER...' : 'APPROVE & TRANSMIT DISPATCH MISSION'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Active Dispatches Board (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                  ACTIVE MISSIONS IN FLIGHT
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    {dispatches.filter((d) => d.status !== 'COMPLETED').length} Running
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Live telemetry & stage progression tracker</p>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[640px] pr-1">
              {dispatches.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium text-xs">
                  No active fleet missions currently dispatched.
                </div>
              ) : (
                dispatches.map((disp) => {
                  return (
                    <div
                      key={disp.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                    >
                      {/* Mission Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            {disp.resource?.callsign || disp.resource_id}
                          </span>
                          <span className="text-xs text-slate-800 font-bold truncate max-w-[140px]">
                            {disp.incident?.title || disp.incident_id}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          ETA ~{disp.eta_minutes || 6}m
                        </span>
                      </div>

                      {/* Stage Progression Progress Bar */}
                      <div className="space-y-1">
                        <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
                          <span className={disp.status === 'DISPATCHED' ? 'text-amber-600' : 'text-slate-400'}>DISPATCHED</span>
                          <span className={disp.status === 'RESPONDING' || disp.status === 'ACCEPTED' ? 'text-amber-600' : 'text-slate-400'}>EN ROUTE</span>
                          <span className={disp.status === 'ON_SCENE' ? 'text-indigo-600' : 'text-slate-400'}>ON SCENE</span>
                          <span className={disp.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}>COMPLETED</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width:
                                disp.status === 'DISPATCHED'
                                  ? '25%'
                                  : disp.status === 'RESPONDING' || disp.status === 'ACCEPTED'
                                  ? '50%'
                                  : disp.status === 'ON_SCENE'
                                  ? '75%'
                                  : '100%',
                            }}
                          />
                        </div>
                      </div>

                      {/* Destination Hospital */}
                      {disp.hospital && (
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Routing to: <strong className="text-indigo-700">{disp.hospital.name}</strong></span>
                        </div>
                      )}

                      {/* Action Controls for Operator / Responder */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-medium text-slate-400">
                          Assigned: {new Date(disp.assigned_at).toLocaleTimeString()}
                        </span>

                        <div className="flex gap-1.5">
                          {disp.status === 'DISPATCHED' && (
                            <button
                              onClick={() => handleUpdateStatus(disp.id, 'RESPONDING')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-colors"
                            >
                              Confirm En Route
                            </button>
                          )}
                          {disp.status === 'RESPONDING' && (
                            <button
                              onClick={() => handleUpdateStatus(disp.id, 'ON_SCENE')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
                            >
                              Arrive On Scene
                            </button>
                          )}
                          {disp.status === 'ON_SCENE' && (
                            <button
                              onClick={() => handleUpdateStatus(disp.id, 'COMPLETED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
                            >
                              Complete Mission
                            </button>
                          )}
                          {disp.status === 'COMPLETED' && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Unit Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
