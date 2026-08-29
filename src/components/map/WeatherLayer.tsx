import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { Incident, LiveWeatherReport, SiteEnvironmentalThreat } from '../../types';
import {
  CloudRain,
  Wind,
  Compass,
  AlertTriangle,
  Flame,
  Droplets,
  Plane,
  Eye,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface WeatherLayerProps {
  weather: LiveWeatherReport | null;
  weatherLoading?: boolean;
  onRefreshWeather?: () => void;
  incidents: Incident[];
  selectedIncident?: Incident | null;
  visible: boolean;
  mapEngine: 'google' | 'tactical';
  leafletMap?: L.Map | null;
  googleMap?: google.maps.Map | null;
  opacity?: number;
  onSelectIncident?: (incident: Incident) => void;
}

export type WeatherVisualizationMode = 'precipitation' | 'wind' | 'combined';

export const WeatherLayer: React.FC<WeatherLayerProps> = ({
  weather,
  weatherLoading,
  onRefreshWeather,
  incidents,
  selectedIncident,
  visible,
  mapEngine,
  leafletMap,
  googleMap,
  opacity = 0.85,
  onSelectIncident,
}) => {
  const [visMode, setVisMode] = useState<WeatherVisualizationMode>('combined');
  const [isHudCollapsed, setIsHudCollapsed] = useState(true);
  const [selectedSiteThreat, setSelectedSiteThreat] = useState<SiteEnvironmentalThreat | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Active incidents with valid coords
  const activeIncidents = useMemo(() => {
    return incidents.filter(
      (inc) =>
        inc.status !== 'RESOLVED' &&
        typeof inc.latitude === 'number' &&
        typeof inc.longitude === 'number' &&
        !isNaN(inc.latitude) &&
        !isNaN(inc.longitude)
    );
  }, [incidents]);

  // Compute site-specific environmental threats for commanders
  const siteThreats: SiteEnvironmentalThreat[] = useMemo(() => {
    if (!weather) return [];

    const windSpeed = weather.wind_speed_kmh;
    const windDir = weather.wind_direction_deg;
    const precip = weather.precipitation_mm;

    // Opposite of wind direction is downwind plume drift
    const downwindBearing = (windDir + 180) % 360;
    const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const plumeDir = cardinals[Math.round(((downwindBearing % 360) / 22.5)) % 16];
    const safeZone = cardinals[Math.round(((windDir % 360) / 22.5)) % 16];

    return activeIncidents.map((inc) => {
      let threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'LOW';
      let primaryThreat = 'Atmospheric conditions standard for response';
      let waterImpact = 'Normal surface runoff';
      let aerialOps = weather.drone_flight_status !== 'GROUNDED';

      if (inc.type === 'FIRE' || inc.type === 'EXPLOSION') {
        if (windSpeed > 25) {
          threatLevel = 'CRITICAL';
          primaryThreat = `High wind (${windSpeed} km/h) driving rapid fire & smoke propagation towards ${plumeDir}`;
        } else if (windSpeed > 15) {
          threatLevel = 'HIGH';
          primaryThreat = `Moderate wind carrying dense combustion plume towards ${plumeDir}`;
        } else {
          threatLevel = 'ELEVATED';
          primaryThreat = `Thermal updraft creating localized smoke accumulation`;
        }
      } else if (inc.type === 'HAZMAT') {
        threatLevel = windSpeed > 18 ? 'CRITICAL' : 'HIGH';
        primaryThreat = `Toxic airborne dispersion corridor expanding ${plumeDir}ward at ${windSpeed} km/h`;
      } else if (inc.type === 'FLOOD') {
        if (precip > 8) {
          threatLevel = 'CRITICAL';
          primaryThreat = `Active torrential downpour (${precip} mm/h) escalating localized flash flooding`;
          waterImpact = 'Surging floodwater velocity, high current hazard';
        } else {
          threatLevel = 'HIGH';
          primaryThreat = `Standing water with ongoing precipitation (${precip} mm/h)`;
          waterImpact = 'Elevated water level, low ground traction';
        }
      } else if (inc.type === 'BUILDING_COLLAPSE') {
        if (precip > 5 || windSpeed > 30) {
          threatLevel = 'HIGH';
          primaryThreat = `Rain infiltration loosening unstable rubble masonry; wind vibration risk`;
        } else {
          threatLevel = 'ELEVATED';
          primaryThreat = `Rubble structural stability subject to localized wind drafts`;
        }
      } else {
        if (precip > 10 || windSpeed > 35) {
          threatLevel = 'ELEVATED';
          primaryThreat = `Adverse weather impacting responder visibility and traction`;
        }
      }

      return {
        incident_id: inc.id,
        incident_title: inc.title,
        severity: inc.severity,
        threat_level: threatLevel,
        primary_threat: primaryThreat,
        wind_vector_bearing: downwindBearing,
        plume_spread_direction: plumeDir,
        water_rescue_impact: waterImpact,
        aerial_ops_feasible: aerialOps,
        evacuation_safe_zone: `${safeZone} Quadrant (Upwind)`,
      };
    });
  }, [activeIncidents, weather]);

  // ANIMATED WIND & PRECIPITATION CANVAS RENDERING
  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.parentElement?.clientWidth || 800;
    let height = canvas.parentElement?.clientHeight || 600;
    canvas.width = width;
    canvas.height = height;

    const windSpeed = weather?.wind_speed_kmh || 18;
    const windDirDeg = weather?.wind_direction_deg || 225; // standard meteorological: direction wind comes FROM
    const windRad = ((windDirDeg + 180) * Math.PI) / 180; // Flow direction
    const precipMm = weather?.precipitation_mm || 1.2;

    // Generate wind flow particles
    const particleCount = visMode === 'precipitation' ? 0 : Math.min(160, Math.floor((width * height) / 5000));
    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      length: number;
      opacity: number;
      age: number;
      maxAge: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: (0.8 + Math.random() * 1.6) * (windSpeed / 12),
        length: 8 + Math.random() * 16 + windSpeed * 0.4,
        opacity: 0.15 + Math.random() * 0.45,
        age: Math.random() * 100,
        maxAge: 70 + Math.random() * 90,
      });
    }

    // Generate rain particles if precipitation mode or combined
    const rainCount = (visMode === 'wind' ? 0 : Math.min(220, Math.floor(precipMm * 30 + 40)));
    const rainDrops: Array<{
      x: number;
      y: number;
      speed: number;
      length: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 6 + Math.random() * 8 + precipMm * 1.2,
        length: 10 + Math.random() * 12 + precipMm * 2,
        opacity: 0.15 + Math.random() * 0.4,
      });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Render Wind Particles
      if (visMode === 'wind' || visMode === 'combined') {
        const u = Math.cos(windRad);
        const v = Math.sin(windRad);

        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';

        // Choose wind particle color based on wind velocity
        const windColor =
          windSpeed > 40
            ? 'rgba(239, 68, 68, '
            : windSpeed > 25
            ? 'rgba(249, 115, 22, '
            : windSpeed > 15
            ? 'rgba(234, 179, 8, '
            : 'rgba(56, 189, 248, ';

        for (let p of particles) {
          p.x += u * p.speed * (delta / 16);
          p.y += v * p.speed * (delta / 16);
          p.age += 1;

          if (p.x < -40) p.x = width + 20;
          if (p.x > width + 40) p.x = -20;
          if (p.y < -40) p.y = height + 20;
          if (p.y > height + 40) p.y = -20;
          if (p.age > p.maxAge) {
            p.age = 0;
            p.x = Math.random() * width;
            p.y = Math.random() * height;
          }

          const fade = Math.sin((p.age / p.maxAge) * Math.PI);
          ctx.strokeStyle = `${windColor}${Math.max(0.05, p.opacity * fade)})`;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - u * p.length, p.y - v * p.length);
          ctx.stroke();
        }
      }

      // 2. Render Precipitation Streaks
      if (visMode === 'precipitation' || visMode === 'combined') {
        const rainSlant = Math.cos(windRad) * (windSpeed * 0.15);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';

        for (let r of rainDrops) {
          r.x += rainSlant * (delta / 16);
          r.y += r.speed * (delta / 16);

          if (r.y > height) {
            r.y = -10;
            r.x = Math.random() * width;
          }
          if (r.x < -20) r.x = width + 10;
          if (r.x > width + 20) r.x = -10;

          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + rainSlant * 0.8, r.y + r.length);
          ctx.stroke();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [visible, visMode, weather]);

  // SVG SITE-SPECIFIC PLUME & THREAT OVERLAY (SYNCHRONIZED WITH LEAFLET OR GOOGLE MAPS)
  useEffect(() => {
    if (!visible || !svgRef.current || !weather) {
      if (svgRef.current) d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Gradient for smoke / plume cone
    const plumeGrad = defs.append('linearGradient')
      .attr('id', 'plume-cone-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    plumeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ef4444').attr('stop-opacity', 0.55);
    plumeGrad.append('stop').attr('offset', '60%').attr('stop-color', '#f97316').attr('stop-opacity', 0.28);
    plumeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#cbd5e1').attr('stop-opacity', 0.05);

    // Radar reflectivity gradient
    const radarGrad = defs.append('radialGradient')
      .attr('id', 'radar-cell-grad')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
    radarGrad.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.45);
    radarGrad.append('stop').attr('offset', '70%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.2);
    radarGrad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0);

    const g = svg.append('g').attr('class', 'weather-spatial-container');

    const updateSpatialElements = () => {
      if (!svgRef.current) return;
      g.selectAll('*').remove();

      let projectCoord: (lat: number, lng: number) => { x: number; y: number } | null = () => null;

      if (mapEngine === 'tactical' && leafletMap) {
        const size = leafletMap.getSize();
        svg.attr('width', size.x).attr('height', size.y);
        projectCoord = (lat, lng) => {
          const pt = leafletMap.latLngToContainerPoint([lat, lng]);
          return { x: pt.x, y: pt.y };
        };
      } else if (mapEngine === 'google' && googleMap) {
        const projection = googleMap.getProjection();
        const bounds = googleMap.getBounds();
        const mapDiv = googleMap.getDiv();
        if (!projection || !bounds || !mapDiv) return;

        const w = mapDiv.clientWidth;
        const h = mapDiv.clientHeight;
        svg.attr('width', w).attr('height', h);

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const topRight = projection.fromLatLngToPoint(ne);
        const bottomLeft = projection.fromLatLngToPoint(sw);
        if (!topRight || !bottomLeft) return;

        const scale = Math.pow(2, googleMap.getZoom() || 13);
        projectCoord = (lat, lng) => {
          const latLng = new google.maps.LatLng(lat, lng);
          const worldPoint = projection.fromLatLngToPoint(latLng);
          if (!worldPoint) return null;
          return {
            x: (worldPoint.x - bottomLeft.x) * scale,
            y: (worldPoint.y - topRight.y) * scale,
          };
        };
      }

      // Wind Flow Bearing Angle
      const windDir = weather.wind_direction_deg;
      const downwindBearing = (windDir + 180) % 360;
      const downwindAngleRad = ((downwindBearing - 90) * Math.PI) / 180;

      // 1. Render Incident Site Threat Cones & Threat Badges
      siteThreats.forEach((st) => {
        const inc = activeIncidents.find((i) => i.id === st.incident_id);
        if (!inc) return;
        const pt = projectCoord(inc.latitude, inc.longitude);
        if (!pt || pt.x < -100 || pt.x > (Number(svg.attr('width')) || 1920) + 100) return;

        const isSelected = selectedIncident?.id === inc.id;
        const isCriticalThreat = st.threat_level === 'CRITICAL';

        const siteG = g.append('g').attr('transform', `translate(${pt.x}, ${pt.y})`);

        // Plume dispersion wedge for Fire / Explosion / Hazmat
        if (
          (visMode === 'wind' || visMode === 'combined') &&
          (inc.type === 'FIRE' || inc.type === 'EXPLOSION' || inc.type === 'HAZMAT')
        ) {
          const coneLength = isCriticalThreat ? 130 : 90;
          const coneSpreadRad = (28 * Math.PI) / 180;

          const p1x = Math.cos(downwindAngleRad - coneSpreadRad) * coneLength;
          const p1y = Math.sin(downwindAngleRad - coneSpreadRad) * coneLength;
          const p2x = Math.cos(downwindAngleRad + coneSpreadRad) * coneLength;
          const p2y = Math.sin(downwindAngleRad + coneSpreadRad) * coneLength;

          const pathStr = `M 0 0 L ${p1x} ${p1y} A ${coneLength} ${coneLength} 0 0 1 ${p2x} ${p2y} Z`;

          siteG.append('path')
            .attr('d', pathStr)
            .attr('fill', inc.type === 'HAZMAT' ? 'rgba(168, 85, 247, 0.35)' : 'url(#plume-cone-grad)')
            .attr('stroke', inc.type === 'HAZMAT' ? '#c084fc' : '#f97316')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4 2')
            .attr('opacity', 0.85);

          // Animated plume flow vector arrow
          const arrowDist = coneLength * 0.75;
          const arrowX = Math.cos(downwindAngleRad) * arrowDist;
          const arrowY = Math.sin(downwindAngleRad) * arrowDist;

          siteG.append('circle')
            .attr('cx', arrowX)
            .attr('cy', arrowY)
            .attr('r', 3)
            .attr('fill', '#ffffff')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 1.5);
        }

        // Precipitation Flood Accumulation Ring
        if (
          (visMode === 'precipitation' || visMode === 'combined') &&
          (inc.type === 'FLOOD' || weather.precipitation_mm > 4)
        ) {
          siteG.append('circle')
            .attr('r', 55)
            .attr('fill', 'url(#radar-cell-grad)')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3 3')
            .attr('opacity', 0.75);
        }

        // Threat badge pill attached to incident node
        if (st.threat_level === 'CRITICAL' || st.threat_level === 'HIGH' || isSelected) {
          const badgeG = siteG.append('g')
            .attr('transform', `translate(0, 24)`)
            .attr('class', 'cursor-pointer pointer-events-auto')
            .on('click', (e) => {
              e.stopPropagation();
              setSelectedSiteThreat(st);
              if (onSelectIncident) onSelectIncident(inc);
            });

          const badgeBg =
            st.threat_level === 'CRITICAL'
              ? '#991b1b'
              : st.threat_level === 'HIGH'
              ? '#c2410c'
              : '#1e293b';

          badgeG.append('rect')
            .attr('x', -85)
            .attr('y', 0)
            .attr('width', 170)
            .attr('height', 20)
            .attr('rx', 6)
            .attr('fill', badgeBg)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.95);

          badgeG.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', 13)
            .attr('fill', '#ffffff')
            .attr('font-size', '9.5px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .text(
              inc.type === 'FIRE' || inc.type === 'HAZMAT'
                ? `💨 Plume → ${st.plume_spread_direction} (${weather.wind_speed_kmh} km/h)`
                : inc.type === 'FLOOD'
                ? `🌊 Rain ${weather.precipitation_mm}mm/h (${st.threat_level})`
                : `⚠️ Drone: ${weather.drone_flight_status}`
            );
        }
      });
    };

    updateSpatialElements();

    if (mapEngine === 'tactical' && leafletMap) {
      leafletMap.on('move', updateSpatialElements);
      leafletMap.on('zoom', updateSpatialElements);
      leafletMap.on('resize', updateSpatialElements);
      return () => {
        leafletMap.off('move', updateSpatialElements);
        leafletMap.off('zoom', updateSpatialElements);
        leafletMap.off('resize', updateSpatialElements);
      };
    } else if (mapEngine === 'google' && googleMap) {
      const bListener = googleMap.addListener('bounds_changed', updateSpatialElements);
      const zListener = googleMap.addListener('zoom_changed', updateSpatialElements);
      const cListener = googleMap.addListener('center_changed', updateSpatialElements);
      return () => {
        google.maps.event.removeListener(bListener);
        google.maps.event.removeListener(zListener);
        google.maps.event.removeListener(cListener);
      };
    }
  }, [visible, visMode, weather, activeIncidents, selectedIncident, mapEngine, leafletMap, googleMap, siteThreats]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[15] transition-opacity duration-300 overflow-hidden"
      style={{ opacity }}
    >
      {/* Particle & Radar Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* SVG Spatial Vector Layer */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* FLOATING COMMANDER ENVIRONMENTAL THREAT HUD */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto transition-all duration-200">
        {isHudCollapsed ? (
          /* Minimized Unobtrusive Telemetry Capsule */
          <button
            onClick={() => setIsHudCollapsed(false)}
            className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 hover:border-sky-500/60 rounded-xl px-3 py-1.5 text-white shadow-xl flex items-center gap-2 text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="w-4 h-4 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              {weather?.precipitation_mm && weather.precipitation_mm > 0 ? (
                <CloudRain className="w-3 h-3" />
              ) : (
                <Wind className="w-3 h-3" />
              )}
            </div>
            <span className="text-sky-300 font-bold text-[11px] tracking-tight">
              {weather ? `${weather.temperature_c}°C • ${weather.wind_speed_kmh}km/h ${weather.wind_direction_cardinal}` : 'Weather Radar'}
            </span>
            {weather?.precipitation_mm && weather.precipitation_mm > 0 && (
              <span className="bg-sky-950 text-sky-300 border border-sky-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                {weather.precipitation_mm}mm/h
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        ) : (
          /* Expanded Full Tactical Advisory Matrix */
          <div className="w-[calc(100vw-48px)] sm:w-84 max-w-[350px] max-h-[calc(100%-24px)] overflow-y-auto bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* HUD Top Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  {weather?.precipitation_mm && weather.precipitation_mm > 0 ? (
                    <CloudRain className="w-3.5 h-3.5" />
                  ) : (
                    <Wind className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-tight uppercase text-sky-300">
                      METEOROLOGICAL THREAT RADAR
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {weather?.location_name || 'Lucknow Urban Grid'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onRefreshWeather && (
                  <button
                    onClick={onRefreshWeather}
                    disabled={weatherLoading}
                    title="Fetch Real-Time Open-Meteo Telemetry"
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin text-sky-400' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => setIsHudCollapsed(true)}
                  title="Minimize Weather HUD"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vis Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-2.5 text-xs font-semibold text-center">
              <button
                onClick={() => setVisMode('precipitation')}
                className={`py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  visMode === 'precipitation'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplets className="w-3 h-3" />
                <span>Rain Radar</span>
              </button>
              <button
                onClick={() => setVisMode('wind')}
                className={`py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  visMode === 'wind'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wind className="w-3 h-3" />
                <span>Wind Stream</span>
              </button>
              <button
                onClick={() => setVisMode('combined')}
                className={`py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  visMode === 'combined'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>All Threats</span>
              </button>
            </div>

            {/* Metrics and Details when weather is available */}
            {weather ? (
              <div className="space-y-2.5">
                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Rainfall</span>
                    <span className="text-sm font-black text-sky-400 flex items-center justify-center gap-0.5">
                      {weather.precipitation_mm} <span className="text-[10px] font-normal">mm/h</span>
                    </span>
                    <span className="text-[8.5px] font-bold text-sky-300/80">
                      {weather.precipitation_intensity}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Wind Vector</span>
                    <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                      <Compass
                        className="w-3 h-3 text-amber-400 transition-transform"
                        style={{ transform: `rotate(${weather.wind_direction_deg}deg)` }}
                      />
                      {weather.wind_speed_kmh} <span className="text-[10px] font-normal">km/h</span>
                    </span>
                    <span className="text-[8.5px] font-bold text-amber-300/80">
                      {weather.wind_direction_cardinal} (Gusts {weather.wind_gusts_kmh})
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Thermal</span>
                    <span className="text-sm font-black text-emerald-400">
                      {weather.temperature_c}°C
                    </span>
                    <span className="text-[8.5px] font-semibold text-slate-400">
                      RH {weather.humidity_percent}%
                    </span>
                  </div>
                </div>

                {/* Tactical Readiness Matrix */}
                <div className="space-y-1.5 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Plane className="w-3 h-3 text-sky-400" />
                      Drone Flight Status:
                    </span>
                    <span
                      className={`font-black px-1.5 py-0.2 rounded text-[10px] ${
                        weather.drone_flight_status === 'SAFE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : weather.drone_flight_status === 'CAUTION'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {weather.drone_flight_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-orange-400" />
                      Fire/Plume Spread Danger:
                    </span>
                    <span className="font-bold text-orange-300 font-mono">
                      {weather.fire_spread_risk}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      Water Inundation Risk:
                    </span>
                    <span className="font-bold text-blue-300 font-mono">
                      {weather.flood_risk}
                    </span>
                  </div>
                </div>

                {/* AI Commander Advisory */}
                <div className="p-2 bg-gradient-to-r from-sky-950/70 to-indigo-950/70 rounded-xl border border-sky-800/60 text-[10px] text-sky-200 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="text-white font-bold">Commander Threat Advisory: </strong>
                    {weather.commander_advisory || 'All environmental telemetry stabilized within safe operating margins.'}
                  </p>
                </div>

                {/* Selected Site Threat Detail Popover */}
                {selectedSiteThreat && (
                  <div className="mt-2.5 p-2.5 bg-rose-950/90 border border-rose-700/90 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-200 flex items-center gap-1 truncate max-w-[220px]">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        {selectedSiteThreat.incident_title}
                      </span>
                      <button
                        onClick={() => setSelectedSiteThreat(null)}
                        className="text-[10px] text-rose-300 hover:text-white px-1 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[10.5px] text-rose-100 font-medium leading-tight">
                      {selectedSiteThreat.primary_threat}
                    </p>
                    <div className="flex items-center justify-between text-[9.5px] text-rose-300 border-t border-rose-800/80 pt-1">
                      <span>Evacuation Safe Corridor:</span>
                      <span className="font-bold text-emerald-300">{selectedSiteThreat.evacuation_safe_zone}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                Loading environmental telemetry...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
