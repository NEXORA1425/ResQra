import React, { useState } from 'react';
import { SimulationParams, SimulationResult, SimulationOptimization, IncidentType, Severity } from '../../types';
import { api } from '../../lib/api';
import {
  Cpu,
  Sparkles,
  AlertTriangle,
  Play,
  CheckCircle2,
  Users,
  Ambulance,
  Waves,
  Flame,
  Truck,
  Building2,
  Send,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const DisasterSimulator: React.FC = () => {
  const [disasterType, setDisasterType] = useState<IncidentType>('FLOOD');
  const [location, setLocation] = useState<string>('Gomti Nagar Basin (Wards 4, 7, 9)');
  const [population, setPopulation] = useState<number>(45000);
  const [severity, setSeverity] = useState<Severity>('CRITICAL');
  const [durationHours, setDurationHours] = useState<number>(6);
  const [infraDamage, setInfraDamage] = useState<'LOW' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC'>('SEVERE');

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [optimization, setOptimization] = useState<SimulationOptimization | null>(null);
  const [deployedMessage, setDeployedMessage] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setDeployedMessage(null);

    const params: SimulationParams = {
      disaster_type: disasterType,
      location,
      latitude: 26.852,
      longitude: 80.998,
      population,
      severity,
      duration_hours: durationHours,
      infrastructure_damage_level: infraDamage,
    };

    try {
      const res = await api.simulation.run(params);
      if (res.success && res.data) {
        setResult(res.data.simulation);
        setOptimization(res.data.optimization);
      }
    } catch (err: any) {
      alert(err.message || 'Simulation failed to run');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeployOptimization = async () => {
    if (!result) return;
    try {
      const res = await api.simulation.optimize(result.id);
      if (res.success) {
        setDeployedMessage(
          'AI fleet reallocation plan successfully deployed to State Operations Center dispatch queues!'
        );
      }
    } catch (err: any) {
      alert(err.message || 'Optimization deployment failed');
    }
  };

  const loadPreset = (preset: {
    type: IncidentType;
    loc: string;
    pop: number;
    sev: Severity;
    dur: number;
    infra: 'LOW' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC';
  }) => {
    setDisasterType(preset.type);
    setLocation(preset.loc);
    setPopulation(preset.pop);
    setSeverity(preset.sev);
    setDurationHours(preset.dur);
    setInfraDamage(preset.infra);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI CRISIS & DISASTER SIMULATOR
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              GEMINI 3.7 FLASH PREDICTIVE ENGINE
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Model catastrophic multi-ward incidents, casualty surges, and autonomous fleet redeployment strategies
          </p>
        </div>
      </div>

      {/* Preset Bento Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() =>
            loadPreset({
              type: 'FLOOD',
              loc: 'Gomti River Basin & Sector 4 Embankment',
              pop: 52000,
              sev: 'CRITICAL',
              dur: 8,
              infra: 'CATASTROPHIC',
            })
          }
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-400 rounded-2xl text-left transition-all shadow-sm cursor-pointer"
        >
          <span className="text-xs font-bold text-cyan-700 block flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-cyan-600" />
            Preset: Gomti Mega Levee Breach
          </span>
          <span className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
            Catastrophic flood inundation affecting 52,000 residents
          </span>
        </button>

        <button
          onClick={() =>
            loadPreset({
              type: 'FIRE',
              loc: 'Aminabad Dense Commercial Core & Wholesale Bazaar',
              pop: 38000,
              sev: 'CRITICAL',
              dur: 6,
              infra: 'SEVERE',
            })
          }
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-orange-400 rounded-2xl text-left transition-all shadow-sm cursor-pointer"
        >
          <span className="text-xs font-bold text-orange-700 block flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-600" />
            Preset: Aminabad Mega Conflagration
          </span>
          <span className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
            High-density market fire with heavy smoke propagation
          </span>
        </button>

        <button
          onClick={() =>
            loadPreset({
              type: 'HAZMAT',
              loc: 'Amar Shaheed Path Highway Corridor',
              pop: 22000,
              sev: 'HIGH',
              dur: 4,
              infra: 'MODERATE',
            })
          }
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-2xl text-left transition-all shadow-sm cursor-pointer"
        >
          <span className="text-xs font-bold text-emerald-700 block flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            Preset: Shaheed Path Chemical Spill
          </span>
          <span className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">
            Chlorine gas plume dispersal across highway corridor
          </span>
        </button>
      </div>

      {/* Simulator Inputs & Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              CRISIS SIMULATION PARAMETERS
            </h3>
          </div>

          {/* Disaster Type */}
          <div>
            <label className="block text-slate-600 font-semibold text-xs mb-1">Disaster Scenario Category</label>
            <select
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value as IncidentType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-semibold"
            >
              <option value="FLOOD">🌊 Urban Flash Flood / Levee Breach</option>
              <option value="FIRE">🔥 Commercial / Industrial Fire Surge</option>
              <option value="HAZMAT">☣️ Toxic Chemical / Hazmat Tanker Leak</option>
              <option value="BUILDING_COLLAPSE">⚠️ Structural Collapse & Earthquake Debris</option>
              <option value="ROAD_ACCIDENT">🚗 Highway Multi-Vehicle Pileup</option>
            </select>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-slate-600 font-semibold text-xs mb-1">Impact Epicenter / Zone</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
            />
          </div>

          {/* Population Exposed */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-600 font-semibold text-xs">Exposed Population</label>
              <span className="font-bold text-indigo-600">{population.toLocaleString()} Residents</span>
            </div>
            <input
              type="range"
              min="5000"
              max="150000"
              step="5000"
              value={population}
              onChange={(e) => setPopulation(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Severity & Infrastructure Damage Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold text-xs mb-1">Crisis Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
              >
                <option value="CRITICAL">🔴 Critical</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold text-xs mb-1">Infrastructure Damage</label>
              <select
                value={infraDamage}
                onChange={(e) => setInfraDamage(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="CATASTROPHIC">Catastrophic</option>
              </select>
            </div>
          </div>

          {/* Simulation Duration */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-600 font-semibold text-xs">Event Duration Projection</label>
              <span className="font-bold text-indigo-600">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer tracking-wide"
          >
            <Sparkles className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'RUNNING GEMINI PREDICTIVE ENGINE...' : 'EXECUTE CRISIS SIMULATION'}</span>
          </button>
        </div>

        {/* Right Output Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center justify-center min-h-[420px]">
              <Cpu className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700 mb-1">SIMULATION ENGINE READY</h4>
              <p className="max-w-md text-slate-500">
                Configure disaster parameters or select a preset, then click "Execute Crisis Simulation" to generate casualty projections, resource demand curves, and automated optimization reallocations.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
              {/* Simulation Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                    PREDICTIVE OUTPUT #{result.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {result.params.disaster_type} Simulation — {result.params.location}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold">
                    Hospital Surge Limit: ~{result.hospital_surge_hours_until_capacity}h
                  </span>
                </div>
              </div>

              {/* Casualty Projections Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">PROJECTED AFFECTED</span>
                  <strong className="text-base text-indigo-600 font-bold">{result.estimated_affected.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">CRITICAL CASUALTIES</span>
                  <strong className="text-base text-rose-600 font-bold">{result.estimated_critical.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">TRAPPED IN ZONE</span>
                  <strong className="text-base text-amber-600 font-bold">{result.estimated_trapped.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">TOTAL INJURED</span>
                  <strong className="text-base text-cyan-600 font-bold">{result.estimated_injured.toLocaleString()}</strong>
                </div>
              </div>

              {/* AI Strategic Assessment */}
              <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">
                {result.ai_analysis_text}
              </p>

              {/* Resource Demand vs Available Matrix */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Resource Demand vs Fleet Availability Matrix
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">AMBULANCES</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.ambulances} Demanded / {result.resources_available.ambulances} Ready
                    </span>
                    {result.shortages.ambulances > 0 && (
                      <span className="text-[10px] text-rose-600 block font-bold mt-0.5">
                        Deficit: -{result.shortages.ambulances}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">RESCUE BOATS</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.rescue_boats} Demanded / {result.resources_available.rescue_boats} Ready
                    </span>
                    {result.shortages.rescue_boats > 0 && (
                      <span className="text-[10px] text-rose-600 block font-bold mt-0.5">
                        Deficit: -{result.shortages.rescue_boats}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">FIRE ENGINES</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.fire_trucks} Demanded / {result.resources_available.fire_trucks} Ready
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">MEDICAL TEAMS</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.medical_teams} Demanded / {result.resources_available.medical_teams} Ready
                    </span>
                    {result.shortages.medical_teams > 0 && (
                      <span className="text-[10px] text-rose-600 block font-bold mt-0.5">
                        Deficit: -{result.shortages.medical_teams}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">POLICE SQUADS</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.police_units} Demanded / {result.resources_available.police_units} Ready
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">CIVIC SHELTERS</span>
                    <span className="font-bold text-slate-900">
                      {result.resources_demanded.shelters} Demanded / {result.resources_available.shelters} Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Operational Directives */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  AI Evacuation & Logistics Directives
                </span>
                <ul className="space-y-1 text-slate-700 text-xs list-disc list-inside leading-relaxed font-medium">
                  {result.recommended_actions.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Optimization Reallocation Plan */}
              {optimization && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Fleet Rebalancing Directive
                    </span>
                    <span className="text-xs text-emerald-800 font-bold">
                      Response Gain: ~{optimization.projected_response_time_improvement_minutes}m faster arrival (-{optimization.projected_casualty_reduction_percent}% casualty shock)
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {optimization.ai_summary}
                  </p>

                  <div className="space-y-2 pt-1">
                    {optimization.reallocations.map((re, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                        <div>
                          <strong className="text-emerald-800 font-bold">{re.resource_name}</strong>
                          <span className="text-slate-500 block text-xs mt-0.5">
                            {re.current_location} → <strong className="text-slate-900">{re.recommended_assignment}</strong>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-emerald-700 font-bold">ETA: ~{re.eta_minutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {deployedMessage ? (
                    <div className="bg-emerald-100 border border-emerald-300 p-3 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{deployedMessage}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleDeployOptimization}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Deploy AI Fleet Reallocation Strategy</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
