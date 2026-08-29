import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Incident,
  Resource,
  Hospital,
  Dispatch,
  AICommanderSummary,
  AnalyticsOverview,
  User,
  UserRole,
} from './types';
import { api } from './lib/api';
import { auth, onAuthStateChanged, syncIncidentToFirestore } from './lib/firebase';
import { soundManager } from './components/common/TacticalAudioAlert';
import { Header } from './components/layout/Header';
import { Navigation, TabType } from './components/layout/Navigation';
import { KPIGrid } from './components/dashboard/KPIGrid';
import { AICommanderPanel } from './components/ai/AICommanderPanel';
import { IncidentFeed } from './components/dashboard/IncidentFeed';
import { IncidentMap } from './components/map/IncidentMap';
import { DispatchCenter } from './components/dispatch/DispatchCenter';
import { ResourceManagement } from './components/resources/ResourceManagement';
import { HospitalManagement } from './components/hospitals/HospitalManagement';
import { DisasterSimulator } from './components/simulation/DisasterSimulator';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ResponderDashboard } from './components/responder/ResponderDashboard';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { SystemArchitecture } from './components/about/SystemArchitecture';
import { IncidentDetailsModal } from './components/incidents/IncidentDetailsModal';
import { IncidentReportForm } from './components/incidents/IncidentReportForm';
import { DemoWalkthroughModal } from './components/demo/DemoWalkthroughModal';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';

const DEFAULT_OVERVIEW: AnalyticsOverview & { total_resources?: number; available_resources?: number } = {
  total_incidents: 4,
  active_incidents: 3,
  resolved_today: 1,
  critical_incidents: 1,
  people_assisted: 284,
  average_response_time_minutes: 6.8,
  average_triage_time_seconds: 4.2,
  resource_utilization_percent: 34,
  hospital_bed_occupancy_percent: 78,
  icu_occupancy_percent: 81,
  total_resources: 43,
  available_resources: 28,
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Inspector Vikram Singh',
    email: 'commander@resqra.gov.in',
    role: 'OPERATOR',
    agency: 'State Emergency Operations Center (SEOC), Lucknow',
    badgeNumber: 'SEOC-904',
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setCurrentUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          name: fbUser.displayName || 'Authorized Officer',
          email: fbUser.email || prev.email,
          avatarUrl: fbUser.photoURL || undefined,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('resqra_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('resqra_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('resqra_theme', 'light');
    }
  }, [darkMode]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [aiSummary, setAiSummary] = useState<AICommanderSummary | null>(null);
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);

  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState<Incident | null>(null);
  const [selectedIncidentForDispatch, setSelectedIncidentForDispatch] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAnalyzingIncident, setIsAnalyzingIncident] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Initial Data Load
  const fetchAllData = useCallback(async () => {
    try {
      const [incRes, resRes, hospRes, dispRes, overviewRes] = await Promise.all([
        api.incidents.list(),
        api.resources.list(),
        api.hospitals.list(),
        api.dispatch.list(),
        api.analytics.overview(),
      ]);

      if (incRes.success) setIncidents(incRes.data);
      if (resRes.success) setResources(resRes.data);
      if (hospRes.success) setHospitals(hospRes.data);
      if (dispRes.success) setDispatches(dispRes.data);
      if (overviewRes.success) setOverview(overviewRes.data);
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  }, []);

  const fetchAISummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await api.commander.getSummary();
      if (res.success && res.data) {
        setAiSummary(res.data);
      }
    } catch (err) {
      console.warn('AI Summary fetch error:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchAISummary();

    // Subscribe to real-time events via Server-Sent Events (SSE)
    const unsubscribe = api.subscribeToEvents((event) => {
      console.log('[SSE Event Received]', event.event_type);
      if (event.event_type === 'INCIDENT_CREATED') {
        soundManager.playCriticalAlert();
      }
      fetchAllData();
      fetchAISummary();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchAllData, fetchAISummary]);

  // Handle Role Switch
  const handleSwitchUserRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      name:
        role === 'OPERATOR'
          ? 'Inspector Vikram Singh'
          : role === 'RESPONDER'
          ? 'Captain Rajesh Kumar (NDRF Boat 01)'
          : role === 'CITIZEN'
          ? 'Ananya Sharma (Citizen)'
          : 'SEOC Super Administrator',
    }));

    if (role === 'RESPONDER') {
      setActiveTab('responder');
    } else if (role === 'CITIZEN') {
      setActiveTab('citizen');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Handle Quick Dispatch from card or map
  const handleQuickDispatch = (incident: Incident) => {
    setSelectedIncidentForDispatch(incident.id);
    setActiveTab('dispatch');
  };

  // Handle Deep AI Re-Triage
  const handleAnalyzeIncident = async (incident: Incident) => {
    setIsAnalyzingIncident(true);
    try {
      const res = await api.incidents.analyze(incident.id);
      if (res.success && res.data) {
        fetchAllData();
        if (selectedIncidentForModal?.id === incident.id) {
          setSelectedIncidentForModal(res.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'AI Triage failed');
    } finally {
      setIsAnalyzingIncident(false);
    }
  };

  // Handle Resolve Incident
  const handleResolveIncident = async (incident: Incident) => {
    try {
      await api.incidents.update(incident.id, { status: 'RESOLVED' });
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve incident');
    }
  };

  // Demo Controls
  const handleResetDemo = async () => {
    try {
      await api.demo.reset();
      fetchAllData();
      fetchAISummary();
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo');
    }
  };

  const handleTriggerFloodCrisis = async () => {
    try {
      await api.demo.triggerFloodScenario();
      soundManager.playCriticalAlert();
      fetchAllData();
      fetchAISummary();
    } catch (err: any) {
      alert(err.message || 'Failed to trigger scenario');
    }
  };

  const criticalIncidentsCount = incidents.filter(
    (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED'
  ).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
      {/* Top Telemetry Header */}
      <Header
        currentUser={currentUser}
        onSwitchUserRole={handleSwitchUserRole}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onResetDemo={handleResetDemo}
        onTriggerFloodCrisis={handleTriggerFloodCrisis}
        criticalCount={criticalIncidentsCount}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        activeIncidentsCount={incidents.filter((i) => i.status !== 'RESOLVED').length}
        criticalIncidentsCount={criticalIncidentsCount}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Primary Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* VIEW 1: COMMAND CENTER DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 8-Metric Bento KPI Grid */}
                <KPIGrid data={overview} />

                {/* AI Commander Situation Synthesis Bento Panel */}
                <AICommanderPanel
                  summary={aiSummary}
                  isLoading={isLoadingSummary}
                  onRefresh={fetchAISummary}
                  onSelectIncident={(incId) => {
                    const inc = incidents.find((i) => i.id === incId);
                    if (inc) setSelectedIncidentForModal(inc);
                  }}
                  onDispatchRecommendation={(rec) => {
                    if (rec.incident_id) {
                      setSelectedIncidentForDispatch(rec.incident_id);
                      setActiveTab('dispatch');
                    }
                  }}
                />

                {/* Main Interactive Command Bento Grid: CSS Grid Area implementation with layout transitions */}
                <motion.div 
                  layout
                  className="dashboard-bento-grid grid gap-6 w-full transition-all duration-500 ease-in-out"
                  style={{
                    display: 'grid',
                    gridTemplateAreas: '"map" "feed"',
                    gridTemplateColumns: '100%',
                  }}
                >
                  <style>{`
                    @media (min-width: 1024px) {
                      .dashboard-bento-grid {
                        grid-template-areas: "map feed" !important;
                        grid-template-columns: 58% 42% !important;
                      }
                    }
                  `}</style>

                  {/* Geo-Radar Map Container with CSS Grid Area */}
                  <motion.div 
                    layout
                    className="flex flex-col min-h-[350px] sm:min-h-[420px] lg:min-h-[560px] transition-all duration-500 ease-in-out"
                    style={{ gridArea: 'map' }}
                  >
                    <IncidentMap
                      incidents={incidents}
                      resources={resources}
                      hospitals={hospitals}
                      onSelectIncident={(inc) => setSelectedIncidentForModal(inc)}
                      onQuickDispatch={handleQuickDispatch}
                    />
                  </motion.div>

                  {/* Priority Incident Feed Container with CSS Grid Area */}
                  <motion.div 
                    layout
                    className="flex flex-col min-h-[400px] sm:min-h-[480px] lg:min-h-[560px] transition-all duration-500 ease-in-out"
                    style={{ gridArea: 'feed' }}
                  >
                    <IncidentFeed
                      incidents={incidents}
                      onSelectIncident={(inc) => setSelectedIncidentForModal(inc)}
                      onDispatch={handleQuickDispatch}
                      onAnalyze={handleAnalyzeIncident}
                      onResolve={handleResolveIncident}
                    />
                  </motion.div>
                </motion.div>
              </div>
            )}

            {/* VIEW 1B: FULL TACTICAL GIS MAP */}
            {activeTab === 'map' && (
              <div className="w-full space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      🗺️
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Full Tactical GIS Map & Asset Workspace
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Real-time spatial emergency telemetry, automated routing, and layer controls
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      + Report Incident
                    </button>
                    <button
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      ⌘K Quick Jump
                    </button>
                  </div>
                </div>

                <IncidentMap
                  incidents={incidents}
                  resources={resources}
                  hospitals={hospitals}
                  onSelectIncident={(inc) => setSelectedIncidentForModal(inc)}
                  onQuickDispatch={handleQuickDispatch}
                  variant="fullscreen"
                />
              </div>
            )}

            {/* VIEW 2: INCIDENTS GRID */}
            {activeTab === 'incidents' && (
              <div className="space-y-4">
                <IncidentFeed
                  incidents={incidents}
                  onSelectIncident={(inc) => setSelectedIncidentForModal(inc)}
                  onDispatch={handleQuickDispatch}
                  onAnalyze={handleAnalyzeIncident}
                  onResolve={handleResolveIncident}
                />
              </div>
            )}

            {/* VIEW 3: DISPATCH OPERATIONS */}
            {activeTab === 'dispatch' && (
              <DispatchCenter
                incidents={incidents}
                resources={resources}
                hospitals={hospitals}
                dispatches={dispatches}
                initialSelectedIncidentId={selectedIncidentForDispatch}
                onDispatchCreated={fetchAllData}
                onDispatchUpdated={fetchAllData}
              />
            )}

            {/* VIEW 4: FLEET & ASSETS */}
            {activeTab === 'resources' && (
              <ResourceManagement
                resources={resources}
                onStatusChanged={fetchAllData}
              />
            )}

            {/* VIEW 5: HOSPITALS & TRAUMA */}
            {activeTab === 'hospitals' && (
              <HospitalManagement
                hospitals={hospitals}
                onCapacityChanged={fetchAllData}
              />
            )}

            {/* VIEW 6: CRISIS SIMULATOR */}
            {activeTab === 'simulation' && (
              <DisasterSimulator />
            )}

            {/* VIEW 7: ANALYTICS & INTEL */}
            {activeTab === 'analytics' && (
              <AnalyticsView
                incidents={incidents}
                overview={overview}
              />
            )}

            {/* VIEW 8: FIELD RESPONDER HUD */}
            {activeTab === 'responder' && (
              <ResponderDashboard
                resources={resources}
                dispatches={dispatches}
                incidents={incidents}
                hospitals={hospitals}
                onMissionUpdated={fetchAllData}
              />
            )}

            {/* VIEW 9: CITIZEN PORTAL */}
            {activeTab === 'citizen' && (
              <CitizenPortal
                incidents={incidents}
                hospitals={hospitals}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            )}

            {/* VIEW 10: ABOUT & ARCHITECTURE */}
            {activeTab === 'about' && (
              <SystemArchitecture />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Modals */}
      {/* 1. Incident Deep Details Modal */}
      {selectedIncidentForModal && (
        <IncidentDetailsModal
          incident={selectedIncidentForModal}
          onClose={() => setSelectedIncidentForModal(null)}
          onDispatch={handleQuickDispatch}
          onAnalyze={handleAnalyzeIncident}
          onResolve={handleResolveIncident}
          isAnalyzing={isAnalyzingIncident}
          allIncidents={incidents}
        />
      )}

      {/* 2. Emergency Report Form Modal */}
      {isReportModalOpen && (
        <IncidentReportForm
          onClose={() => setIsReportModalOpen(false)}
          onCreated={(newInc) => {
            fetchAllData();
            fetchAISummary();
            setSelectedIncidentForModal(newInc);
          }}
        />
      )}

      {/* 3. Hackathon Judge Walkthrough Guide Modal */}
      {isDemoModalOpen && (
        <DemoWalkthroughModal
          onClose={() => setIsDemoModalOpen(false)}
          onSelectTab={(tab) => setActiveTab(tab)}
          onTriggerFloodScenario={handleTriggerFloodCrisis}
          onResetDemo={handleResetDemo}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      )}

      {/* 4. Global Command & Feature Hub Palette (Cmd+K) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        incidents={incidents}
        resources={resources}
        hospitals={hospitals}
        onSelectIncident={(inc) => setSelectedIncidentForModal(inc)}
        onQuickDispatch={handleQuickDispatch}
        onTriggerFloodScenario={handleTriggerFloodCrisis}
        onResetDemo={handleResetDemo}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        darkMode={darkMode}
      />

      {/* Bento Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>ResQra AI Emergency Intelligence & Response Platform — Lucknow EOC Grid</span>
          <span>Powered by Gemini 3.7 Flash & @google/genai</span>
        </div>
      </footer>
    </div>
  );
}
