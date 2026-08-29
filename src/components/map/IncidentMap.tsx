import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Resource, Hospital, LiveWeatherReport, DeploymentRouteSuggestion } from '../../types';
import { D3HeatmapLayer } from './D3HeatmapLayer';
import { WeatherLayer } from './WeatherLayer';
import { DeploymentSuggestionLayer } from './DeploymentSuggestionLayer';
import { MapControlBar } from './MapControlBar';
import { MapLegendModal } from './MapLegendModal';
import { MapQuickDock } from './MapQuickDock';
import { api } from '../../lib/api';
import { hapticFeedback } from '../../lib/haptic';
import {
  Crosshair,
  Radio,
  Ambulance,
  Flame,
  Building,
  Eye,
  Send,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  MapPin,
  Clock,
  Sparkles,
  Globe,
  Satellite,
  Compass,
  AlertTriangle,
  Activity,
  CloudRain,
  Wind,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyC86bFJWJadg9M2DRwLumNGxIsQr7vRJbg';

interface IncidentMapProps {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  onQuickDispatch?: (incident: Incident) => void;
  variant?: 'embedded' | 'fullscreen';
}

// Controller component for Google Map pan/zoom actions
const MapController: React.FC<{
  targetCenter: { lat: number; lng: number } | null;
  targetZoom: number | null;
}> = ({ targetCenter, targetZoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (targetCenter) {
      map.panTo(targetCenter);
    }
    if (targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, targetCenter, targetZoom]);
  return null;
};

// Google Maps D3 Heatmap Overlay Connector
const GoogleMapD3HeatmapHelper: React.FC<{
  incidents: Incident[];
  visible: boolean;
}> = ({ incidents, visible }) => {
  const map = useMap();
  return (
    <D3HeatmapLayer
      incidents={incidents}
      visible={visible}
      mapEngine="google"
      googleMap={map}
    />
  );
};

// Google Maps Weather & Threat Overlay Connector
const GoogleMapWeatherHelper: React.FC<{
  weather: LiveWeatherReport | null;
  weatherLoading?: boolean;
  onRefreshWeather?: () => void;
  incidents: Incident[];
  selectedIncident?: Incident | null;
  visible: boolean;
  onSelectIncident?: (incident: Incident) => void;
}> = ({
  weather,
  weatherLoading,
  onRefreshWeather,
  incidents,
  selectedIncident,
  visible,
  onSelectIncident,
}) => {
  const map = useMap();
  return (
    <WeatherLayer
      weather={weather}
      weatherLoading={weatherLoading}
      onRefreshWeather={onRefreshWeather}
      incidents={incidents}
      selectedIncident={selectedIncident}
      visible={visible}
      mapEngine="google"
      googleMap={map}
      onSelectIncident={onSelectIncident}
    />
  );
};

// Google Maps Deployment Routing Layer Connector
const GoogleMapDeploymentHelper: React.FC<{
  suggestions: DeploymentRouteSuggestion[];
  targetIncident: Incident | null;
  visible: boolean;
  onDeployResource: (resource: Resource, incident: Incident) => void;
  onDeployAll: (suggestions: DeploymentRouteSuggestion[]) => void;
  onClearSuggestions: () => void;
  isDeploying?: boolean;
}> = ({
  suggestions,
  targetIncident,
  visible,
  onDeployResource,
  onDeployAll,
  onClearSuggestions,
  isDeploying,
}) => {
  const map = useMap();
  return (
    <DeploymentSuggestionLayer
      suggestions={suggestions}
      targetIncident={targetIncident}
      visible={visible}
      mapEngine="google"
      googleMap={map}
      onDeployResource={onDeployResource}
      onDeployAll={onDeployAll}
      onClearSuggestions={onClearSuggestions}
      isDeploying={isDeploying}
    />
  );
};

// Haversine distance formula (km)
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Generate realistic street corridor intermediate waypoints
function generateCorridorWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  seed: number
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [start];
  const steps = 4;
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;

  for (let i = 1; i <= steps; i++) {
    const fraction = i / (steps + 1);
    const offsetFactor = Math.sin(fraction * Math.PI) * (seed % 2 === 0 ? 0.0012 : -0.0012);
    const orthoLat = -dLng * offsetFactor * 12;
    const orthoLng = dLat * offsetFactor * 12;

    points.push({
      lat: Number((start.lat + dLat * fraction + orthoLat).toFixed(6)),
      lng: Number((start.lng + dLng * fraction + orthoLng).toFixed(6)),
    });
  }

  points.push(end);
  return points;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  resources,
  hospitals,
  selectedIncident,
  onSelectIncident,
  onQuickDispatch,
  variant = 'embedded',
}) => {
  // Mode: 'google' (Google Maps Platform) or 'tactical' (Leaflet Clean Vector)
  const [mapEngine, setMapEngine] = useState<'google' | 'tactical'>('google');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const [showIncidents, setShowIncidents] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showPerimeters, setShowPerimeters] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL_HIGH'>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  // Real-Time Weather State
  const [weatherData, setWeatherData] = useState<LiveWeatherReport | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchLiveWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const res = await api.weather.getLive(26.8500, 80.9500);
      if (res.success && res.data) {
        setWeatherData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch real-time weather in map:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveWeather();
    // Refresh weather telemetry periodically every 3 minutes
    const interval = setInterval(fetchLiveWeather, 180000);
    return () => clearInterval(interval);
  }, [fetchLiveWeather]);

  // AI Deployment Suggestions State
  const [showDeploymentSuggestions, setShowDeploymentSuggestions] = useState(false);
  const [deploymentSuggestions, setDeploymentSuggestions] = useState<DeploymentRouteSuggestion[]>([]);
  const [targetIncidentForSuggestions, setTargetIncidentForSuggestions] = useState<Incident | null>(null);
  const [isDeployingResource, setIsDeployingResource] = useState(false);

  // Compute 3 closest and most suitable available units and their optimal route corridors
  const computeDeploymentSuggestions = useCallback((target: Incident): DeploymentRouteSuggestion[] => {
    if (!target || !target.latitude || !target.longitude) return [];

    const candidates = resources.filter((r) => r.latitude && r.longitude);
    if (candidates.length === 0) return [];

    const scored = candidates.map((res) => {
      const distKm = calculateHaversineKm(
        res.latitude,
        res.longitude,
        target.latitude,
        target.longitude
      );

      const speedKmh = res.type === 'FIRE_TRUCK' || res.type === 'RESCUE_BOAT' ? 42 : 54;
      const etaMins = Math.max(1, Math.round((distKm / speedKmh) * 60));

      let typeScore = 20;
      let suitabilityReason = `Rapid emergency transit corridor (${distKm} km)`;

      const incType = (target.type || '').toUpperCase();
      const resType = (res.type || '').toUpperCase();

      if (incType === 'FIRE' || incType === 'EXPLOSION') {
        if (resType === 'FIRE_TRUCK') {
          typeScore = 55;
          suitabilityReason = `Primary fire suppression engine & hydraulic water cannon (${distKm} km)`;
        } else if (resType === 'AMBULANCE' || resType === 'MEDICAL_TEAM') {
          typeScore = 35;
          suitabilityReason = `Smoke inhalation & burn triage medical unit (${distKm} km)`;
        } else if (resType === 'POLICE_UNIT') {
          typeScore = 25;
          suitabilityReason = `Perimeter evacuation & emergency corridor clearing (${distKm} km)`;
        }
      } else if (incType === 'FLOOD' || incType === 'WATER_RESCUE') {
        if (resType === 'RESCUE_BOAT') {
          typeScore = 60;
          suitabilityReason = `Amphibious flood rescue vessel with diver support (${distKm} km)`;
        } else if (resType === 'AMBULANCE') {
          typeScore = 30;
          suitabilityReason = `Hypothermia & shock medical stabilization (${distKm} km)`;
        }
      } else if (incType === 'ROAD_ACCIDENT' || incType === 'BUILDING_COLLAPSE') {
        if (resType === 'AMBULANCE' || resType === 'MEDICAL_TEAM') {
          typeScore = 50;
          suitabilityReason = `Advanced trauma life-support (ATLS) paramedic unit (${distKm} km)`;
        } else if (resType === 'FIRE_TRUCK') {
          typeScore = 42;
          suitabilityReason = `Heavy hydraulic extrication tools & rescue jaws (${distKm} km)`;
        } else if (resType === 'POLICE_UNIT') {
          typeScore = 25;
          suitabilityReason = `Traffic redirection & roadblock perimeter control (${distKm} km)`;
        }
      } else if (incType === 'HAZMAT') {
        if (resType === 'FIRE_TRUCK') {
          typeScore = 48;
          suitabilityReason = `Hazmat neutralizer & decontamination equipment (${distKm} km)`;
        } else if (resType === 'AMBULANCE') {
          typeScore = 38;
          suitabilityReason = `Chemical exposure stabilization team (${distKm} km)`;
        }
      } else {
        if (resType === 'AMBULANCE') typeScore = 40;
        if (resType === 'POLICE_UNIT') typeScore = 35;
      }

      const statusBonus = res.status === 'AVAILABLE' ? 25 : res.status === 'DISPATCHED' ? -15 : 0;
      const distancePenalty = Math.min(45, distKm * 4.5);
      const fuelBonus = (res.fuel_percent || 80) > 50 ? 10 : 0;

      const totalScore = Math.max(10, Math.round(typeScore + statusBonus + fuelBonus - distancePenalty + 30));

      return {
        resource: res,
        distance_km: distKm,
        eta_minutes: etaMins,
        speed_kmh: speedKmh,
        suitability_score: totalScore,
        suitability_reason: suitabilityReason,
      };
    });

    // Sort by suitability score descending, then by distance
    scored.sort((a, b) => b.suitability_score - a.suitability_score || a.distance_km - b.distance_km);

    const top3 = scored.slice(0, 3);
    const colors = ['#06b6d4', '#f59e0b', '#a855f7']; // Cyan (#1), Amber (#2), Violet (#3)

    return top3.map((item, idx) => {
      const waypoints = generateCorridorWaypoints(
        { lat: item.resource.latitude, lng: item.resource.longitude },
        { lat: target.latitude, lng: target.longitude },
        idx + 1
      );

      return {
        resource: item.resource,
        incident: target,
        distance_km: item.distance_km,
        eta_minutes: item.eta_minutes,
        speed_kmh: item.speed_kmh,
        priority_rank: idx + 1,
        suitability_score: item.suitability_score,
        suitability_reason: item.suitability_reason,
        route_color: colors[idx] || '#10b981',
        waypoints,
      };
    });
  }, [resources]);

  // Calculate and activate suggestions for a given incident
  const handleCalculateAndShowSuggestions = useCallback((target: Incident) => {
    if (!target || !target.latitude || !target.longitude) return;
    const routes = computeDeploymentSuggestions(target);
    setTargetIncidentForSuggestions(target);
    setDeploymentSuggestions(routes);
    setShowDeploymentSuggestions(true);

    // Pan map to target incident with suitable zoom
    setTargetCenter({ lat: target.latitude, lng: target.longitude });
    setTargetZoom(14);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([target.latitude, target.longitude], 14, { duration: 0.8 });
    }
  }, [computeDeploymentSuggestions]);

  // Trigger AI Deployment Suggestions button click from Top HUD Bar
  const handleTriggerAISuggestions = useCallback(() => {
    // 1. If an incident is already selected, use it
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      handleCalculateAndShowSuggestions(selectedIncident);
      return;
    }

    // 2. Otherwise pick the highest priority / critical active emergency
    const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && i.latitude && i.longitude);
    if (activeIncidents.length === 0) return;

    // Prioritize CRITICAL > HIGH > highest severity_score
    activeIncidents.sort((a, b) => {
      const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const weightA = sevWeight[a.severity] || 0;
      const weightB = sevWeight[b.severity] || 0;
      if (weightB !== weightA) return weightB - weightA;
      return (b.severity_score || 0) - (a.severity_score || 0);
    });

    const highestIncident = activeIncidents[0];
    if (highestIncident) {
      if (onSelectIncident) onSelectIncident(highestIncident);
      handleCalculateAndShowSuggestions(highestIncident);
    }
  }, [selectedIncident, incidents, handleCalculateAndShowSuggestions, onSelectIncident]);

  // Dispatch single resource
  const handleDeployResource = useCallback(async (resource: Resource, incident: Incident) => {
    setIsDeployingResource(true);
    try {
      if (onQuickDispatch) {
        onQuickDispatch(incident);
      } else {
        await api.dispatch.create({
          incident_id: incident.id,
          resource_id: resource.id,
          assigned_by: 'AI Auto-Router',
          notes: `Dispatched via AI Deployment Optimal Pathing: ${resource.callsign} to ${incident.incident_code}`,
        });
      }
      // Mark resource optimistically
      setDeploymentSuggestions((prev) =>
        prev.map((s) =>
          s.resource.id === resource.id
            ? { ...s, resource: { ...s.resource, status: 'DISPATCHED' } }
            : s
        )
      );
    } catch (err) {
      console.error('Failed to deploy resource:', err);
    } finally {
      setIsDeployingResource(false);
    }
  }, [onQuickDispatch]);

  // Deploy all 3 units in batch
  const handleDeployAll = useCallback(async (suggestionsToDeploy: DeploymentRouteSuggestion[]) => {
    if (!targetIncidentForSuggestions || suggestionsToDeploy.length === 0) return;
    setIsDeployingResource(true);
    try {
      for (const sug of suggestionsToDeploy) {
        if (sug.resource.status !== 'DISPATCHED') {
          await api.dispatch.create({
            incident_id: targetIncidentForSuggestions.id,
            resource_id: sug.resource.id,
            assigned_by: 'AI Commander Batch Auto-Router',
            notes: `Batch dispatched via AI Optimal Routing: ${sug.resource.callsign} (#${sug.priority_rank})`,
          });
        }
      }
      if (onQuickDispatch) {
        onQuickDispatch(targetIncidentForSuggestions);
      }
      setDeploymentSuggestions((prev) =>
        prev.map((s) => ({ ...s, resource: { ...s.resource, status: 'DISPATCHED' } }))
      );
    } catch (err) {
      console.error('Failed to batch deploy all resources:', err);
    } finally {
      setIsDeployingResource(false);
    }
  }, [targetIncidentForSuggestions, onQuickDispatch]);

  const [activePopupData, setActivePopupData] = useState<{
    type: 'incident' | 'resource' | 'hospital';
    item: any;
  } | null>(null);

  // Map state
  const [targetCenter, setTargetCenter] = useState<{ lat: number; lng: number } | null>({
    lat: 26.8500,
    lng: 80.9500,
  });
  const [targetZoom, setTargetZoom] = useState<number | null>(13);

  // Leaflet refs & state
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<L.LayerGroup | null>(null);
  const leafletPerimetersRef = useRef<L.LayerGroup | null>(null);
  const [leafletInstance, setLeafletInstance] = useState<L.Map | null>(null);

  // Pan to selected incident when changed
  useEffect(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      const pos = { lat: selectedIncident.latitude, lng: selectedIncident.longitude };
      setTargetCenter(pos);
      setTargetZoom(15);
      setActivePopupData({ type: 'incident', item: selectedIncident });

      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([selectedIncident.latitude, selectedIncident.longitude], 15, {
          duration: 1,
        });
      }
    }
  }, [selectedIncident]);

  // Leaflet Map Initialization when tactical mode is active
  useEffect(() => {
    if (mapEngine !== 'tactical') {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkersRef.current = null;
        leafletPerimetersRef.current = null;
      }
      return;
    }

    if (!leafletContainerRef.current) return;
    if (leafletMapRef.current) return;

    try {
      const map = L.map(leafletContainerRef.current, {
        center: [targetCenter?.lat || 26.8500, targetCenter?.lng || 80.9500],
        zoom: targetZoom || 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const perimeterGroup = L.layerGroup().addTo(map);
      const markerGroup = L.layerGroup().addTo(map);

      leafletPerimetersRef.current = perimeterGroup;
      leafletMarkersRef.current = markerGroup;
      leafletMapRef.current = map;
      setLeafletInstance(map);

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const ro = new ResizeObserver(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      });
      ro.observe(leafletContainerRef.current);

      return () => {
        clearTimeout(timer);
        ro.disconnect();
        map.remove();
        leafletMapRef.current = null;
        setLeafletInstance(null);
      };
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }
  }, [mapEngine]);

  // Update Leaflet markers
  useEffect(() => {
    if (mapEngine !== 'tactical') return;
    const map = leafletMapRef.current;
    const markerGroup = leafletMarkersRef.current;
    const perimeterGroup = leafletPerimetersRef.current;

    if (!map || !markerGroup || !perimeterGroup) return;

    markerGroup.clearLayers();
    perimeterGroup.clearLayers();

    // Incidents
    if (showIncidents) {
      const filtered = incidents.filter((inc) => {
        if (severityFilter === 'CRITICAL_HIGH') {
          return inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
        }
        return true;
      });

      for (const inc of filtered) {
        if (!inc.latitude || !inc.longitude) continue;
        const isCritical = inc.severity === 'CRITICAL';
        const isHigh = inc.severity === 'HIGH';
        const isResolved = inc.status === 'RESOLVED';

        const color = isResolved
          ? '#94a3b8'
          : isCritical
          ? '#e11d48'
          : isHigh
          ? '#f97316'
          : inc.severity === 'MEDIUM'
          ? '#eab308'
          : '#10b981';

        if (showPerimeters && !isResolved && (isCritical || isHigh)) {
          const circle = L.circle([inc.latitude, inc.longitude], {
            radius: isCritical ? 600 : 350,
            color: color,
            fillColor: color,
            fillOpacity: isCritical ? 0.12 : 0.08,
            weight: 1.5,
            dashArray: '4, 6',
          });
          circle.addTo(perimeterGroup);
        }

        const iconEmoji =
          inc.type === 'FIRE'
            ? '🔥'
            : inc.type === 'FLOOD'
            ? '🌊'
            : inc.type === 'ROAD_ACCIDENT'
            ? '🚗'
            : inc.type === 'BUILDING_COLLAPSE'
            ? '🏚️'
            : inc.type === 'HAZMAT'
            ? '☣️'
            : '⚠️';

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              ${isCritical && !isResolved ? '<div class="absolute -inset-2.5 rounded-full bg-rose-500/30 animate-ping"></div>' : ''}
              <div style="background-color: ${color}; border-color: #ffffff;" class="w-8 h-8 rounded-2xl border-2 shadow-md flex items-center justify-center text-white font-bold text-xs">
                ${iconEmoji}
              </div>
              <div class="absolute -bottom-5 bg-white text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200 whitespace-nowrap shadow-sm">
                ${inc.incident_code}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });
        marker.on('click', () => {
          setActivePopupData({ type: 'incident', item: inc });
        });
        marker.addTo(markerGroup);
      }
    }

    // Resources
    if (showResources) {
      for (const res of resources) {
        if (!res.latitude || !res.longitude) continue;
        const resColor =
          res.status === 'AVAILABLE'
            ? '#10b981'
            : res.status === 'DISPATCHED'
            ? '#f59e0b'
            : '#ef4444';

        const iconSymbol =
          res.type === 'AMBULANCE'
            ? '🚑'
            : res.type === 'FIRE_TRUCK'
            ? '🚒'
            : res.type === 'RESCUE_BOAT'
            ? '🚤'
            : '🚓';

        const isLive = !!res.is_live_tracking;

        const resourceIcon = L.divIcon({
          className: 'custom-resource-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              ${isLive ? '<div class="absolute -inset-1.5 rounded-2xl bg-emerald-400 opacity-75 animate-ping"></div>' : ''}
              <div style="border-color: ${resColor}; background-color: #ffffff;" class="relative w-7 h-7 rounded-xl border-2 shadow-sm flex items-center justify-center text-sm">
                ${iconSymbol}
              </div>
              <div class="absolute -bottom-4 ${isLive ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'} text-[9px] font-bold px-1 rounded-md border ${isLive ? 'border-emerald-700' : 'border-slate-200'} whitespace-nowrap shadow-xs flex items-center gap-0.5">
                ${isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>' : ''}
                ${res.callsign.split('-').pop() || res.callsign}
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([res.latitude, res.longitude], { icon: resourceIcon });
        marker.on('click', () => {
          setActivePopupData({ type: 'resource', item: res });
        });
        marker.addTo(markerGroup);
      }
    }

    // Hospitals
    if (showHospitals) {
      for (const hosp of hospitals) {
        if (!hosp.latitude || !hosp.longitude) continue;
        const availableBeds =
          hosp.emergency_beds - hosp.occupied_emergency_beds + (hosp.icu_beds - hosp.occupied_icu_beds);

        const hospitalIcon = L.divIcon({
          className: 'custom-hospital-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-7 h-7 rounded-xl border-2 border-indigo-600 bg-indigo-50 shadow-sm flex items-center justify-center text-indigo-700 font-bold text-xs">
                🏥
              </div>
              <div class="absolute -bottom-4 bg-indigo-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs whitespace-nowrap">
                ${availableBeds} beds
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([hosp.latitude, hosp.longitude], { icon: hospitalIcon });
        marker.on('click', () => {
          setActivePopupData({ type: 'hospital', item: hosp });
        });
        marker.addTo(markerGroup);
      }
    }
  }, [mapEngine, incidents, resources, hospitals, showIncidents, showResources, showHospitals, showPerimeters, severityFilter]);

  // Filtered incidents for Google Maps
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter === 'CRITICAL_HIGH') {
        return inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
      }
      return true;
    });
  }, [incidents, severityFilter]);

  const recenterMap = () => {
    setTargetCenter({ lat: 26.8500, lng: 80.9500 });
    setTargetZoom(13);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([26.8500, 80.9500], 13, { duration: 0.8 });
    }
  };

  const handleFocusLocation = (lat: number, lng: number, zoom = 15) => {
    setTargetCenter({ lat, lng });
    setTargetZoom(zoom);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], zoom, { duration: 0.8 });
    }
  };

  const totalIncidentsCount = incidents.length;
  const criticalIncidentsCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH'
  ).length;

  const containerHeightClass =
    variant === 'fullscreen'
      ? 'h-[calc(100vh-140px)] min-h-[640px]'
      : isExpanded
      ? 'h-[820px] max-h-[88vh]'
      : 'h-[360px] sm:h-[450px] md:h-[520px] lg:h-[600px] min-h-[320px] sm:min-h-[400px] lg:min-h-[500px]';

  return (
    <div
      className={`isolate z-0 relative w-full ${containerHeightClass} transition-all duration-300 bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col`}
    >
      {/* Consolidated Tactical Map Control Bar (Dedicated Top Toolbar) */}
      <MapControlBar
        mapEngine={mapEngine}
        setMapEngine={setMapEngine}
        mapTypeId={mapTypeId}
        setMapTypeId={setMapTypeId}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        totalIncidentsCount={totalIncidentsCount}
        criticalIncidentsCount={criticalIncidentsCount}
        showIncidents={showIncidents}
        setShowIncidents={setShowIncidents}
        showResources={showResources}
        setShowResources={setShowResources}
        showHospitals={showHospitals}
        setShowHospitals={setShowHospitals}
        showPerimeters={showPerimeters}
        setShowPerimeters={setShowPerimeters}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showWeather={showWeather}
        setShowWeather={setShowWeather}
        counts={{
          incidents: incidents.length,
          resources: resources.length,
          hospitals: hospitals.length,
        }}
        onTriggerAISuggestions={handleTriggerAISuggestions}
        isAISuggestionsActive={showDeploymentSuggestions && deploymentSuggestions.length > 0}
        onRecenter={recenterMap}
        onToggleLegend={() => setShowLegendModal(true)}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {/* Tactical Map Symbology & Legend Modal */}
      <MapLegendModal
        isOpen={showLegendModal}
        onClose={() => setShowLegendModal(false)}
      />

      {/* Map Rendering Canvas Container */}
      <div className="w-full flex-1 min-h-[380px] relative overflow-hidden bg-slate-950">
        {/* Quick Tactical Dock Drawer Overlay */}
        <MapQuickDock
          incidents={incidents}
          resources={resources}
          hospitals={hospitals}
          weather={weatherData}
          onFocusLocation={handleFocusLocation}
          onSelectIncident={onSelectIncident}
          onQuickDispatch={onQuickDispatch}
          onCalculateAISuggestions={handleCalculateAndShowSuggestions}
          selectedIncident={selectedIncident}
        />
        {mapEngine === 'google' ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <div className="w-full h-full">
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={{ lat: 26.8500, lng: 80.9500 }}
                defaultZoom={13}
                mapTypeId={mapTypeId}
                disableDefaultUI={false}
                zoomControl={true}
                streetViewControl={false}
                mapTypeControl={false}
                fullscreenControl={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <MapController targetCenter={targetCenter} targetZoom={targetZoom} />

                {/* Real-Time Environmental Threats & Weather Radar Layer */}
                <GoogleMapWeatherHelper
                  weather={weatherData}
                  weatherLoading={weatherLoading}
                  onRefreshWeather={fetchLiveWeather}
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  visible={showWeather}
                  onSelectIncident={onSelectIncident}
                />

                {/* AI Deployment Suggestions & Optimal Pathing Layer */}
                <GoogleMapDeploymentHelper
                  suggestions={deploymentSuggestions}
                  targetIncident={targetIncidentForSuggestions}
                  visible={showDeploymentSuggestions}
                  onDeployResource={handleDeployResource}
                  onDeployAll={handleDeployAll}
                  onClearSuggestions={() => setShowDeploymentSuggestions(false)}
                  isDeploying={isDeployingResource}
                />

                {/* D3.js Crisis Hotspots Heatmap Layer */}
                <GoogleMapD3HeatmapHelper incidents={incidents} visible={showHeatmap} />

                {/* Google Maps Incident Markers */}
                {showIncidents &&
                  filteredIncidents.map((inc) => {
                    if (!inc.latitude || !inc.longitude) return null;
                    const isCritical = inc.severity === 'CRITICAL';
                    const isHigh = inc.severity === 'HIGH';
                    const isResolved = inc.status === 'RESOLVED';

                    const color = isResolved
                      ? '#94a3b8'
                      : isCritical
                      ? '#e11d48'
                      : isHigh
                      ? '#f97316'
                      : inc.severity === 'MEDIUM'
                      ? '#eab308'
                      : '#10b981';

                    const iconEmoji =
                      inc.type === 'FIRE'
                        ? '🔥'
                        : inc.type === 'FLOOD'
                        ? '🌊'
                        : inc.type === 'ROAD_ACCIDENT'
                        ? '🚗'
                        : inc.type === 'BUILDING_COLLAPSE'
                        ? '🏚️'
                        : inc.type === 'HAZMAT'
                        ? '☣️'
                        : '⚠️';

                    return (
                      <AdvancedMarker
                        key={inc.id}
                        position={{ lat: inc.latitude, lng: inc.longitude }}
                        onClick={() => setActivePopupData({ type: 'incident', item: inc })}
                        title={`${inc.incident_code} - ${inc.title}`}
                      >
                        <div className="relative flex flex-col items-center cursor-pointer group transform hover:scale-110 transition-transform">
                          {isCritical && !isResolved && (
                            <div className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping" />
                          )}
                          <div
                            style={{ backgroundColor: color }}
                            className="w-9 h-9 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm"
                          >
                            {iconEmoji}
                          </div>
                          <div className="mt-1 bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
                            {inc.incident_code}
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* Google Maps Resource Markers */}
                {showResources &&
                  resources.map((res) => {
                    if (!res.latitude || !res.longitude) return null;
                    const resColor =
                      res.status === 'AVAILABLE'
                        ? '#10b981'
                        : res.status === 'DISPATCHED'
                        ? '#f59e0b'
                        : '#ef4444';

                    const iconSymbol =
                      res.type === 'AMBULANCE'
                        ? '🚑'
                        : res.type === 'FIRE_TRUCK'
                        ? '🚒'
                        : res.type === 'RESCUE_BOAT'
                        ? '🚤'
                        : '🚓';

                    const isLive = !!res.is_live_tracking;

                    return (
                      <AdvancedMarker
                        key={res.id}
                        position={{ lat: res.latitude, lng: res.longitude }}
                        onClick={() => setActivePopupData({ type: 'resource', item: res })}
                        title={`${res.callsign} - ${res.name} ${isLive ? '(Live GPS Active)' : ''}`}
                      >
                        <div className="relative flex flex-col items-center cursor-pointer group transform hover:scale-110 transition-transform">
                          {isLive && (
                            <div className="absolute -inset-2 rounded-2xl bg-emerald-400 opacity-60 animate-ping pointer-events-none" />
                          )}
                          <div
                            style={{ borderColor: resColor }}
                            className="relative w-8 h-8 rounded-xl border-2 bg-white shadow-md flex items-center justify-center text-base"
                          >
                            {iconSymbol}
                          </div>
                          <div className={`mt-0.5 ${isLive ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-900 text-white font-bold'} text-[9px] px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap flex items-center gap-1`}>
                            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            {res.callsign.split('-').pop() || res.callsign}
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* Google Maps Hospital Markers */}
                {showHospitals &&
                  hospitals.map((hosp) => {
                    if (!hosp.latitude || !hosp.longitude) return null;
                    const availableBeds =
                      hosp.emergency_beds -
                      hosp.occupied_emergency_beds +
                      (hosp.icu_beds - hosp.occupied_icu_beds);

                    return (
                      <AdvancedMarker
                        key={hosp.id}
                        position={{ lat: hosp.latitude, lng: hosp.longitude }}
                        onClick={() => setActivePopupData({ type: 'hospital', item: hosp })}
                        title={hosp.name}
                      >
                        <div className="relative flex flex-col items-center cursor-pointer group transform hover:scale-110 transition-transform">
                          <div className="w-8 h-8 rounded-xl border-2 border-indigo-600 bg-indigo-50 shadow-md flex items-center justify-center text-sm font-bold">
                            🏥
                          </div>
                          <div className="mt-0.5 bg-indigo-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap">
                            {availableBeds} beds
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}
              </Map>
            </div>
          </APIProvider>
        ) : (
          <div className="w-full h-full relative">
            <div ref={leafletContainerRef} className="w-full h-full" />
            <WeatherLayer
              weather={weatherData}
              weatherLoading={weatherLoading}
              onRefreshWeather={fetchLiveWeather}
              incidents={incidents}
              selectedIncident={selectedIncident}
              visible={showWeather}
              mapEngine="tactical"
              leafletMap={leafletInstance}
              onSelectIncident={onSelectIncident}
            />
            <DeploymentSuggestionLayer
              suggestions={deploymentSuggestions}
              targetIncident={targetIncidentForSuggestions}
              visible={showDeploymentSuggestions}
              mapEngine="tactical"
              leafletMap={leafletInstance}
              onDeployResource={handleDeployResource}
              onDeployAll={handleDeployAll}
              onClearSuggestions={() => setShowDeploymentSuggestions(false)}
              isDeploying={isDeployingResource}
            />
            <D3HeatmapLayer
              incidents={incidents}
              visible={showHeatmap}
              mapEngine="tactical"
              leafletMap={leafletInstance}
            />
          </div>
        )}
      </div>

      {/* Bento Popup Drawer for Selected Markers */}
      {activePopupData && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[450] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-4 text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              {activePopupData.type === 'incident' && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
                  <Flame className="w-4 h-4" />
                </div>
              )}
              {activePopupData.type === 'resource' && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
                  <Ambulance className="w-4 h-4" />
                </div>
              )}
              {activePopupData.type === 'hospital' && (
                <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
                  <Building className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {activePopupData.type.toUpperCase()}
                </span>
                <h4 className="text-sm font-bold leading-tight text-slate-900">
                  {activePopupData.type === 'incident' && activePopupData.item.title}
                  {activePopupData.type === 'resource' && activePopupData.item.name}
                  {activePopupData.type === 'hospital' && activePopupData.item.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActivePopupData(null)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Incident Details */}
          {activePopupData.type === 'incident' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>
                  Code: <strong className="font-semibold text-slate-900">{activePopupData.item.incident_code}</strong>
                </span>
                <span>
                  Severity:{' '}
                  <strong className={activePopupData.item.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}>
                    {activePopupData.item.severity} ({activePopupData.item.severity_score}/100)
                  </strong>
                </span>
              </div>
              <p className="text-slate-600 text-xs line-clamp-2">{activePopupData.item.description}</p>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">AFFECTED</span>
                  <span className="font-bold text-slate-800 text-sm">{activePopupData.item.people_affected || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">INJURED</span>
                  <span className="font-bold text-amber-600 text-sm">{activePopupData.item.people_injured || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">TRAPPED</span>
                  <span className="font-bold text-rose-600 text-sm">{activePopupData.item.people_trapped || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5 pt-2">
                <button
                  onClick={() => {
                    handleCalculateAndShowSuggestions(activePopupData.item);
                    setActivePopupData(null);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                  <span>AI Optimal Deployment (Top 3 Units)</span>
                </button>

                <div className="flex gap-2">
                  {onSelectIncident && (
                    <button
                      onClick={() => {
                        onSelectIncident(activePopupData.item);
                        setActivePopupData(null);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Details
                    </button>
                  )}
                  {onQuickDispatch && activePopupData.item.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        hapticFeedback.triggerDispatch();
                        onQuickDispatch(activePopupData.item);
                        setActivePopupData(null);
                      }}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Quick Dispatch
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Resource Details */}
          {activePopupData.type === 'resource' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>
                  Callsign: <strong className="font-semibold text-emerald-700">{activePopupData.item.callsign}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  {activePopupData.item.is_live_tracking && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      LIVE GPS
                    </span>
                  )}
                  <strong className="font-semibold text-slate-800">{activePopupData.item.status}</strong>
                </span>
              </div>
              <p className="text-slate-600 text-xs">
                <strong className="text-slate-400">Capability:</strong> {activePopupData.item.capability}
              </p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">CREW</span>
                  <strong className="text-slate-900 font-bold">{activePopupData.item.crew_size} Staff</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">FUEL / CHARGE</span>
                  <strong className="text-emerald-600 font-bold">{activePopupData.item.fuel_percent}%</strong>
                </div>
                {activePopupData.item.last_telemetry && (
                  <div className="col-span-2 pt-1 border-t border-slate-200 text-[11px] flex items-center justify-between text-slate-500">
                    <span>
                      Speed: <strong className="text-amber-600">{activePopupData.item.last_telemetry.speed || 0} km/h</strong>
                    </span>
                    <span>
                      Accuracy: <strong className="text-emerald-600">±{activePopupData.item.last_telemetry.accuracy || 10}m</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hospital Details */}
          {activePopupData.type === 'hospital' && (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-500 text-xs">{activePopupData.item.address}</p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">EMERGENCY BEDS</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {activePopupData.item.emergency_beds - activePopupData.item.occupied_emergency_beds} /{' '}
                    {activePopupData.item.emergency_beds} Open
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">ICU BEDS</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {activePopupData.item.icu_beds - activePopupData.item.occupied_icu_beds} /{' '}
                    {activePopupData.item.icu_beds} Open
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {activePopupData.item.specialties?.map((s: string) => (
                  <span
                    key={s}
                    className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-indigo-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
