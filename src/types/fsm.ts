export type UserRole = 'admin' | 'engineer';
export type UserStatus = 'online' | 'offline';
export type SiteCategory = 'today' | 'tomorrow' | 'upcoming';
export type SiteStatus = 'pending' | 'working' | 'completed';
export type ReportType = 'engineer' | 'site' | 'pending' | 'completed' | 'daily_summary';

export interface DeviceInfo {
  batteryLevel: number;
  isCharging: boolean;
  networkStatus: string;
  appVersion: string;
}

export interface User {
  uid: string;
  engineerId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  currentSiteId: string | null;
  deviceInfo: DeviceInfo;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

export interface SiteLocation {
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
}

export interface Site {
  siteId: string;
  clientName: string;
  clientPhone: string;
  assignedEngineerId: string;
  assignedEngineerName: string;
  scheduledDate: string; // YYYY-MM-DD
  category: SiteCategory;
  status: SiteStatus;
  location: SiteLocation;
  arrivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  notes?: string;
  workSummary?: string;
  customerSignature?: string;
}

export interface ArrivalAlert {
  alertId: string;
  engineerId: string;
  engineerName: string;
  siteId: string;
  siteName: string;
  arrivalTime: string;
  locationStatus: string;
  timestamp: string;
  isReadByAdmin: boolean;
}

export interface Report {
  reportId: string;
  generatedBy: string;
  type: ReportType;
  fileUrl: string;
  generatedAt: string;
  title: string;
  totalRecords: number;
}

export interface LiveTracking {
  engineerId: string;
  engineerName: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  batteryPercentage: number;
  isOnline: boolean;
  travelledDistanceKm: number;
  remainingDistanceKm: number;
  etaMinutes: number;
  lastUpdated: number;
  routePolyline?: [number, number][];
  currentWaypointIndex?: number;
}

export type ViewMode = 'admin' | 'engineer' | 'split';
