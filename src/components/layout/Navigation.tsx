import React, { useEffect, useState, useRef } from 'react';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  LayoutDashboard,
  MapPin,
  Compass,
  AlertTriangle,
  Send,
  Truck,
  Building2,
  Cpu,
  BarChart3,
  Smartphone,
  ShieldQuestion,
  Layers,
  Search,
  Command,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'map'
  | 'incidents'
  | 'dispatch'
  | 'resources'
  | 'hospitals'
  | 'simulation'
  | 'analytics'
  | 'responder'
  | 'citizen'
  | 'about';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeIncidentsCount: number;
  criticalIncidentsCount?: number;
  onOpenCommandPalette?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeIncidentsCount,
  criticalIncidentsCount = 0,
  onOpenCommandPalette,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCriticalCountRef = useRef(criticalIncidentsCount);
  const [syncStatus, setSyncStatus] = useState<'Online' | 'Reconnecting'>('Online');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(navigator.onLine ? 'Online' : 'Reconnecting');
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateOnlineStatus();

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshotsInSync(db, () => {
        setSyncStatus('Online');
      });
    } catch (err) {
      console.warn('Failed to listen to onSnapshotsInSync:', err);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Whenever a new critical incident is added/detected
    if (criticalIncidentsCount > prevCriticalCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    prevCriticalCountRef.current = criticalIncidentsCount;
  }, [criticalIncidentsCount]);

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'map' as TabType,
      label: 'Tactical Map',
      icon: Compass,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
    },
    {
      id: 'incidents' as TabType,
      label: 'Incidents',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      hasCritical: criticalIncidentsCount > 0,
    },
    {
      id: 'dispatch' as TabType,
      label: 'Dispatch Ops',
      icon: Send,
    },
    {
      id: 'resources' as TabType,
      label: 'Fleet Assets',
      icon: Truck,
    },
    {
      id: 'hospitals' as TabType,
      label: 'Hospitals',
      icon: Building2,
    },
    {
      id: 'simulation' as TabType,
      label: 'Crisis Simulator',
      icon: Cpu,
      isAi: true,
    },
    {
      id: 'analytics' as TabType,
      label: 'Intelligence & Intel',
      icon: BarChart3,
    },
    {
      id: 'responder' as TabType,
      label: 'Responder HUD',
      icon: Smartphone,
    },
    {
      id: 'citizen' as TabType,
      label: 'Citizen Portal',
      icon: ShieldQuestion,
    },
    {
      id: 'about' as TabType,
      label: 'Architecture',
      icon: Layers,
    },
  ];

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 sticky top-[61px] z-40 backdrop-blur-md overflow-x-auto no-scrollbar transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 py-2 min-w-max">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isIncidentTab = tab.id === 'incidents';

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 dark:text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`relative flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-rose-500 text-white'
                        : tab.hasCritical
                        ? 'bg-rose-500 text-white dark:bg-rose-600'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
                    } ${isIncidentTab && (isPulsing || tab.hasCritical) ? 'ring-2 ring-rose-400/80 ring-offset-1 dark:ring-offset-slate-900 animate-pulse scale-105' : ''}`}
                  >
                    {isIncidentTab && isPulsing && (
                      <span className="absolute -inset-1 rounded-full bg-rose-500 opacity-75 animate-ping" />
                    )}
                    <span className="relative z-10">{tab.badge}</span>
                  </span>
                )}

                {tab.isAi && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50'
                  }`}>
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Firestore Sync Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl text-[11px] font-bold tracking-wide shrink-0">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncStatus === 'Online' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${syncStatus === 'Online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Firestore:</span>
            <span className={`${syncStatus === 'Online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} transition-all`}>
              {syncStatus}
            </span>
          </div>

          {/* Quick Access / Command Hub Trigger Button */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Search and access any feature or tool instantly (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Quick Jump</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                ⌘K
              </kbd>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};


