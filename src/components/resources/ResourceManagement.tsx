import React, { useState } from 'react';
import { Resource, ResourceType, ResourceStatus } from '../../types';
import { ResourceStatusBadge } from '../common/SeverityBadge';
import { api } from '../../lib/api';
import {
  Truck,
  Ambulance,
  Flame,
  Shield,
  Stethoscope,
  Search,
  Filter,
  Fuel,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface ResourceManagementProps {
  resources: Resource[];
  onStatusChanged: () => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({
  resources,
  onStatusChanged,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = resources.filter((res) => {
    if (selectedType !== 'ALL' && res.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && res.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        res.name.toLowerCase().includes(q) ||
        res.callsign.toLowerCase().includes(q) ||
        res.capability.toLowerCase().includes(q) ||
        res.station_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (id: string, newStatus: ResourceStatus) => {
    setUpdatingId(id);
    try {
      await api.resources.updateStatus(id, newStatus);
      onStatusChanged();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'AMBULANCE':
        return <Ambulance className="w-5 h-5 text-rose-600" />;
      case 'FIRE_TRUCK':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'RESCUE_BOAT':
        return <span className="text-lg">🚤</span>;
      case 'POLICE_UNIT':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'MEDICAL_TEAM':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      default:
        return <Truck className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            EMERGENCY RESPONSE FLEET & ASSETS
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {resources.filter((r) => r.status === 'AVAILABLE').length} Available / {resources.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Real-time telemetry, readiness telemetry, crew staffing, and fuel tracking
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search callsign, crew..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold w-40 sm:w-48 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="AMBULANCE">🚑 Ambulances</option>
            <option value="FIRE_TRUCK">🚒 Fire Trucks</option>
            <option value="RESCUE_BOAT">🚤 Rescue Boats</option>
            <option value="POLICE_UNIT">🚓 Police Units</option>
            <option value="MEDICAL_TEAM">🩺 Medical Teams</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="BUSY">Busy</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bento Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((res) => {
          const isUpdating = updatingId === res.id;
          return (
            <div
              key={res.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3.5 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {getResourceIcon(res.type)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 tracking-wide block">
                        {res.callsign}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-600">{res.name}</h4>
                    </div>
                  </div>

                  <ResourceStatusBadge status={res.status} />
                </div>

                <p className="text-xs text-slate-600 mt-1">
                  <strong className="text-slate-400 text-[11px] uppercase tracking-wider block">Capability:</strong> {res.capability}
                </p>
              </div>

              {/* Specs & Fuel Bar */}
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Crew: <strong className="text-slate-900 font-bold">{res.crew_size} Responders</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                    Fuel: <strong className={res.fuel_percent < 40 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>{res.fuel_percent}%</strong>
                  </span>
                </div>

                {/* Fuel gauge bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${res.fuel_percent < 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${res.fuel_percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {res.station_name || 'Lucknow Central Hub'}
                  </span>
                  <span>{res.latitude.toFixed(3)}, {res.longitude.toFixed(3)}</span>
                </div>
              </div>

              {/* Status Action Dropdown */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400">Quick Status:</span>
                <div className="flex gap-1.5">
                  {res.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'AVAILABLE')}
                      disabled={isUpdating}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Set Ready
                    </button>
                  )}
                  {res.status !== 'DISPATCHED' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'DISPATCHED')}
                      disabled={isUpdating}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Deploy
                    </button>
                  )}
                  {res.status !== 'MAINTENANCE' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'MAINTENANCE')}
                      disabled={isUpdating}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Service
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
