import React from 'react';
import {
  ShieldAlert,
  Brain,
  Cpu,
  Radio,
  Server,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';

export const SystemArchitecture: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Hero */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              RESQRA ARCHITECTURAL BLUEPRINT
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Autonomous AI Emergency Intelligence & Fleet Command Platform
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1">
          ResQra is built on the core doctrine of <strong>"Sense. Decide. Respond."</strong> Traditional 112/911 call centers experience significant dispatch latency due to fragmented manual triage and siloed agency channels. ResQra unites multi-source report fusion, Gemini 3.7 Flash autonomous emergency triage, proximity-weighted fleet dispatch, and real-time hospital bed balancing into a unified command operational picture.
        </p>
      </div>

      {/* 3 Pillars: Sense, Decide, Respond */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 hover:border-cyan-400 transition-all">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold flex items-center justify-center text-sm">
            01
          </div>
          <h3 className="font-bold text-base text-slate-900">SENSE (Ingestion & Fusion)</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Ingests heterogeneous emergency inputs: citizen mobile reports, 112 telephony dispatch logs, IoT water/smoke sensors, and responder radio. Clusters duplicate reports in real time with Gemini semantic similarity matching.
          </p>
          <div className="pt-2 text-xs font-semibold text-cyan-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>Multi-Source Report De-duplication</span>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 hover:border-indigo-400 transition-all">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm">
            02
          </div>
          <h3 className="font-bold text-base text-slate-900">DECIDE (Gemini 3.7 Triage)</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Evaluates unstructured text, victim counts, and trapped civilian risk factors. Calculates severity indices (0–100), outputs operational directives, and generates resource requirement breakdowns.
          </p>
          <div className="pt-2 text-xs font-semibold text-indigo-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Trapped-Casualty Priority Weighting</span>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 hover:border-rose-400 transition-all">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center justify-center text-sm">
            03
          </div>
          <h3 className="font-bold text-base text-slate-900">RESPOND (Smart Dispatch)</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Solves multi-constraint dispatch: Haversine distance, crew readiness, fuel levels, and destination trauma bed capacity to assign optimal rescue units with single-click transmission.
          </p>
          <div className="pt-2 text-xs font-semibold text-rose-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Sub-7-Minute Arrival Target</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Specs Bento Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          TECHNICAL INFRASTRUCTURE & SPECIFICATIONS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">AI REASONING ENGINE</span>
            <strong className="text-indigo-600 font-bold block text-sm">@google/genai SDK</strong>
            <span className="text-slate-500 font-medium">Gemini 3.7 Flash Server-Side</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">BACKEND RUNTIME</span>
            <strong className="text-emerald-600 font-bold block text-sm">Node.js Express + TS</strong>
            <span className="text-slate-500 font-medium">SSE Real-Time Streaming</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">FRONTEND & MAPS</span>
            <strong className="text-sky-600 font-bold block text-sm">React 19 + Leaflet</strong>
            <span className="text-slate-500 font-medium">Bento Grid Design Theme</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">ACOUSTIC & TELEMETRY</span>
            <strong className="text-rose-600 font-bold block text-sm">Web Audio + Speech API</strong>
            <span className="text-slate-500 font-medium">AI Commander Voice Briefs</span>
          </div>
        </div>
      </div>
    </div>
  );
};
