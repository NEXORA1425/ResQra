import React, { useState, useEffect, useRef } from 'react';
import { Resource, Dispatch, Incident, Hospital } from '../../types';
import { api } from '../../lib/api';
import { SeverityBadge } from '../common/SeverityBadge';
import { soundManager } from '../common/TacticalAudioAlert';
import { hapticFeedback } from '../../lib/haptic';
import {
  Smartphone,
  Navigation,
  MapPin,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Volume2,
  HeartPulse,
  Compass,
  Zap,
  RefreshCw,
  LocateFixed,
  Signal,
  RotateCcw,
} from 'lucide-react';

interface ResponderDashboardProps {
  resources: Resource[];
  dispatches: Dispatch[];
  incidents: Incident[];
  hospitals: Hospital[];
  onMissionUpdated: () => void;
}

export const ResponderDashboard: React.FC<ResponderDashboardProps> = ({
  resources,
  dispatches,
  incidents,
  hospitals,
  onMissionUpdated,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    resources[0]?.id || 'res-1'
  );

  // Live Geolocation Tracking State
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [trackingStatus, setTrackingStatus] = useState<'IDLE' | 'LOCATING' | 'STREAMING' | 'ERROR'>('IDLE');
  const [lastGPSFix, setLastGPSFix] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
    timestamp: number;
    updateCount: number;
    source: string;
  } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isSimulatingTransit, setIsSimulatingTransit] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const transitTimerRef = useRef<any>(null);
  const updatesCountRef = useRef<number>(0);

  const [triageCounts, setTriageCounts] = useState<{ green: number; yellow: number; red: number; black: number }>({
    green: 2,
    yellow: 3,
    red: 1,
    black: 0,
  });

  const selectedUnit = resources.find((r) => r.id === selectedUnitId) || resources[0];
  const activeDispatch = dispatches.find(
    (d) => d.resource_id === selectedUnit?.id && d.status !== 'COMPLETED'
  );
  const activeIncident = activeDispatch?.incident_id
    ? incidents.find((i) => i.id === activeDispatch.incident_id)
    : undefined;
  const destinationHospital = activeDispatch?.hospital_id
    ? hospitals.find((h) => h.id === activeDispatch.hospital_id)
    : undefined;

  // Transmit location update to backend
  const transmitLocation = async (
    lat: number,
    lng: number,
    accuracy?: number,
    speed?: number | null,
    heading?: number | null,
    source: string = 'BROWSER_GPS'
  ) => {
    if (!selectedUnit) return;
    try {
      updatesCountRef.current += 1;
      await api.resources.updateLocation(selectedUnit.id, {
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
        speed: speed !== null && speed !== undefined ? Math.round(speed * 3.6) : undefined, // m/s to km/h
        heading: heading !== null && heading !== undefined ? Math.round(heading) : undefined,
        live_tracking: true,
      });

      setLastGPSFix({
        lat,
        lng,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
        speed: speed !== null && speed !== undefined ? Math.round(speed * 3.6) : null,
        heading: heading !== null && heading !== undefined ? Math.round(heading) : null,
        timestamp: Date.now(),
        updateCount: updatesCountRef.current,
        source,
      });

      setTrackingStatus('STREAMING');
      setTrackingError(null);
      onMissionUpdated();
    } catch (err: any) {
      console.error('Failed to transmit GPS location to server:', err);
    }
  };

  // Start / Stop Browser Geolocation Watcher
  useEffect(() => {
    if (isLiveTracking) {
      setTrackingStatus('LOCATING');
      setTrackingError(null);

      if (!('geolocation' in navigator)) {
        setTrackingError('Geolocation API not supported in this browser. Falling back to Google Geolocation.');
        fallbackToGoogleGeolocation();
        return;
      }

      // Initial fix
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          transmitLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed,
            pos.coords.heading,
            'DEVICE_GPS_INITIAL'
          );
        },
        (err) => {
          console.warn('Browser GPS permission or timeout, attempting Google Geolocation fallback:', err.message);
          fallbackToGoogleGeolocation();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Continuous Watcher
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          transmitLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed,
            pos.coords.heading,
            'BROWSER_GEOLOCATION_API'
          );
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
          setTrackingError(`GPS Warning: ${err.message}. Live tracking active with fallback.`);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      watchIdRef.current = watchId;

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    } else {
      // Disabled
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingStatus('IDLE');
      if (selectedUnit) {
        api.resources.updateLocation(selectedUnit.id, {
          latitude: selectedUnit.latitude,
          longitude: selectedUnit.longitude,
          live_tracking: false,
        }).then(() => onMissionUpdated()).catch(() => {});
      }
    }
  }, [isLiveTracking, selectedUnitId]);

  // Google Geolocation Fallback
  const fallbackToGoogleGeolocation = async () => {
    try {
      const geoResult = await api.geolocation.locate();
      if (geoResult.success && geoResult.location) {
        transmitLocation(
          geoResult.location.lat,
          geoResult.location.lng,
          geoResult.accuracy,
          null,
          null,
          geoResult.source || 'GOOGLE_GEOLOCATION_API'
        );
      }
    } catch (err) {
      setTrackingStatus('ERROR');
      setTrackingError('Unable to acquire GPS fix. Please verify location permissions.');
    }
  };

  // Simulated In-Transit Step Animation (for testing movement along mission routes)
  useEffect(() => {
    if (isSimulatingTransit && selectedUnit) {
      let targetLat = 26.8467;
      let targetLng = 80.9462;

      if (activeIncident) {
        targetLat = activeIncident.latitude;
        targetLng = activeIncident.longitude;
      } else if (destinationHospital) {
        targetLat = destinationHospital.latitude;
        targetLng = destinationHospital.longitude;
      }

      let currentLat = selectedUnit.latitude;
      let currentLng = selectedUnit.longitude;

      transitTimerRef.current = setInterval(() => {
        const step = 0.0008; // ~80m step
        const dLat = targetLat - currentLat;
        const dLng = targetLng - currentLng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist > 0.001) {
          currentLat += (dLat / dist) * step;
          currentLng += (dLng / dist) * step;
          const heading = Math.atan2(dLng, dLat) * (180 / Math.PI);
          transmitLocation(currentLat, currentLng, 8, 12.5, (heading + 360) % 360, 'IN_TRANSIT_SIMULATOR');
        } else {
          // Reached target area
          currentLat = targetLat;
          currentLng = targetLng;
          transmitLocation(currentLat, currentLng, 5, 0, null, 'IN_TRANSIT_ARRIVED');
          setIsSimulatingTransit(false);
        }
      }, 3000);

      return () => {
        if (transitTimerRef.current) clearInterval(transitTimerRef.current);
      };
    } else {
      if (transitTimerRef.current) clearInterval(transitTimerRef.current);
    }
  }, [isSimulatingTransit, selectedUnit?.id, activeIncident, destinationHospital]);

  const handleManualGPSPing = () => {
    if ('geolocation' in navigator) {
      setTrackingStatus('LOCATING');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          transmitLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.speed,
            pos.coords.heading,
            'MANUAL_PING'
          );
        },
        () => {
          fallbackToGoogleGeolocation();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      fallbackToGoogleGeolocation();
    }
  };

  const handleAdvanceStatus = async (nextStatus: any) => {
    if (!activeDispatch) return;
    if (nextStatus === 'COMPLETED') {
      hapticFeedback.triggerResolve();
    } else {
      hapticFeedback.triggerDispatch();
    }
    try {
      await api.dispatch.updateStatus(activeDispatch.id, nextStatus);
      soundManager.playDispatchSuccess();
      onMissionUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update mission status');
    }
  };

  const handleVoiceReadout = () => {
    if (!activeIncident) return;
    soundManager.speakAICommanderBriefing(
      `Mission for unit ${selectedUnit?.callsign}. Target: ${activeIncident.title}. Location: ${activeIncident.location_name}. ${activeIncident.people_trapped} citizens trapped. Proceed with emergency priority.`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Live Tracking Control */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              FIELD RESPONDER TACTICAL HUD
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-md">
                UNIT TERMINAL
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Vehicle in-cab mission briefing, tactical route guidance, and real-time live GPS telemetry beacon
            </p>
          </div>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Select Unit:</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.callsign} - {res.name} ({res.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live GPS Tracking Beacon Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 p-5 rounded-2xl text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isLiveTracking ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Radio className={`w-5 h-5 ${isLiveTracking ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wider uppercase text-white">
                  Real-Time GPS Location Tracking
                </h3>
                {isLiveTracking && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE BEACON ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Transmits continuous Geolocation API coordinate updates to the central dispatch map.
              </p>
            </div>
          </div>

          {/* Master Live Tracking Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiveTracking(!isLiveTracking)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isLiveTracking ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isLiveTracking ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs font-bold text-slate-200">
              {isLiveTracking ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        {/* Live GPS Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" /> COORDINATES
            </span>
            <strong className="text-white text-xs font-mono block mt-1">
              {lastGPSFix
                ? `${lastGPSFix.lat.toFixed(5)}°, ${lastGPSFix.lng.toFixed(5)}°`
                : `${selectedUnit.latitude.toFixed(4)}°, ${selectedUnit.longitude.toFixed(4)}°`}
            </strong>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Signal className="w-3 h-3 text-emerald-400" /> GPS ACCURACY
            </span>
            <strong className="text-emerald-400 text-xs font-bold block mt-1">
              {lastGPSFix?.accuracy ? `±${lastGPSFix.accuracy} meters` : 'Hardware Standby'}
            </strong>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> SPEED / HEADING
            </span>
            <strong className="text-amber-300 text-xs font-bold block mt-1">
              {lastGPSFix?.speed !== null && lastGPSFix?.speed !== undefined
                ? `${lastGPSFix.speed} km/h ${lastGPSFix.heading !== null ? `(${lastGPSFix.heading}°)` : ''}`
                : 'Stationary (0 km/h)'}
            </strong>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" /> TRANSMISSIONS
            </span>
            <strong className="text-indigo-300 text-xs font-bold block mt-1">
              {lastGPSFix ? `${lastGPSFix.updateCount} pings sent` : '0 transmitted'}
            </strong>
          </div>
        </div>

        {/* Quick Location Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualGPSPing}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ping GPS Fix Now</span>
            </button>

            <button
              onClick={() => setIsSimulatingTransit(!isSimulatingTransit)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer text-xs ${
                isSimulatingTransit
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulatingTransit ? 'Stop Transit Sim' : 'Simulate In-Route Movement'}</span>
            </button>
          </div>

          {trackingError && (
            <div className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-800/50 px-2.5 py-1 rounded-lg">
              {trackingError}
            </div>
          )}
        </div>
      </div>

      {/* Selected Unit Telemetry Strip */}
      {selectedUnit && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-xs text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">CALLSIGN</span>
            <strong className="text-slate-900 text-sm font-bold">{selectedUnit.callsign}</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">STATUS</span>
            <strong className={selectedUnit.status === 'AVAILABLE' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {selectedUnit.status}
            </strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">CREW COMPLEMENT</span>
            <strong className="text-indigo-600 font-bold">{selectedUnit.crew_size} Active Staff</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">FUEL / BATTERY</span>
            <strong className="text-emerald-600 font-bold">{selectedUnit.fuel_percent}%</strong>
          </div>
        </div>
      )}

      {/* Active Mission Card */}
      {activeDispatch && activeIncident ? (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Mission Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold">
                ACTIVE DEPLOYMENT ORDER
              </span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {activeIncident.incident_code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceReadout}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Audio Mission Brief</span>
              </button>
            </div>
          </div>

          {/* Incident Details */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SeverityBadge severity={activeIncident.severity} size="sm" />
              <h3 className="text-base font-bold text-slate-900">{activeIncident.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-medium">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{activeIncident.location_name}</span>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
              {activeIncident.description}
            </p>
          </div>

          {/* Victim Status & Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">VICTIM & RISK TELEMETRY</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Total Affected:</span>
                <strong className="text-slate-900 font-bold">{activeIncident.people_affected || 0}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Reported Injured:</span>
                <strong className="text-amber-600 font-bold">{activeIncident.people_injured || 0}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Citizens Trapped:</span>
                <strong className="text-rose-600 font-bold">{activeIncident.people_trapped || 0}</strong>
              </div>
            </div>

            {destinationHospital && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] text-indigo-600 uppercase font-bold block mb-1">DESIGNATED DESTINATION HOSPITAL</span>
                <div className="font-bold text-slate-900 text-sm mb-0.5">{destinationHospital.name}</div>
                <div className="text-xs text-slate-500 font-medium">{destinationHospital.address}</div>
                <div className="text-xs text-emerald-600 mt-1.5 font-bold">
                  Emergency Beds: {destinationHospital.emergency_beds - destinationHospital.occupied_emergency_beds} Free
                </div>
              </div>
            )}
          </div>

          {/* Quick Field Casualty Triage Counter (START Protocol) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              On-Scene START Casualty Triage Counter
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Minor (Green)</span>
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, green: Math.max(0, c.green - 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                  >-</button>
                  <strong className="text-base text-emerald-700 font-bold">{triageCounts.green}</strong>
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, green: c.green + 1 }))}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                  >+</button>
                </div>
              </div>

              <div className="bg-white border border-amber-200 p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Delayed (Yellow)</span>
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, yellow: Math.max(0, c.yellow - 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                  >-</button>
                  <strong className="text-base text-amber-700 font-bold">{triageCounts.yellow}</strong>
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, yellow: c.yellow + 1 }))}
                    className="w-7 h-7 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm cursor-pointer"
                  >+</button>
                </div>
              </div>

              <div className="bg-white border border-rose-200 p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-rose-700 uppercase font-bold block">Immediate (Red)</span>
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, red: Math.max(0, c.red - 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                  >-</button>
                  <strong className="text-base text-rose-700 font-bold">{triageCounts.red}</strong>
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, red: c.red + 1 }))}
                    className="w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
                  >+</button>
                </div>
              </div>

              <div className="bg-white border border-slate-300 p-3 rounded-xl shadow-xs">
                <span className="text-[10px] text-slate-600 uppercase font-bold block">Deceased (Black)</span>
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, black: Math.max(0, c.black - 1) }))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                  >-</button>
                  <strong className="text-base text-slate-800 font-bold">{triageCounts.black}</strong>
                  <button
                    onClick={() => setTriageCounts((c) => ({ ...c, black: c.black + 1 }))}
                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Progression Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Advance Mission Phase:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeDispatch.status === 'DISPATCHED' && (
                <button
                  onClick={() => handleAdvanceStatus('RESPONDING')}
                  className="py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>TRANSMIT: EN ROUTE (CODE 3)</span>
                </button>
              )}

              {(activeDispatch.status === 'DISPATCHED' || activeDispatch.status === 'RESPONDING' || activeDispatch.status === 'ACCEPTED') && (
                <button
                  onClick={() => handleAdvanceStatus('ON_SCENE')}
                  className="py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>TRANSMIT: ARRIVED ON SCENE</span>
                </button>
              )}

              {activeDispatch.status === 'ON_SCENE' && (
                <button
                  onClick={() => handleAdvanceStatus('COMPLETED')}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MISSION ACCOMPLISHED / CLEAR UNIT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">UNIT {selectedUnit?.callsign} ON STANDBY</h3>
          <p className="max-w-md mx-auto text-slate-500 font-medium">
            This unit currently has no pending dispatch orders. Toggle on <strong>Live Tracking</strong> above to transmit real-time vehicle positioning beacon directly to the Central Dispatch Map.
          </p>
        </div>
      )}
    </div>
  );
};
