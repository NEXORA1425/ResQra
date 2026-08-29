import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { Incident, Resource, DeploymentRouteSuggestion } from '../../types';
import {
  Sparkles,
  Send,
  X,
  Navigation,
  Clock,
  Zap,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface DeploymentSuggestionLayerProps {
  suggestions: DeploymentRouteSuggestion[];
  targetIncident: Incident | null;
  visible: boolean;
  mapEngine: 'google' | 'tactical';
  leafletMap?: L.Map | null;
  googleMap?: google.maps.Map | null;
  onDeployResource: (resource: Resource, incident: Incident) => void;
  onDeployAll: (suggestions: DeploymentRouteSuggestion[]) => void;
  onClearSuggestions: () => void;
  isDeploying?: boolean;
}

export const DeploymentSuggestionLayer: React.FC<DeploymentSuggestionLayerProps> = ({
  suggestions,
  targetIncident,
  visible,
  mapEngine,
  leafletMap,
  googleMap,
  onDeployResource,
  onDeployAll,
  onClearSuggestions,
  isDeploying = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Synchronize D3 SVG layer with either Leaflet or Google Maps projections
  useEffect(() => {
    if (!visible || !svgRef.current || suggestions.length === 0 || !targetIncident) {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // SVG Defs for glowing filters and gradients
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'route-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const containerG = svg.append('g').attr('class', 'deployment-paths-group');

    const updateRoutes = () => {
      if (!svgRef.current) return;
      containerG.selectAll('*').remove();

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

      // Draw each suggested deployment route
      suggestions.forEach((sug, idx) => {
        const pts: Array<[number, number]> = [];

        sug.waypoints.forEach((wp) => {
          const p = projectCoord(wp.lat, wp.lng);
          if (p) pts.push([p.x, p.y]);
        });

        if (pts.length < 2) return;

        const lineGenerator = d3.line()
          .curve(d3.curveCatmullRom.alpha(0.5))
          .x((d) => d[0])
          .y((d) => d[1]);

        const pathData = lineGenerator(pts);
        if (!pathData) return;

        const routeG = containerG.append('g').attr('class', `route-suggestion-${idx}`);

        // 1. Wide background halo
        routeG.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', sug.route_color)
          .attr('stroke-width', 9)
          .attr('stroke-opacity', 0.22)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('filter', 'url(#route-glow)');

        // 2. Solid under-stroke
        routeG.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', sug.route_color)
          .attr('stroke-width', 4)
          .attr('stroke-opacity', 0.8)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');

        // 3. Animated dashed flow line (marching ants effect)
        const flowPath = routeG.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2.2)
          .attr('stroke-dasharray', '7 6')
          .attr('stroke-opacity', 0.95)
          .attr('stroke-linecap', 'round')
          .attr('class', 'animate-route-flow');

        // Start point indicator (Resource origin)
        const startPt = pts[0];
        routeG.append('circle')
          .attr('cx', startPt[0])
          .attr('cy', startPt[1])
          .attr('r', 8)
          .attr('fill', sug.route_color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('class', 'animate-pulse');

        // Midpoint ETA Badge
        const midIdx = Math.floor(pts.length / 2);
        const midPt = pts[midIdx];
        if (midPt) {
          const badgeG = routeG.append('g')
            .attr('transform', `translate(${midPt[0]}, ${midPt[1] - 14})`);

          badgeG.append('rect')
            .attr('x', -45)
            .attr('y', -10)
            .attr('width', 90)
            .attr('height', 20)
            .attr('rx', 10)
            .attr('fill', '#0f172a')
            .attr('stroke', sug.route_color)
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.95);

          badgeG.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 4)
            .attr('fill', '#ffffff')
            .attr('font-size', '9.5px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .text(`${sug.distance_km}km • ${sug.eta_minutes}m ETA`);
        }
      });

      // Target Incident Target Ring at Destination
      const targetPt = projectCoord(targetIncident.latitude, targetIncident.longitude);
      if (targetPt) {
        const destG = containerG.append('g').attr('transform', `translate(${targetPt.x}, ${targetPt.y})`);

        destG.append('circle')
          .attr('r', 24)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4 3')
          .attr('class', 'animate-spin-slow');

        destG.append('circle')
          .attr('r', 10)
          .attr('fill', '#ef4444')
          .attr('fill-opacity', 0.3)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      }
    };

    updateRoutes();

    if (mapEngine === 'tactical' && leafletMap) {
      leafletMap.on('move', updateRoutes);
      leafletMap.on('zoom', updateRoutes);
      leafletMap.on('resize', updateRoutes);
      return () => {
        leafletMap.off('move', updateRoutes);
        leafletMap.off('zoom', updateRoutes);
        leafletMap.off('resize', updateRoutes);
      };
    } else if (mapEngine === 'google' && googleMap) {
      const bListener = googleMap.addListener('bounds_changed', updateRoutes);
      const zListener = googleMap.addListener('zoom_changed', updateRoutes);
      const cListener = googleMap.addListener('center_changed', updateRoutes);
      return () => {
        google.maps.event.removeListener(bListener);
        google.maps.event.removeListener(zListener);
        google.maps.event.removeListener(cListener);
      };
    }
  }, [visible, suggestions, targetIncident, mapEngine, leafletMap, googleMap]);

  if (!visible || !targetIncident || suggestions.length === 0) return null;

  return (
    <>
      {/* SVG Canvas for D3 Pathing */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[380] overflow-hidden"
      />

      {/* Embedded CSS for animated marching ants polyline flow */}
      <style>{`
        @keyframes routeFlow {
          from {
            stroke-dashoffset: 26;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-route-flow {
          animation: routeFlow 0.85s linear infinite;
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          transform-origin: center;
          animation: spinSlow 8s linear infinite;
        }
      `}</style>

      {/* FLOATING AI DEPLOYMENT SUGGESTIONS PANEL */}
      <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-[440px] z-[460] pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-4 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-200 to-white uppercase">
                  AI OPTIMAL DEPLOYMENT SUGGESTIONS
                </h4>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  Top 3 Units
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 truncate max-w-[280px] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                Target: <span className="font-bold text-white">{targetIncident.incident_code}</span> — {targetIncident.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClearSuggestions}
            title="Dismiss Suggested Routes"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Units List */}
        <div className="space-y-2 mb-3.5 max-h-[260px] overflow-y-auto pr-1">
          {suggestions.map((sug, idx) => {
            const isRank1 = sug.priority_rank === 1;

            return (
              <div
                key={sug.resource.id}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Rank Pill */}
                    <span
                      style={{ backgroundColor: sug.route_color }}
                      className="w-5 h-5 rounded-lg text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                    >
                      #{sug.priority_rank}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {sug.resource.callsign}
                        </span>
                        <span className="text-[9.5px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-700">
                          {sug.resource.type}
                        </span>
                        {isRank1 && (
                          <span className="text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 px-1 py-0.2 rounded flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-cyan-400" /> Optimal Pick
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {sug.resource.name} • {sug.resource.crew_size} Crew • {sug.resource.fuel_percent}% Fuel
                      </p>
                    </div>
                  </div>

                  {/* ETA and Distance */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-white flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {sug.eta_minutes}m ETA
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {sug.distance_km} km away
                    </span>
                  </div>
                </div>

                {/* AI Suitability Explanation & Deploy Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/60 text-[10px]">
                  <p className="text-slate-300 italic truncate max-w-[260px]">
                    💡 {sug.suitability_reason}
                  </p>

                  <button
                    onClick={() => onDeployResource(sug.resource, targetIncident)}
                    disabled={isDeploying || sug.resource.status === 'DISPATCHED'}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-2.5 h-2.5" />
                    {sug.resource.status === 'DISPATCHED' ? 'Dispatched' : 'Deploy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Batch Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClearSuggestions}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            onClick={() => onDeployAll(suggestions)}
            disabled={isDeploying}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all transform active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Deploy All 3 Units Now</span>
          </button>
        </div>
      </div>
    </>
  );
};
