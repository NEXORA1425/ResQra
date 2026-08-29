import {
  Incident,
  Resource,
  Hospital,
  Dispatch,
  AICommanderSummary,
  SimulationParams,
  SimulationResult,
  SimulationOptimization,
  AnalyticsOverview,
  User,
  RealtimeEventPayload,
  DispatchStatus,
  ResourceStatus,
  LiveETAResult,
  LiveWeatherReport,
} from '../types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errObj;
    try {
      errObj = JSON.parse(errorText);
    } catch {
      errObj = { message: errorText || res.statusText };
    }
    throw new Error(errObj.error?.message || errObj.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password?: string, role?: string): Promise<{ success: boolean; token: string; user: User }> => {
      return fetchJSON(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
    },
    getMe: async (): Promise<{ success: boolean; user: User }> => {
      return fetchJSON(`${API_BASE}/auth/me`);
    },
    getUsers: async (): Promise<{ success: boolean; data: User[] }> => {
      return fetchJSON(`${API_BASE}/users`);
    },
  },

  // Incidents
  incidents: {
    list: async (filters?: { severity?: string; status?: string; type?: string; search?: string }): Promise<{ success: boolean; data: Incident[] }> => {
      const params = new URLSearchParams();
      if (filters?.severity) params.set('severity', filters.severity);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.search) params.set('search', filters.search);
      return fetchJSON(`${API_BASE}/incidents?${params.toString()}`);
    },
    get: async (id: string): Promise<{ success: boolean; data: Incident }> => {
      return fetchJSON(`${API_BASE}/incidents/${id}`);
    },
    create: async (data: Partial<Incident> & { source?: string }): Promise<{ success: boolean; data: Incident }> => {
      return fetchJSON(`${API_BASE}/incidents`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: Partial<Incident>): Promise<{ success: boolean; data: Incident }> => {
      return fetchJSON(`${API_BASE}/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      return fetchJSON(`${API_BASE}/incidents/${id}`, {
        method: 'DELETE',
      });
    },
    analyze: async (id: string): Promise<{ success: boolean; data: Incident }> => {
      return fetchJSON(`${API_BASE}/incidents/${id}/analyze`, {
        method: 'POST',
      });
    },
    fuse: async (data: { description: string; latitude: number; longitude: number; source?: string }) => {
      return fetchJSON<{ success: boolean; data: { match_found: boolean; matched_incident_id?: string; confidence: number; merged_summary?: string } }>(
        `${API_BASE}/incidents/fuse`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },
    getLiveETA: async (id: string): Promise<{ success: boolean; data: LiveETAResult }> => {
      return fetchJSON(`${API_BASE}/incidents/${id}/live-eta`);
    },
  },

  // Routing API
  routing: {
    getLiveETA: async (incidentId: string): Promise<{ success: boolean; data: LiveETAResult }> => {
      return fetchJSON(`${API_BASE}/incidents/${incidentId}/live-eta`);
    },
  },

  // Environmental & Weather API
  weather: {
    getLive: async (lat?: number, lng?: number): Promise<{ success: boolean; data: LiveWeatherReport }> => {
      const params = new URLSearchParams();
      if (lat !== undefined) params.set('lat', lat.toString());
      if (lng !== undefined) params.set('lng', lng.toString());
      return fetchJSON(`${API_BASE}/weather/live?${params.toString()}`);
    },
  },

  // Resources
  resources: {
    list: async (type?: string, status?: string): Promise<{ success: boolean; data: Resource[] }> => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      return fetchJSON(`${API_BASE}/resources?${params.toString()}`);
    },
    get: async (id: string): Promise<{ success: boolean; data: Resource }> => {
      return fetchJSON(`${API_BASE}/resources/${id}`);
    },
    updateStatus: async (id: string, status: ResourceStatus, incidentId?: string): Promise<{ success: boolean; data: Resource }> => {
      return fetchJSON(`${API_BASE}/resources/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, incident_id: incidentId }),
      });
    },
    updateLocation: async (
      id: string,
      locationData: {
        latitude: number;
        longitude: number;
        heading?: number;
        speed?: number;
        accuracy?: number;
        live_tracking?: boolean;
      }
    ): Promise<{ success: boolean; data: Resource }> => {
      return fetchJSON(`${API_BASE}/resources/${id}/location`, {
        method: 'PATCH',
        body: JSON.stringify(locationData),
      });
    },
    recommend: async (incidentId: string): Promise<{
      success: boolean;
      incident_id: string;
      recommendations: Array<{ resource: Resource; score: number; distance_km: number; eta_minutes: number; reason: string }>;
    }> => {
      return fetchJSON(`${API_BASE}/incidents/${incidentId}/recommend-resources`, {
        method: 'POST',
      });
    },
  },

  // Geolocation Service
  geolocation: {
    locate: async (): Promise<{
      success: boolean;
      location: { lat: number; lng: number };
      accuracy: number;
      source: string;
    }> => {
      return fetchJSON(`${API_BASE}/geolocation/locate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
  },

  // Hospitals
  hospitals: {
    list: async (): Promise<{ success: boolean; data: Hospital[] }> => {
      return fetchJSON(`${API_BASE}/hospitals`);
    },
    get: async (id: string): Promise<{ success: boolean; data: Hospital }> => {
      return fetchJSON(`${API_BASE}/hospitals/${id}`);
    },
    updateCapacity: async (
      id: string,
      updates: { occupied_emergency_beds?: number; occupied_icu_beds?: number; status?: string }
    ): Promise<{ success: boolean; data: Hospital }> => {
      return fetchJSON(`${API_BASE}/hospitals/${id}/capacity`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    recommend: async (incidentId: string): Promise<{
      success: boolean;
      incident_id: string;
      recommendations: Array<Hospital & { distance_km: number; score: number; reason: string }>;
    }> => {
      return fetchJSON(`${API_BASE}/incidents/${incidentId}/recommended-hospitals`);
    },
  },

  // Dispatch
  dispatch: {
    list: async (): Promise<{ success: boolean; data: Dispatch[] }> => {
      return fetchJSON(`${API_BASE}/dispatch`);
    },
    create: async (data: {
      incident_id: string;
      resource_id: string;
      hospital_id?: string;
      assigned_by?: string;
      notes?: string;
    }): Promise<{ success: boolean; data: Dispatch }> => {
      return fetchJSON(`${API_BASE}/dispatch`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStatus: async (id: string, status: DispatchStatus): Promise<{ success: boolean; data: Dispatch }> => {
      return fetchJSON(`${API_BASE}/dispatch/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  // AI Commander & Vision Intelligence
  commander: {
    getSummary: async (): Promise<{ success: boolean; data: AICommanderSummary }> => {
      return fetchJSON(`${API_BASE}/commander/summary`);
    },
  },
  ai: {
    analyzeVision: async (payload: { image?: string; imageUrl?: string }): Promise<{
      success: boolean;
      data: {
        labels: string[];
        objects: string[];
        extractedText: string;
        detectedHazards: string[];
        suggestedIncidentType: string;
        severityEstimate: string;
        estimatedVictimCount: number;
        confidenceScore: number;
        aiDamageAssessment: string;
      };
    }> => {
      return fetchJSON(`${API_BASE}/ai/vision-analyze`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Configuration
  config: {
    getMaps: async (): Promise<{ success: boolean; apiKey: string; mapId: string }> => {
      return fetchJSON(`${API_BASE}/config/maps`);
    },
  },

  // Disaster Simulation
  simulation: {
    run: async (params: SimulationParams): Promise<{ success: boolean; data: { simulation: SimulationResult; optimization: SimulationOptimization } }> => {
      return fetchJSON(`${API_BASE}/simulation/run`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    optimize: async (simulation_id: string): Promise<{ success: boolean; message: string }> => {
      return fetchJSON(`${API_BASE}/simulation/optimize`, {
        method: 'POST',
        body: JSON.stringify({ simulation_id }),
      });
    },
  },

  // Analytics
  analytics: {
    overview: async (): Promise<{ success: boolean; data: AnalyticsOverview & { total_resources: number; available_resources: number } }> => {
      return fetchJSON(`${API_BASE}/analytics/overview`);
    },
    incidentStats: async (): Promise<{
      success: boolean;
      data: { by_type: Array<{ type: string; count: number }>; by_severity: Array<{ severity: string; count: number }> };
    }> => {
      return fetchJSON(`${API_BASE}/analytics/incidents`);
    },
  },

  // Demo Controls
  demo: {
    reset: async (): Promise<{ success: boolean; message: string }> => {
      return fetchJSON(`${API_BASE}/demo/reset`, { method: 'POST' });
    },
    triggerFloodScenario: async (): Promise<{ success: boolean; message: string }> => {
      return fetchJSON(`${API_BASE}/demo/trigger-flood-scenario`, { method: 'POST' });
    },
  },

  // SSE Subscription
  subscribeToEvents: (onEvent: (event: RealtimeEventPayload) => void): (() => void) => {
    try {
      const eventSource = new EventSource(`${API_BASE}/realtime/events`);
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          onEvent(payload);
        } catch (err) {
          console.warn('Failed to parse SSE event data', err);
        }
      };
      eventSource.onerror = () => {
        // SSE auto-reconnects
      };
      return () => {
        eventSource.close();
      };
    } catch {
      return () => {};
    }
  },
};
