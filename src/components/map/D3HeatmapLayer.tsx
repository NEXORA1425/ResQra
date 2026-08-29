import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import { Incident } from '../../types';

interface D3HeatmapLayerProps {
  incidents: Incident[];
  visible: boolean;
  mapEngine: 'google' | 'tactical';
  leafletMap?: L.Map | null;
  googleMap?: google.maps.Map | null;
  opacity?: number;
}

interface HeatPoint extends Incident {
  x: number;
  y: number;
  weight: number;
  radius: number;
}

export const D3HeatmapLayer: React.FC<D3HeatmapLayerProps> = ({
  incidents,
  visible,
  mapEngine,
  leafletMap,
  googleMap,
  opacity = 0.75,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter out resolved or invalid incidents for crisis hotspot calculation
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

  // Compute hotspot metrics using D3
  const hotspotMetrics = useMemo(() => {
    if (activeIncidents.length === 0) return { peakScore: 0, totalWeight: 0, count: 0 };

    const weights = activeIncidents.map((inc) => {
      const base = inc.severity === 'CRITICAL' ? 4 : inc.severity === 'HIGH' ? 2.5 : inc.severity === 'MEDIUM' ? 1.5 : 1;
      const score = (inc.severity_score || 50) / 50;
      return base * score;
    });

    const maxWeight = d3.max<number>(weights) ?? 1;
    const totalWeight = d3.sum(weights) ?? 0;

    return {
      peakScore: Math.round(maxWeight * 25),
      totalWeight,
      count: activeIncidents.length,
    };
  }, [activeIncidents]);

  // LEAFLET MAP D3 RENDERING
  useEffect(() => {
    if (!visible || mapEngine !== 'tactical' || !leafletMap || !svgRef.current) {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Definitions for radiant radial gradients and filters
    const defs = svg.append('defs');

    // Blur filter for organic thermal blending
    const filter = defs.append('filter')
      .attr('id', 'd3-heat-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', 18)
      .attr('result', 'blur');

    // Color ramp for heatmap: Emerald (low) -> Yellow -> Orange -> Crimson -> Deep Violet (critical)
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 0.25, 0.5, 0.75, 1.0])
      .range(['#10b981', '#facc15', '#f97316', '#e11d48', '#881337']);

    const g = svg.append('g').attr('class', 'leaflet-zoom-hide d3-heatmap-container');

    const updateLeafletHeatmap = () => {
      if (!leafletMap || !svgRef.current) return;
      const size = leafletMap.getSize();
      svg
        .attr('width', size.x)
        .attr('height', size.y)
        .style('width', `${size.x}px`)
        .style('height', `${size.y}px`);

      // Project incident coordinates to pixel space
      const projectedData: HeatPoint[] = activeIncidents.map((inc) => {
        const point = leafletMap.latLngToContainerPoint([inc.latitude, inc.longitude]);
        const weight = inc.severity === 'CRITICAL' ? 1.0 : inc.severity === 'HIGH' ? 0.7 : inc.severity === 'MEDIUM' ? 0.45 : 0.25;
        const radius = inc.severity === 'CRITICAL' ? 75 : inc.severity === 'HIGH' ? 55 : inc.severity === 'MEDIUM' ? 40 : 30;
        return {
          ...inc,
          x: point.x,
          y: point.y,
          weight,
          radius,
        };
      });

      // Clear existing elements in g
      g.selectAll('*').remove();

      // Render radial glow spots
      const spots = g.selectAll<SVGGElement, HeatPoint>('.heat-spot')
        .data(projectedData)
        .enter()
        .append('g')
        .attr('class', 'heat-spot')
        .attr('transform', (d: HeatPoint) => `translate(${d.x}, ${d.y})`);

      // Outer thermal halo
      spots.append('circle')
        .attr('r', (d: HeatPoint) => d.radius * 1.5)
        .attr('fill', (d: HeatPoint) => colorScale(d.weight))
        .attr('opacity', 0.25)
        .attr('filter', 'url(#d3-heat-blur)');

      // Mid intense thermal core
      spots.append('circle')
        .attr('r', (d: HeatPoint) => d.radius)
        .attr('fill', (d: HeatPoint) => colorScale(d.weight))
        .attr('opacity', 0.45)
        .attr('filter', 'url(#d3-heat-blur)');

      // Hotspot core center
      spots.append('circle')
        .attr('r', (d: HeatPoint) => Math.max(12, d.radius * 0.4))
        .attr('fill', (d: HeatPoint) => d.severity === 'CRITICAL' ? '#ffffff' : colorScale(d.weight))
        .attr('opacity', (d: HeatPoint) => (d.severity === 'CRITICAL' ? 0.85 : 0.6))
        .attr('filter', 'url(#d3-heat-blur)');

      // Hotspot label pulse for Critical clusters
      const criticalClusters = projectedData.filter((d) => d.severity === 'CRITICAL');
      const clusterLabels = g.selectAll<SVGGElement, HeatPoint>('.hotspot-tag')
        .data(criticalClusters)
        .enter()
        .append('g')
        .attr('class', 'hotspot-tag')
        .attr('transform', (d: HeatPoint) => `translate(${d.x}, ${d.y - d.radius - 8})`);

      clusterLabels.append('rect')
        .attr('x', -48)
        .attr('y', -12)
        .attr('width', 96)
        .attr('height', 18)
        .attr('rx', 6)
        .attr('fill', '#881337')
        .attr('opacity', 0.9)
        .attr('stroke', '#fda4af')
        .attr('stroke-width', 1);

      clusterLabels.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1')
        .attr('fill', '#ffffff')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text('🔥 CRISIS EPICENTER');
    };

    updateLeafletHeatmap();

    leafletMap.on('move', updateLeafletHeatmap);
    leafletMap.on('zoom', updateLeafletHeatmap);
    leafletMap.on('resize', updateLeafletHeatmap);

    return () => {
      leafletMap.off('move', updateLeafletHeatmap);
      leafletMap.off('zoom', updateLeafletHeatmap);
      leafletMap.off('resize', updateLeafletHeatmap);
    };
  }, [visible, mapEngine, leafletMap, activeIncidents]);

  // GOOGLE MAPS PLATFORM D3 RENDERING
  useEffect(() => {
    if (!visible || mapEngine !== 'google' || !googleMap || !svgRef.current) {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll('*').remove();
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'd3-google-heat-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', 20)
      .attr('result', 'blur');

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 0.25, 0.5, 0.75, 1.0])
      .range(['#10b981', '#facc15', '#f97316', '#e11d48', '#881337']);

    const g = svg.append('g').attr('class', 'd3-google-heatmap-container');

    const updateGoogleHeatmap = () => {
      if (!googleMap || !svgRef.current) return;
      const projection = googleMap.getProjection();
      const bounds = googleMap.getBounds();
      const mapDiv = googleMap.getDiv();

      if (!projection || !bounds || !mapDiv) return;

      const width = mapDiv.clientWidth;
      const height = mapDiv.clientHeight;

      svg
        .attr('width', width)
        .attr('height', height)
        .style('width', `${width}px`)
        .style('height', `${height}px`);

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const topRight = projection.fromLatLngToPoint(ne);
      const bottomLeft = projection.fromLatLngToPoint(sw);

      if (!topRight || !bottomLeft) return;

      const scale = Math.pow(2, googleMap.getZoom() || 13);

      const projectedData: HeatPoint[] = activeIncidents
        .map((inc) => {
          const latLng = new google.maps.LatLng(inc.latitude, inc.longitude);
          const worldPoint = projection.fromLatLngToPoint(latLng);
          if (!worldPoint) return null;

          const x = (worldPoint.x - bottomLeft.x) * scale;
          const y = (worldPoint.y - topRight.y) * scale;

          const weight = inc.severity === 'CRITICAL' ? 1.0 : inc.severity === 'HIGH' ? 0.7 : inc.severity === 'MEDIUM' ? 0.45 : 0.25;
          const radius = inc.severity === 'CRITICAL' ? 75 : inc.severity === 'HIGH' ? 55 : inc.severity === 'MEDIUM' ? 40 : 30;

          return {
            ...inc,
            x,
            y,
            weight,
            radius,
          };
        })
        .filter((item): item is HeatPoint => item !== null);

      g.selectAll('*').remove();

      const spots = g.selectAll<SVGGElement, HeatPoint>('.heat-spot')
        .data(projectedData)
        .enter()
        .append('g')
        .attr('class', 'heat-spot')
        .attr('transform', (d: HeatPoint) => `translate(${d.x}, ${d.y})`);

      // Radiant thermal envelope
      spots.append('circle')
        .attr('r', (d: HeatPoint) => d.radius * 1.6)
        .attr('fill', (d: HeatPoint) => colorScale(d.weight))
        .attr('opacity', 0.28)
        .attr('filter', 'url(#d3-google-heat-blur)');

      // Secondary thermal body
      spots.append('circle')
        .attr('r', (d: HeatPoint) => d.radius)
        .attr('fill', (d: HeatPoint) => colorScale(d.weight))
        .attr('opacity', 0.48)
        .attr('filter', 'url(#d3-google-heat-blur)');

      // Intense focal point
      spots.append('circle')
        .attr('r', (d: HeatPoint) => Math.max(14, d.radius * 0.35))
        .attr('fill', (d: HeatPoint) => (d.severity === 'CRITICAL' ? '#ffffff' : colorScale(d.weight)))
        .attr('opacity', (d: HeatPoint) => (d.severity === 'CRITICAL' ? 0.85 : 0.6))
        .attr('filter', 'url(#d3-google-heat-blur)');

      // Critical epicenter tag
      const criticalPoints = projectedData.filter((d) => d.severity === 'CRITICAL');
      const clusterLabels = g.selectAll<SVGGElement, HeatPoint>('.hotspot-tag')
        .data(criticalPoints)
        .enter()
        .append('g')
        .attr('class', 'hotspot-tag')
        .attr('transform', (d: HeatPoint) => `translate(${d.x}, ${d.y - d.radius - 8})`);

      clusterLabels.append('rect')
        .attr('x', -48)
        .attr('y', -12)
        .attr('width', 96)
        .attr('height', 18)
        .attr('rx', 6)
        .attr('fill', '#881337')
        .attr('opacity', 0.9)
        .attr('stroke', '#fda4af')
        .attr('stroke-width', 1);

      clusterLabels.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1')
        .attr('fill', '#ffffff')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text('🔥 CRISIS EPICENTER');
    };

    updateGoogleHeatmap();

    const boundsListener = googleMap.addListener('bounds_changed', updateGoogleHeatmap);
    const zoomListener = googleMap.addListener('zoom_changed', updateGoogleHeatmap);
    const centerListener = googleMap.addListener('center_changed', updateGoogleHeatmap);

    return () => {
      google.maps.event.removeListener(boundsListener);
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(centerListener);
    };
  }, [visible, mapEngine, googleMap, activeIncidents]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[350] transition-opacity duration-300"
      style={{ opacity }}
    >
      <svg ref={svgRef} className="w-full h-full" />

      {/* Heatmap HUD Legend */}
      <div className="absolute bottom-4 left-4 z-[420] pointer-events-auto bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 min-w-[210px]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-bold tracking-tight uppercase text-rose-300">
              D3 Crisis Density Heatmap
            </span>
          </div>
          <span className="text-[10px] font-mono bg-rose-950/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/80 font-bold">
            {hotspotMetrics.count} Active Hotspots
          </span>
        </div>

        {/* Dynamic Heat Gradient Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>Low Density</span>
            <span>Moderate</span>
            <span>Critical Hotspot</span>
          </div>
        </div>
      </div>
    </div>
  );
};
