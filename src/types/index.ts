export type UserRole = 'ADMIN' | 'OPERATOR' | 'RESPONDER' | 'CITIZEN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  agency?: string;
  avatarUrl?: string;
}

export type IncidentType =
  | 'FIRE'
  | 'FLOOD'
  | 'ROAD_ACCIDENT'
  | 'MEDICAL'
  | 'EARTHQUAKE'
  | 'BUILDING_COLLAPSE'
  | 'RAILWAY'
  | 'HAZMAT'
  | 'OTHER';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'ANALYZING'
  | 'VERIFIED'
  | 'AWAITING_DISPATCH'
  | 'DISPATCHED'
  | 'RESPONDING'
  | 'ON_SCENE'
  | 'RESOLVED'
  | 'CANCELLED';

export interface RequiredResource {
  type: ResourceType;
  quantity: number;
  reason?: string;
}

export interface AIAnalysis {
  incident_type: IncidentType;
  severity: Severity;
  severity_score: number; // 0 - 100
  confidence: number; // 0 - 1
  people_affected: number;
  people_injured: number;
  people_trapped: number;
  resources_required: RequiredResource[];
  reasoning: string[];
  immediate_hazards?: string[];
  secondary_risks?: string[];
  recommended_hospital_specialty?: string;
  generated_at: string;
}

export type ReportSource =
  | 'CITIZEN'
  | 'POLICE'
  | 'AMBULANCE'
  | 'HOSPITAL'
  | 'RESPONDER'
  | 'SENSOR'
  | 'ADMIN';

export interface IncidentReport {
  id: string;
  incident_id?: string;
  source: ReportSource;
  reporter_name?: string;
  reporter_phone?: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  reporter_id?: string;
  image_url?: string;
  raw_data?: Record<string, unknown>;
}

export interface Incident {
  id: string;
  incident_code: string; // e.g. "INC-1042"
  title: string;
  description: string;
  type: IncidentType;
  severity: Severity;
  severity_score: number;
  ai_confidence: number;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  location_name: string;
  people_affected: number;
  people_injured: number;
  people_trapped: number;
  reported_by: string;
  reports_count: number;
  reports?: IncidentReport[];
  ai_analysis?: AIAnalysis;
  dispatches?: Dispatch[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export type ResourceType =
  | 'AMBULANCE'
  | 'FIRE_TRUCK'
  | 'RESCUE_BOAT'
  | 'POLICE_UNIT'
  | 'MEDICAL_TEAM';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DISPATCHED'
  | 'BUSY'
  | 'OFFLINE'
  | 'MAINTENANCE';

export interface Resource {
  id: string;
  callsign: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  latitude: number;
  longitude: number;
  location_name: string;
  capability: string;
  crew_size: number;
  fuel_percent: number;
  battery_percent?: number;
  current_incident_id?: string;
  assigned_hospital_id?: string;
  eta_minutes?: number;
  is_live_tracking?: boolean;
  last_telemetry?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    timestamp: string;
  };
  updated_at: string;
}

export type HospitalStatus = 'OPEN' | 'BUSY' | 'FULL' | 'CLOSED';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  emergency_beds: number;
  icu_beds: number;
  occupied_emergency_beds: number;
  occupied_icu_beds: number;
  trauma_level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'COMMUNITY';
  status: HospitalStatus;
  specialties: string[];
  has_helipad: boolean;
  has_blood_bank: boolean;
  contact_number: string;
  distance_km?: number;
  score?: number;
  updated_at: string;
}

export type DispatchStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISPATCHED'
  | 'ACCEPTED'
  | 'RESPONDING'
  | 'ON_SCENE'
  | 'TRANSPORTING'
  | 'COMPLETED';

export interface Dispatch {
  id: string;
  incident_id: string;
  incident?: Incident;
  resource_id: string;
  resource?: Resource;
  hospital_id?: string;
  hospital?: Hospital;
  assigned_by: string;
  ai_recommended: boolean;
  eta_minutes: number;
  status: DispatchStatus;
  notes?: string;
  assigned_at: string;
  accepted_at?: string;
  on_scene_at?: string;
  completed_at?: string;
}

export interface AICommanderSummary {
  active_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  people_affected: number;
  people_injured: number;
  people_trapped: number;
  highest_priority_incident?: Incident;
  situation_summary: string;
  critical_bottlenecks: string[];
  recommendations: Array<{
    title: string;
    incident_id: string;
    incident_code: string;
    action: string;
    suggested_resources: string[];
    suggested_hospital?: string;
    priority: 'IMMEDIATE' | 'HIGH' | 'MODERATE';
    rationale: string;
  }>;
  tactical_readiness_score: number; // 0 - 100
  generated_at: string;
}

export interface SimulationParams {
  disaster_type: IncidentType;
  location: string;
  latitude: number;
  longitude: number;
  population: number;
  severity: Severity;
  duration_hours: number;
  infrastructure_damage_level: 'LOW' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC';
}

export interface SimulationResult {
  id: string;
  params: SimulationParams;
  estimated_affected: number;
  estimated_injured: number;
  estimated_critical: number;
  estimated_trapped: number;
  resources_demanded: {
    ambulances: number;
    fire_trucks: number;
    rescue_boats: number;
    medical_teams: number;
    police_units: number;
    shelters: number;
  };
  resources_available: {
    ambulances: number;
    fire_trucks: number;
    rescue_boats: number;
    medical_teams: number;
    police_units: number;
    shelters: number;
  };
  shortages: {
    ambulances: number;
    fire_trucks: number;
    rescue_boats: number;
    medical_teams: number;
    police_units: number;
    shelters: number;
  };
  hospital_surge_hours_until_capacity: number;
  ai_analysis_text: string;
  recommended_actions: string[];
  timeline_projections: Array<{
    hour: number;
    casualties: number;
    triaged: number;
    transported: number;
    hospital_bed_utilization: number;
  }>;
  created_at: string;
}

export interface ReallocationItem {
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType;
  current_location: string;
  current_status: string;
  recommended_assignment: string;
  eta_minutes: number;
  reason: string;
}

export interface SimulationOptimization {
  simulation_id: string;
  reallocations: ReallocationItem[];
  projected_casualty_reduction_percent: number;
  projected_response_time_improvement_minutes: number;
  ai_summary: string;
}

export interface AnalyticsOverview {
  total_incidents: number;
  active_incidents: number;
  resolved_today: number;
  critical_incidents: number;
  people_assisted: number;
  average_response_time_minutes: number;
  average_triage_time_seconds: number;
  resource_utilization_percent: number;
  hospital_bed_occupancy_percent: number;
  icu_occupancy_percent: number;
}

export interface LiveETAResult {
  incident_id: string;
  responder: {
    id: string;
    callsign: string;
    name: string;
    type: ResourceType;
    status: ResourceStatus;
    crew_size: number;
    speed_kmh: number;
    is_dispatched: boolean;
  };
  distance_km: number;
  eta_minutes: number;
  eta_seconds: number;
  estimated_arrival_time: string;
  traffic_status: string;
  route_progress_pct: number;
  next_waypoint: string;
  siren_active: boolean;
  calculated_at: string;
}

export interface LiveWeatherReport {
  latitude: number;
  longitude: number;
  location_name: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  precipitation_mm: number;
  rain_probability_percent: number;
  precipitation_intensity: 'NONE' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'TORRENTIAL';
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  wind_gusts_kmh: number;
  cloud_cover_percent: number;
  visibility_km: number;
  uv_index: number;
  pressure_hpa: number;
  weather_condition: string;
  weather_code: number;
  drone_flight_status: 'SAFE' | 'CAUTION' | 'GROUNDED';
  drone_flight_reason: string;
  fire_spread_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  flood_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  commander_advisory: string;
  hourly_forecast: Array<{
    time: string;
    precipitation_mm: number;
    wind_speed_kmh: number;
    temp_c: number;
  }>;
  fetched_at: string;
}

export interface SiteEnvironmentalThreat {
  incident_id: string;
  incident_title: string;
  severity: Severity;
  threat_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  primary_threat: string;
  wind_vector_bearing: number;
  plume_spread_direction: string;
  water_rescue_impact: string;
  aerial_ops_feasible: boolean;
  evacuation_safe_zone: string;
}

export interface DeploymentRouteSuggestion {
  resource: Resource;
  incident: Incident;
  distance_km: number;
  eta_minutes: number;
  speed_kmh: number;
  priority_rank: number; // 1, 2, 3
  suitability_score: number; // 0 - 100
  suitability_reason: string;
  route_color: string;
  waypoints: Array<{ lat: number; lng: number }>;
}

export interface RealtimeEventPayload {
  event_type:
    | 'INCIDENT_CREATED'
    | 'INCIDENT_UPDATED'
    | 'SEVERITY_CHANGED'
    | 'RESOURCE_DISPATCHED'
    | 'RESOURCE_STATUS_CHANGED'
    | 'RESOURCE_LOCATION_UPDATED'
    | 'HOSPITAL_CAPACITY_CHANGED'
    | 'INCIDENT_RESOLVED'
    | 'AI_COMMANDER_UPDATED'
    | 'SIMULATION_TRIGGERED';
  timestamp: string;
  data: unknown;
}
