import React from 'react';
import {
  Sparkles,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Waves,
  Send,
  Building2,
  Cpu,
} from 'lucide-react';

interface DemoWalkthroughModalProps {
  onClose: () => void;
  onSelectTab: (tab: any) => void;
  onTriggerFloodScenario: () => void;
  onResetDemo: () => void;
  onOpenReportModal: () => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  onClose,
  onSelectTab,
  onTriggerFloodScenario,
  onResetDemo,
  onOpenReportModal,
}) => {
  const steps = [
    {
      step: 1,
      title: 'Real-time Emergency Ingestion',
      desc: 'Simulate or report an emergency incident. Notice how Gemini 3.7 Flash triages victim counts, trapped citizens, and required fleet types within seconds.',
      actionLabel: 'Trigger Gomti Flood Crisis',
      action: () => {
        onTriggerFloodScenario();
        onSelectTab('dashboard');
        onClose();
      },
      icon: Waves,
      color: 'text-cyan-600',
    },
    {
      step: 2,
      title: 'AI Commander Situation Matrix',
      desc: 'View autonomous real-time situation synthesis, operational bottlenecks, voice briefings, and priority dispatch recommendations.',
      actionLabel: 'View AI Commander',
      action: () => {
        onSelectTab('dashboard');
        onClose();
      },
      icon: Sparkles,
      color: 'text-indigo-600',
    },
    {
      step: 3,
      title: 'Smart Fleet & Trauma Hospital Dispatch',
      desc: 'Execute proximity & capability-ranked resource allocation with one click. Balances regional trauma hospital bed occupancies.',
      actionLabel: 'Open Dispatch Operations',
      action: () => {
        onSelectTab('dispatch');
        onClose();
      },
      icon: Send,
      color: 'text-rose-600',
    },
    {
      step: 4,
      title: 'Field Responder In-Cab HUD',
      desc: 'Switch to the Field Responder terminal to view turn-by-turn routing, victim counts, START casualty triage, and stage progression.',
      actionLabel: 'Launch Responder HUD',
      action: () => {
        onSelectTab('responder');
        onClose();
      },
      icon: ShieldAlert,
      color: 'text-emerald-600',
    },
    {
      step: 5,
      title: 'Disaster Simulator & Fleet Optimization',
      desc: 'Model catastrophic multi-ward disasters, calculate casualty surges and resource shortages, and deploy AI fleet rebalancing plans.',
      actionLabel: 'Launch Crisis Simulator',
      action: () => {
        onSelectTab('simulation');
        onClose();
      },
      icon: Cpu,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                EVALUATION & DEMO WALKTHROUGH
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Interactive guide to test end-to-end autonomous capabilities of ResQra
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

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-xs">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:border-indigo-300 transition-all shadow-2xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 text-xs shadow-2xs">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${s.color}`} />
                      {s.title}
                    </h4>
                    <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={s.action}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <span>{s.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => {
              onResetDemo();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo State to Initial</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
