import React, { useState } from 'react';
import { Hospital } from '../../types';
import { api } from '../../lib/api';
import {
  Building2,
  HeartPulse,
  Bed,
  Activity,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface HospitalManagementProps {
  hospitals: Hospital[];
  onCapacityChanged: () => void;
}

export const HospitalManagement: React.FC<HospitalManagementProps> = ({
  hospitals,
  onCapacityChanged,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAdjustBeds = async (
    hospitalId: string,
    deltaEmergency: number,
    deltaIcu: number
  ) => {
    const hosp = hospitals.find((h) => h.id === hospitalId);
    if (!hosp) return;

    setUpdatingId(hospitalId);
    try {
      const newOccupiedEmergency = Math.max(
        0,
        Math.min(hosp.emergency_beds, hosp.occupied_emergency_beds + deltaEmergency)
      );
      const newOccupiedIcu = Math.max(
        0,
        Math.min(hosp.icu_beds, hosp.occupied_icu_beds + deltaIcu)
      );

      const isFull = newOccupiedEmergency >= hosp.emergency_beds && newOccupiedIcu >= hosp.icu_beds;
      const isBusy = (newOccupiedEmergency / hosp.emergency_beds) > 0.85;

      const nextStatus = isFull ? 'FULL' : isBusy ? 'BUSY' : 'OPEN';

      await api.hospitals.updateCapacity(hospitalId, {
        occupied_emergency_beds: newOccupiedEmergency,
        occupied_icu_beds: newOccupiedIcu,
        status: nextStatus,
      });

      onCapacityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to update hospital capacity');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalEmergency = hospitals.reduce((acc, h) => acc + h.emergency_beds, 0);
  const occupiedEmergency = hospitals.reduce((acc, h) => acc + h.occupied_emergency_beds, 0);
  const totalIcu = hospitals.reduce((acc, h) => acc + h.icu_beds, 0);
  const occupiedIcu = hospitals.reduce((acc, h) => acc + h.occupied_icu_beds, 0);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            REGIONAL TRAUMA & HOSPITAL NETWORK
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {hospitals.length} Tier Facilities
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Autonomous emergency bed diversion & mass-casualty surge balancing
          </p>
        </div>

        {/* Global Capacity Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">TOTAL EMERGENCY VACANCY</span>
            <strong className="text-emerald-600 text-sm font-bold">
              {totalEmergency - occupiedEmergency} / {totalEmergency} Beds Open
            </strong>
          </div>

          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">TOTAL ICU VACANCY</span>
            <strong className="text-indigo-600 text-sm font-bold">
              {totalIcu - occupiedIcu} / {totalIcu} ICU Open
            </strong>
          </div>
        </div>
      </div>

      {/* Bento Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hospitals.map((hosp) => {
          const freeEmergency = hosp.emergency_beds - hosp.occupied_emergency_beds;
          const emergencyPct = Math.round((hosp.occupied_emergency_beds / hosp.emergency_beds) * 100);

          const freeIcu = hosp.icu_beds - hosp.occupied_icu_beds;
          const icuPct = Math.round((hosp.occupied_icu_beds / hosp.icu_beds) * 100);

          const isUpdating = updatingId === hosp.id;

          return (
            <div
              key={hosp.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{hosp.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span className="truncate max-w-[190px]">{hosp.address}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${
                    hosp.status === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : hosp.status === 'BUSY'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {hosp.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold">
                    {hosp.trauma_level.replace('_', ' ')} Trauma
                  </span>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-600" />
                    {hosp.phone}
                  </span>
                </div>

                {/* Occupancy Bars */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                  {/* Emergency Beds */}
                  <div>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Emergency Ward</span>
                      <strong className={freeEmergency > 5 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {freeEmergency} Open ({emergencyPct}% occupied)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          emergencyPct > 85 ? 'bg-rose-500' : emergencyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${emergencyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* ICU Beds */}
                  <div>
                    <div className="flex items-center justify-between text-slate-700 mb-1">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">ICU & Critical Care</span>
                      <strong className={freeIcu > 2 ? 'text-indigo-600 font-bold' : 'text-rose-600 font-bold'}>
                        {freeIcu} Open ({icuPct}% occupied)
                      </strong>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          icuPct > 85 ? 'bg-rose-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${icuPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Specialties Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {hosp.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Adjust Bed Capacity Controls (Demo / Live Surge Simulation) */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Live Intake Surge:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustBeds(hosp.id, 2, 1)}
                    disabled={isUpdating}
                    title="Simulate intake of 2 emergency & 1 ICU patients"
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    Admit (+2)
                  </button>

                  <button
                    onClick={() => handleAdjustBeds(hosp.id, -2, -1)}
                    disabled={isUpdating}
                    title="Discharge / transfer 2 emergency & 1 ICU patients"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                    Discharge (-2)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
