import React, { useState } from 'react';
import { AICommanderSummary } from '../../types';
import {
  Brain,
  Volume2,
  VolumeX,
  Sparkles,
  AlertOctagon,
  ShieldCheck,
  Building2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { soundManager } from '../common/TacticalAudioAlert';

interface AICommanderPanelProps {
  summary: AICommanderSummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectIncident?: (incidentId: string) => void;
  onDispatchRecommendation?: (recommendation: any) => void;
}

export const AICommanderPanel: React.FC<AICommanderPanelProps> = ({
  summary,
  isLoading,
  onRefresh,
  onSelectIncident,
  onDispatchRecommendation,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = () => {
    if (!summary) return;
    if (isSpeaking) {
      soundManager.stopSpeech();
      setIsSpeaking(false);
    } else {
      soundManager.speakAICommanderBriefing(
        `ResQra AI Commander situation update: ${summary.situation_summary}. Immediate action: ${summary.recommendations[0]?.action || 'Coordinate dispatch'}`
      );
      setIsSpeaking(true);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse text-slate-400 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm font-bold text-slate-800">AI COMMANDER GENERATING SITUATION MATRIX...</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
      </div>
    );
  }

  if (!summary) return null;

  const topRec = summary.recommendations?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Bento Main Cell 1: Situation Assessment & Telemetry Readiness (Col Span 8) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
        {/* Header Row */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">AI COMMANDER SITUATION MATRIX</h3>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold">
                    GEMINI 3.7 FLASH
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time situation synthesis and autonomous resource optimization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeech}
                title={isSpeaking ? 'Mute AI Briefing' : 'Listen to AI Briefing'}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isSpeaking
                    ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
                <span className="hidden sm:inline">{isSpeaking ? 'Speaking' : 'Voice Brief'}</span>
              </button>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="Refresh Situation Matrix"
                  className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Situation Synthesis Text with Left-Accent Bar */}
          <div className="space-y-4 mb-4">
            <div className="border-l-2 border-indigo-500 pl-3.5 py-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Real-Time Situation Assessment
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {summary.situation_summary}
              </p>
            </div>

            {/* Critical Bottlenecks with Left-Accent Bar */}
            {summary.critical_bottlenecks && summary.critical_bottlenecks.length > 0 && (
              <div className="border-l-2 border-rose-500 pl-3.5 py-1 bg-rose-50/40 rounded-r-xl p-2.5">
                <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  Critical Bottlenecks & Hazards
                </div>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                  {summary.critical_bottlenecks.map((b, idx) => (
                    <li key={idx} className="line-clamp-1">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Readiness Meter Row */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              State Fleet Deployment Readiness
            </span>
            <span className="font-bold text-indigo-600">{summary.tactical_readiness_score}% Operational</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.tactical_readiness_score}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">ACTIVE CRISES</span>
              <strong className="text-slate-900 font-bold text-sm">{summary.active_incidents}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">CRITICAL ALERTS</span>
              <strong className="text-rose-600 font-bold text-sm">{summary.critical_incidents}</strong>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-semibold">TRAPPED CITIZENS</span>
              <strong className="text-rose-600 font-bold text-sm">{summary.people_trapped}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Main Cell 2: Top Priority Directive Card (Col Span 4 - Dark Bento Accent) */}
      <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-100 tracking-tight flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Priority Action Directive
            </h4>
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Urgent
            </span>
          </div>

          {topRec ? (
            <div className="space-y-3">
              <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                    Target #{topRec.incident_code || 'INC'}
                  </span>
                  {topRec.suggested_hospital && (
                    <span className="text-[10px] text-sky-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {topRec.suggested_hospital.split(' ')[0]}
                    </span>
                  )}
                </div>
                <h5 className="text-sm font-semibold text-white leading-snug">{topRec.title}</h5>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{topRec.action}</p>
              </div>

              {topRec.suggested_resources && topRec.suggested_resources.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Recommended Resource Composition:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {topRec.suggested_resources.map((r, i) => (
                      <span
                        key={i}
                        className="bg-slate-800 text-indigo-300 border border-slate-700 px-2 py-1 rounded-lg text-[11px] font-semibold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">All immediate tactical directives fulfilled.</p>
          )}
        </div>

        {/* Action Buttons */}
        {topRec && (
          <div className="pt-4 mt-4 border-t border-slate-800 flex items-center gap-2">
            {onSelectIncident && topRec.incident_id && (
              <button
                onClick={() => onSelectIncident(topRec.incident_id)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold transition-colors border border-slate-700 text-center"
              >
                Inspect
              </button>
            )}
            {onDispatchRecommendation && (
              <button
                onClick={() => onDispatchRecommendation(topRec)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold shadow-sm shadow-indigo-900 flex items-center justify-center gap-1.5 transition-all transform active:scale-95 text-center"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Fleet
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

