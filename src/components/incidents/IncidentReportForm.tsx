import React, { useState, useRef } from 'react';
import { Incident } from '../../types';
import {
  X,
  Radio,
  MapPin,
  Flame,
  Waves,
  Car,
  HeartPulse,
  Sparkles,
  Send,
  AlertCircle,
  Clock,
  ShieldAlert,
  Camera,
  Upload,
  Eye,
  CheckCircle2,
  Scan,
} from 'lucide-react';
import { api } from '../../lib/api';

interface IncidentReportFormProps {
  onClose: () => void;
  onCreated: (incident: Incident) => void;
}

const PRESET_SCENARIOS = [
  {
    label: '🌊 Gomti Riverfront Flash Flood Surge',
    title: 'Gomti River Water Overflowing into Residential Sector 4',
    description: 'River water has breached embankments near Gomti Riverfront Park. Ground floors flooded under 4.5 feet of water. 14 residents trapped on roofs with senior citizens.',
    location_name: 'Sector 4, Gomti Nagar, Lucknow',
    latitude: 26.8530,
    longitude: 80.9780,
    affected: 45,
    injured: 4,
    trapped: 14,
    type: 'FLOOD',
  },
  {
    label: '🔥 Aminabad Market Electrical Transformer Fire',
    title: 'Major Transformer Explosion & Fire in Dense Commercial Area',
    description: 'Transformer exploded near textile wholesale market. Fire spreading to adjacent timber shops. Heavy toxic smoke and 50+ shopkeepers evacuating narrow alleyways.',
    location_name: 'Aminabad Commercial Core, Lucknow',
    latitude: 26.8440,
    longitude: 80.9250,
    affected: 80,
    injured: 6,
    trapped: 3,
    type: 'FIRE',
  },
  {
    label: '🚗 Shaheed Path Expressway Multi-Vehicle Pileup',
    title: 'Expressway Tanker Collision with 4 Passenger Cars',
    description: 'High-speed chemical tanker crashed into multiple cars in heavy fog on Shaheed Path. Diesel leaking onto highway. Multiple occupants trapped inside crushed frames.',
    location_name: 'Amar Shaheed Path Highway (Near Ekana Stadium), Lucknow',
    latitude: 26.7990,
    longitude: 80.9950,
    affected: 18,
    injured: 7,
    trapped: 4,
    type: 'ROAD_ACCIDENT',
  },
  {
    label: '⚠️ Chowk Old Building Partial Structural Collapse',
    title: 'Centenary Heritage Building Balcony & Wall Collapse',
    description: 'Heavy monsoon rains caused rear structure of a 3-storey old heritage residential building to collapse into alley. Debris blocking street with possible victims buried under masonry.',
    location_name: 'Chowk Heritage Precinct, Old Lucknow',
    latitude: 26.8680,
    longitude: 80.9080,
    affected: 25,
    injured: 5,
    trapped: 6,
    type: 'BUILDING_COLLAPSE',
  },
];

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Gomti Nagar, Lucknow');
  const [latitude, setLatitude] = useState(26.8500);
  const [longitude, setLongitude] = useState(80.9500);
  const [peopleAffected, setPeopleAffected] = useState(10);
  const [peopleInjured, setPeopleInjured] = useState(2);
  const [peopleTrapped, setPeopleTrapped] = useState(1);
  const [source, setSource] = useState('CITIZEN');
  const [type, setType] = useState('FLOOD');
  const [reportedBy, setReportedBy] = useState('Citizen Field Report');

  // Cloud Vision API Triage State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionResult, setVisionResult] = useState<{
    labels: string[];
    objects: string[];
    detectedHazards: string[];
    suggestedIncidentType: string;
    severityEstimate: string;
    estimatedVictimCount: number;
    aiDamageAssessment: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setIsAnalyzingVision(true);
      setError(null);

      try {
        const res = await api.ai.analyzeVision({ image: base64 });
        if (res.success && res.data) {
          setVisionResult(res.data);
          // Auto-suggest fields
          if (res.data.suggestedIncidentType && res.data.suggestedIncidentType !== 'OTHER') {
            setType(res.data.suggestedIncidentType);
          }
          if (res.data.estimatedVictimCount) {
            setPeopleTrapped(res.data.estimatedVictimCount);
          }
          if (!description) {
            setDescription(res.data.aiDamageAssessment);
          }
          if (!title) {
            setTitle(`Visual Alert: ${res.data.labels.slice(0, 3).join(', ')} Incident`);
          }
        }
      } catch (err: any) {
        console.warn('Vision analysis failed:', err);
      } finally {
        setIsAnalyzingVision(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setLocationName(preset.location_name);
    setLatitude(preset.latitude);
    setLongitude(preset.longitude);
    setPeopleAffected(preset.affected);
    setPeopleInjured(preset.injured);
    setPeopleTrapped(preset.trapped);
    setType(preset.type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a detailed description of the emergency incident.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.incidents.create({
        title: title.trim() || undefined,
        description: description.trim(),
        location_name: locationName.trim() || 'Lucknow Emergency Location',
        latitude: Number(latitude) || 26.8500,
        longitude: Number(longitude) || 80.9500,
        people_affected: Number(peopleAffected) || 0,
        people_injured: Number(peopleInjured) || 0,
        people_trapped: Number(peopleTrapped) || 0,
        type: type as any,
        source: source as any,
        reported_by: reportedBy,
      });

      if (res.success && res.data) {
        onCreated(res.data);
        onClose();
      } else {
        setError('Server rejected incident creation.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit incident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                REPORT EMERGENCY INCIDENT
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ingests report into Gemini 3.7 AI Emergency Intelligence Triage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Scenarios */}
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Test Scenarios (One-Click Populate)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all group text-xs cursor-pointer"
                >
                  <span className="font-bold text-slate-800 group-hover:text-indigo-700 block truncate">
                    {preset.label}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                    {preset.location_name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Google Cloud Vision API Scene & Damage Scanner */}
          <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-indigo-600" />
                AI SCENE DAMAGE SCANNER (GOOGLE CLOUD VISION API)
              </span>
              <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                API Active
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Upload Scene Photo</span>
              </button>

              <span className="text-[11px] text-slate-500 font-medium">
                Auto-detects fire, floodwater, vehicle crashes, collapse debris, and trapped victims.
              </span>
            </div>

            {isAnalyzingVision && (
              <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-700 font-semibold animate-pulse">
                <Scan className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Analyzing scene damage with Google Cloud Vision API...</span>
              </div>
            )}

            {visionResult && !isAnalyzingVision && (
              <div className="bg-white rounded-xl p-3.5 border border-indigo-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cloud Vision Triage Complete
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                    Estimated Risk: {visionResult.severityEstimate}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {visionResult.labels.slice(0, 5).map((label, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[10px] border border-indigo-100">
                      🏷️ {label}
                    </span>
                  ))}
                  {visionResult.objects.map((obj, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium text-[10px] border border-amber-100">
                      🎯 {obj}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-medium border border-slate-100">
                  {visionResult.aiDamageAssessment}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3.5">
            {/* Title */}
            <div>
              <label className="block text-slate-600 font-semibold text-xs mb-1">
                Emergency Headline / Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flash flood inundation at Gomti Riverfront Sector 4"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-600 font-semibold text-xs mb-1">
                Field Situation Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is happening, visible hazards, flood depth, fire extent, or trapped people..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />
            </div>

            {/* Location & Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Location / Landmark
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Victim Counts */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-slate-500 font-semibold text-[10px] uppercase mb-1">
                  Affected Citizens
                </label>
                <input
                  type="number"
                  min="0"
                  value={peopleAffected}
                  onChange={(e) => setPeopleAffected(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-amber-700 font-semibold text-[10px] uppercase mb-1">
                  Injured Citizens
                </label>
                <input
                  type="number"
                  min="0"
                  value={peopleInjured}
                  onChange={(e) => setPeopleInjured(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-amber-700 font-bold text-center focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-rose-700 font-semibold text-[10px] uppercase mb-1">
                  Trapped / Stranded
                </label>
                <input
                  type="number"
                  min="0"
                  value={peopleTrapped}
                  onChange={(e) => setPeopleTrapped(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-700 font-bold text-center focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Type & Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Emergency Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="FLOOD">🌊 Flood / Water Surge</option>
                  <option value="FIRE">🔥 Fire / Explosion</option>
                  <option value="ROAD_ACCIDENT">🚗 Road Collision</option>
                  <option value="BUILDING_COLLAPSE">⚠️ Structural Collapse</option>
                  <option value="MEDICAL">🩺 Mass Medical Emergency</option>
                  <option value="HAZMAT">☣️ Hazardous Material</option>
                  <option value="RAILWAY">🚆 Railway Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Ingestion Source Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="CITIZEN">📱 Citizen Mobile Portal</option>
                  <option value="CALL_112">📞 Emergency 112 Call Center</option>
                  <option value="IOT_SENSOR">📡 IoT Water/Fire Sensor</option>
                  <option value="RESPONDER">🚓 Field Responder Radio</option>
                  <option value="DRONE">🛸 Surveillance Drone</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-200 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Triaging with Gemini AI...' : 'Submit & Triage Emergency'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
