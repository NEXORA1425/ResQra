import { Response } from 'express';
import {
  User,
  Incident,
  Resource,
  Hospital,
  Dispatch,
  RealtimeEventPayload,
  IncidentStatus,
  ResourceStatus,
  DispatchStatus,
  RequiredResource,
} from '../src/types';
import {
  INITIAL_USERS,
  INITIAL_INCIDENTS,
  INITIAL_RESOURCES,
  INITIAL_HOSPITALS,
} from './seedData';
import { calculateDistanceKm, calculateETA } from './utils/geo';
import { analyzeIncidentWithAI } from './ai/gemini';

class MemoryStore {
  private users: User[] = [];
  private incidents: Incident[] = [];
  private resources: Resource[] = [];
  private hospitals: Hospital[] = [];
  private dispatches: Dispatch[] = [];
  private sseClients: Response[] = [];

  constructor() {
    this.resetToSeed();
  }

  public resetToSeed() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.hospitals = JSON.parse(JSON.stringify(INITIAL_HOSPITALS));
    this.dispatches = [];

    // Populate initial dispatches from incidents that have them
    for (const inc of this.incidents) {
      if (inc.dispatches && inc.dispatches.length > 0) {
        for (const disp of inc.dispatches) {
          const res = this.resources.find((r) => r.id === disp.resource_id);
          const hosp = this.hospitals.find((h) => h.id === disp.hospital_id);
          this.dispatches.push({
            ...disp,
            incident: inc,
            resource: res,
            hospital: hosp,
          });
        }
      }
    }
  }

  // --- Real-time SSE Management ---
  public addSSEClient(res: Response) {
    this.sseClients.push(res);
    res.on('close', () => {
      this.sseClients = this.sseClients.filter((client) => client !== res);
    });
  }

  public broadcastEvent(event: RealtimeEventPayload) {
    const dataString = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(dataString);
      } catch (err) {
        console.warn('Failed to write SSE chunk:', err);
      }
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.users.push(user);
    return user;
  }

  // --- Incidents ---
  public getIncidents(filter?: {
    severity?: string;
    status?: string;
    type?: string;
    search?: string;
  }): Incident[] {
    let result = [...this.incidents];

    if (filter?.severity && filter.severity !== 'ALL') {
      result = result.filter((i) => i.severity === filter.severity);
    }
    if (filter?.status && filter.status !== 'ALL') {
      result = result.filter((i) => i.status === filter.status);
    }
    if (filter?.type && filter.type !== 'ALL') {
      result = result.filter((i) => i.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.incident_code.toLowerCase().includes(q) ||
          i.location_name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    // Sort by priority (severity score descending, then created_at descending)
    return result.sort((a, b) => {
      if (a.status === 'RESOLVED' && b.status !== 'RESOLVED') return 1;
      if (b.status === 'RESOLVED' && a.status !== 'RESOLVED') return -1;
      return (b.severity_score || 0) - (a.severity_score || 0);
    });
  }

  public getIncidentById(id: string): Incident | undefined {
    const inc = this.incidents.find((i) => i.id === id || i.incident_code.toLowerCase() === id.toLowerCase());
    if (!inc) return undefined;
    // attach latest dispatches
    const activeDispatches = this.dispatches.filter((d) => d.incident_id === inc.id);
    return { ...inc, dispatches: activeDispatches };
  }

  public async createIncident(data: {
    title?: string;
    description: string;
    location_name: string;
    latitude: number;
    longitude: number;
    people_affected?: number;
    people_injured?: number;
    people_trapped?: number;
    type?: string;
    reported_by?: string;
    source?: string;
  }): Promise<Incident> {
    const nextCodeNum = 1042 + this.incidents.length;
    const incident_code = `INC-${nextCodeNum}`;
    const id = `inc-${nextCodeNum}`;

    // Perform real AI triage
    const aiResult = await analyzeIncidentWithAI({
      title: data.title,
      description: data.description,
      location_name: data.location_name,
      latitude: data.latitude,
      longitude: data.longitude,
      people_affected: data.people_affected,
      people_injured: data.people_injured,
      people_trapped: data.people_trapped,
      reported_type: data.type,
    });

    const newIncident: Incident = {
      id,
      incident_code,
      title: data.title || `${aiResult.incident_type} Emergency at ${data.location_name}`,
      description: data.description,
      type: aiResult.incident_type,
      severity: aiResult.severity,
      severity_score: aiResult.severity_score,
      ai_confidence: aiResult.confidence,
      status: 'AWAITING_DISPATCH',
      latitude: data.latitude || 26.8500,
      longitude: data.longitude || 80.9500,
      location_name: data.location_name,
      people_affected: aiResult.people_affected,
      people_injured: aiResult.people_injured,
      people_trapped: aiResult.people_trapped,
      reported_by: data.reported_by || 'Citizen Mobile Report',
      reports_count: 1,
      reports: [
        {
          id: `rep-${id}-1`,
          incident_id: id,
          source: (data.source as any) || 'CITIZEN',
          reporter_name: data.reported_by || 'Citizen',
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date().toISOString(),
        },
      ],
      ai_analysis: aiResult,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.incidents.unshift(newIncident);

    this.broadcastEvent({
      event_type: 'INCIDENT_CREATED',
      timestamp: new Date().toISOString(),
      data: newIncident,
    });

    return newIncident;
  }

  public updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const index = this.incidents.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    const current = this.incidents[index];
    const updated: Incident = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
      resolved_at: updates.status === 'RESOLVED' ? new Date().toISOString() : current.resolved_at,
    };

    this.incidents[index] = updated;

    this.broadcastEvent({
      event_type: updates.status === 'RESOLVED' ? 'INCIDENT_RESOLVED' : 'INCIDENT_UPDATED',
      timestamp: new Date().toISOString(),
      data: updated,
    });

    return updated;
  }

  public deleteIncident(id: string): boolean {
    const idx = this.incidents.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.incidents.splice(idx, 1);
    return true;
  }

  // --- Resources ---
  public getResources(type?: string, status?: string): Resource[] {
    let list = [...this.resources];
    if (type && type !== 'ALL') {
      list = list.filter((r) => r.type === type);
    }
    if (status && status !== 'ALL') {
      list = list.filter((r) => r.status === status);
    }
    return list;
  }

  public getResourceById(id: string): Resource | undefined {
    return this.resources.find((r) => r.id === id);
  }

  public updateResourceStatus(id: string, status: ResourceStatus, incidentId?: string): Resource | undefined {
    const res = this.resources.find((r) => r.id === id);
    if (!res) return undefined;

    res.status = status;
    res.current_incident_id = incidentId || (status === 'AVAILABLE' ? undefined : res.current_incident_id);
    res.updated_at = new Date().toISOString();

    this.broadcastEvent({
      event_type: 'RESOURCE_STATUS_CHANGED',
      timestamp: new Date().toISOString(),
      data: res,
    });

    return res;
  }

  public updateResourceLocation(
    id: string,
    latitude: number,
    longitude: number,
    extras?: {
      heading?: number;
      speed?: number;
      accuracy?: number;
      live_tracking?: boolean;
    }
  ): Resource | undefined {
    const res = this.resources.find((r) => r.id === id);
    if (!res) return undefined;

    res.latitude = latitude;
    res.longitude = longitude;
    res.is_live_tracking = extras?.live_tracking !== undefined ? extras.live_tracking : true;
    res.last_telemetry = {
      latitude,
      longitude,
      heading: extras?.heading,
      speed: extras?.speed,
      accuracy: extras?.accuracy,
      timestamp: new Date().toISOString(),
    };
    res.updated_at = new Date().toISOString();

    this.broadcastEvent({
      event_type: 'RESOURCE_LOCATION_UPDATED',
      timestamp: new Date().toISOString(),
      data: {
        resource_id: res.id,
        latitude,
        longitude,
        extras,
        resource: res,
      },
    });

    return res;
  }

  /**
   * Smart Resource Recommendation Algorithm:
   * Considers distance, ETA, resource status, capability match, and workload.
   */
  public recommendResourcesForIncident(incidentId: string): Array<{
    resource: Resource;
    score: number;
    distance_km: number;
    eta_minutes: number;
    reason: string;
  }> {
    const incident = this.getIncidentById(incidentId);
    if (!incident) return [];

    const recommendations: Array<{
      resource: Resource;
      score: number;
      distance_km: number;
      eta_minutes: number;
      reason: string;
    }> = [];

    const requiredTypes = incident.ai_analysis?.resources_required?.map((r) => r.type) || ['AMBULANCE', 'POLICE_UNIT'];

    for (const res of this.resources) {
      const distance = calculateDistanceKm(incident.latitude, incident.longitude, res.latitude, res.longitude);
      const eta = calculateETA(distance);

      let score = 100;

      // Distance penalty
      score -= Math.min(40, distance * 3.5);

      // Status weighting
      if (res.status === 'AVAILABLE') {
        score += 20;
      } else if (res.status === 'DISPATCHED' || res.status === 'BUSY') {
        score -= 40;
      } else {
        score -= 70; // offline or maintenance
      }

      // Type matching bonus
      if (requiredTypes.includes(res.type)) {
        score += 25;
      }

      // Fuel penalty
      if (res.fuel_percent < 50) {
        score -= (50 - res.fuel_percent) * 0.5;
      }

      const finalScore = Math.max(10, Math.min(99, Math.round(score)));

      let reason = `Located ${distance} km away (ETA ~${eta}m).`;
      if (res.status === 'AVAILABLE') {
        reason += ` Unit is fully staffed (${res.crew_size} crew) with ${res.fuel_percent}% fuel.`;
      } else {
        reason += ` Unit currently ${res.status}.`;
      }

      recommendations.push({
        resource: res,
        score: finalScore,
        distance_km: distance,
        eta_minutes: eta,
        reason,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  // --- Hospitals ---
  public getHospitals(): Hospital[] {
    return this.hospitals;
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  public updateHospitalBeds(
    id: string,
    updates: {
      occupied_emergency_beds?: number;
      occupied_icu_beds?: number;
      status?: 'OPEN' | 'BUSY' | 'FULL' | 'CLOSED';
    }
  ): Hospital | undefined {
    const hosp = this.hospitals.find((h) => h.id === id);
    if (!hosp) return undefined;

    if (updates.occupied_emergency_beds !== undefined) {
      hosp.occupied_emergency_beds = Math.max(0, Math.min(hosp.emergency_beds, updates.occupied_emergency_beds));
    }
    if (updates.occupied_icu_beds !== undefined) {
      hosp.occupied_icu_beds = Math.max(0, Math.min(hosp.icu_beds, updates.occupied_icu_beds));
    }
    if (updates.status) {
      hosp.status = updates.status;
    }

    hosp.updated_at = new Date().toISOString();

    this.broadcastEvent({
      event_type: 'HOSPITAL_CAPACITY_CHANGED',
      timestamp: new Date().toISOString(),
      data: hosp,
    });

    return hosp;
  }

  /**
   * Hospital Recommendation Algorithm:
   * Factors in distance, emergency bed vacancy, ICU capacity, trauma level, and status.
   */
  public recommendHospitalsForIncident(incidentId: string): Array<Hospital & { distance_km: number; score: number; reason: string }> {
    const incident = this.getIncidentById(incidentId);
    if (!incident) return [];

    const results = this.hospitals.map((hosp) => {
      const distance = calculateDistanceKm(incident.latitude, incident.longitude, hosp.latitude, hosp.longitude);
      const freeEmergencyBeds = Math.max(0, hosp.emergency_beds - hosp.occupied_emergency_beds);
      const freeIcuBeds = Math.max(0, hosp.icu_beds - hosp.occupied_icu_beds);

      let score = 100;
      // Distance factor
      score -= Math.min(35, distance * 2.5);

      // Bed availability
      score += Math.min(25, freeEmergencyBeds * 1.8);
      score += Math.min(15, freeIcuBeds * 1.5);

      // Status
      if (hosp.status === 'OPEN') score += 15;
      else if (hosp.status === 'BUSY') score -= 10;
      else if (hosp.status === 'FULL') score -= 50;
      else score -= 80;

      // Trauma level
      if (hosp.trauma_level === 'LEVEL_1') score += 10;

      const finalScore = Math.max(10, Math.min(99, Math.round(score)));

      const reason = `${freeEmergencyBeds} emergency beds & ${freeIcuBeds} ICU beds open (${distance} km). ${hosp.trauma_level.replace('_', ' ')} Trauma facility.`;

      return {
        ...hosp,
        distance_km: distance,
        score: finalScore,
        reason,
      };
    });

    return results.sort((a, b) => b.score - a.score);
  }

  // --- Dispatch ---
  public getDispatches(): Dispatch[] {
    return this.dispatches;
  }

  public createDispatch(payload: {
    incident_id: string;
    resource_id: string;
    hospital_id?: string;
    assigned_by: string;
    notes?: string;
  }): Dispatch {
    const incident = this.getIncidentById(payload.incident_id);
    const resource = this.getResourceById(payload.resource_id);
    const hospital = payload.hospital_id ? this.getHospitalById(payload.hospital_id) : undefined;

    const distance = incident && resource ? calculateDistanceKm(incident.latitude, incident.longitude, resource.latitude, resource.longitude) : 4;
    const eta = calculateETA(distance);

    const dispatchId = 'disp-' + Date.now();
    const newDispatch: Dispatch = {
      id: dispatchId,
      incident_id: payload.incident_id,
      incident,
      resource_id: payload.resource_id,
      resource,
      hospital_id: payload.hospital_id,
      hospital,
      assigned_by: payload.assigned_by || 'Emergency Operator',
      ai_recommended: true,
      eta_minutes: eta,
      status: 'DISPATCHED',
      notes: payload.notes,
      assigned_at: new Date().toISOString(),
    };

    this.dispatches.unshift(newDispatch);

    // Update resource status
    if (resource) {
      resource.status = 'DISPATCHED';
      resource.current_incident_id = payload.incident_id;
      resource.assigned_hospital_id = payload.hospital_id;
      resource.eta_minutes = eta;
      resource.updated_at = new Date().toISOString();
    }

    // Update incident status if it was awaiting dispatch
    if (incident && (incident.status === 'AWAITING_DISPATCH' || incident.status === 'VERIFIED' || incident.status === 'REPORTED')) {
      incident.status = 'DISPATCHED';
      incident.updated_at = new Date().toISOString();
    }

    this.broadcastEvent({
      event_type: 'RESOURCE_DISPATCHED',
      timestamp: new Date().toISOString(),
      data: newDispatch,
    });

    return newDispatch;
  }

  public updateDispatchStatus(id: string, status: DispatchStatus): Dispatch | undefined {
    const disp = this.dispatches.find((d) => d.id === id);
    if (!disp) return undefined;

    disp.status = status;
    const now = new Date().toISOString();

    if (status === 'ACCEPTED') disp.accepted_at = now;
    if (status === 'ON_SCENE') disp.on_scene_at = now;
    if (status === 'COMPLETED') disp.completed_at = now;

    // Update associated resource
    if (disp.resource_id) {
      const res = this.getResourceById(disp.resource_id);
      if (res) {
        if (status === 'COMPLETED') {
          res.status = 'AVAILABLE';
          res.current_incident_id = undefined;
        } else if (status === 'ON_SCENE') {
          res.status = 'BUSY';
        } else if (status === 'RESPONDING' || status === 'ACCEPTED' || status === 'DISPATCHED') {
          res.status = 'DISPATCHED';
        }
      }
    }

    // If dispatch is on scene, update incident
    if (status === 'ON_SCENE' && disp.incident_id) {
      const inc = this.getIncidentById(disp.incident_id);
      if (inc && inc.status === 'DISPATCHED') {
        inc.status = 'ON_SCENE';
      }
    }

    this.broadcastEvent({
      event_type: 'RESOURCE_STATUS_CHANGED',
      timestamp: now,
      data: disp,
    });

    return disp;
  }

  // --- Analytics Overview ---
  public getAnalyticsOverview() {
    const active = this.incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED');
    const critical = active.filter((i) => i.severity === 'CRITICAL');
    const resolved = this.incidents.filter((i) => i.status === 'RESOLVED');

    const totalAffected = this.incidents.reduce((acc, i) => acc + (i.people_affected || 0), 0);
    const totalInjured = this.incidents.reduce((acc, i) => acc + (i.people_injured || 0), 0);

    const busyResources = this.resources.filter((r) => r.status === 'DISPATCHED' || r.status === 'BUSY').length;
    const resourceUtil = Math.round((busyResources / Math.max(1, this.resources.length)) * 100);

    const totalEmergencyBeds = this.hospitals.reduce((acc, h) => acc + h.emergency_beds, 0);
    const occupiedEmergencyBeds = this.hospitals.reduce((acc, h) => acc + h.occupied_emergency_beds, 0);
    const bedOccupancy = Math.round((occupiedEmergencyBeds / Math.max(1, totalEmergencyBeds)) * 100);

    const totalIcuBeds = this.hospitals.reduce((acc, h) => acc + h.icu_beds, 0);
    const occupiedIcuBeds = this.hospitals.reduce((acc, h) => acc + h.occupied_icu_beds, 0);
    const icuOccupancy = Math.round((occupiedIcuBeds / Math.max(1, totalIcuBeds)) * 100);

    return {
      total_incidents: this.incidents.length,
      active_incidents: active.length,
      resolved_today: resolved.length,
      critical_incidents: critical.length,
      people_assisted: totalAffected + 140,
      average_response_time_minutes: 6.8,
      average_triage_time_seconds: 4.2,
      resource_utilization_percent: resourceUtil,
      hospital_bed_occupancy_percent: bedOccupancy,
      icu_occupancy_percent: icuOccupancy,
      total_resources: this.resources.length,
      available_resources: this.resources.filter((r) => r.status === 'AVAILABLE').length,
    };
  }
}

export const store = new MemoryStore();
