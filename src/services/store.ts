import { User, Site, ArrivalAlert, LiveTracking, Report, ViewMode, SiteStatus } from '../types/fsm';
import { INITIAL_USERS, INITIAL_SITES, INITIAL_LIVE_TRACKING, INITIAL_ARRIVAL_ALERTS, INITIAL_REPORTS } from './mockData';
import { calculateHaversineDistanceKm, calculateETA, calculateBearing, isWithinGeofence, interpolatePosition } from '../utils/geoUtils';
import { firebaseService } from './firebaseService';

type Listener = () => void;

class FSMStore {
  // Always seeded with the 7 demo engineers across India + merged with live Firestore
  private users: User[] = [...INITIAL_USERS];
  private sites: Site[] = [...INITIAL_SITES];
  private liveTracking: Record<string, LiveTracking> = { ...INITIAL_LIVE_TRACKING };
  private arrivalAlerts: ArrivalAlert[] = [...INITIAL_ARRIVAL_ALERTS];
  private reports: Report[] = [...INITIAL_REPORTS];
  
  private viewMode: ViewMode = 'admin';
  private selectedEngineerId: string | null = 'ENG_178';
  private selectedSiteId: string | null = 'SITE_1001';
  private filterStatus: 'all' | 'online' | 'working' | 'offline' = 'all';
  private searchQuery: string = '';

  // Simulator controls
  private isSimulatingMotion: boolean = false;
  private simulationInterval: number | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Connect Live Firestore & RTDB Sync
    this.initFirebaseSync();
  }

  private initFirebaseSync() {
    if (firebaseService.isEnabled()) {
      firebaseService.subscribeToLiveUpdates({
        onUsersUpdate: (liveUsers) => {
          this.users = liveUsers;
          if (!this.selectedEngineerId && this.users.length > 0) {
            const firstEng = this.users.find((u) => u.role === 'engineer' || !u.role);
            if (firstEng) {
              this.selectedEngineerId = firstEng.uid;
            }
          }
          this.notify();
        },
        onSitesUpdate: (liveSites) => {
          this.sites = liveSites;
          this.notify();
        },
        onAlertsUpdate: (liveAlerts) => {
          this.arrivalAlerts = liveAlerts;
          this.notify();
        },
        onReportsUpdate: (liveReports) => {
          this.reports = liveReports;
          this.notify();
        },
        onLiveTrackingUpdate: (liveTrackingData) => {
          this.liveTracking = liveTrackingData;
          this.notify();
        },
      });
    }
  }

  // Subscribe to state changes
  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Getters
  public getUsers() { return this.users; }
  public getSites() { return this.sites; }
  public getLiveTracking() { return this.liveTracking; }
  public getArrivalAlerts() { return this.arrivalAlerts; }
  public getReports() { return this.reports; }
  public getViewMode() { return this.viewMode; }
  public getSelectedEngineerId() { return this.selectedEngineerId; }
  public getSelectedSiteId() { return this.selectedSiteId; }
  public getFilterStatus() { return this.filterStatus; }
  public getSearchQuery() { return this.searchQuery; }
  public getIsSimulatingMotion() { return this.isSimulatingMotion; }

  // Setters
  public setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.notify();
  }

  public setSelectedEngineerId(id: string | null) {
    this.selectedEngineerId = id;
    this.notify();
  }

  public setSelectedSiteId(id: string | null) {
    this.selectedSiteId = id;
    this.notify();
  }

  public setFilterStatus(status: 'all' | 'online' | 'working' | 'offline') {
    this.filterStatus = status;
    this.notify();
  }

  public setSearchQuery(query: string) {
    this.searchQuery = query;
    this.notify();
  }

  // Simulation Controls
  public toggleMotionSimulation() {
    this.isSimulatingMotion = !this.isSimulatingMotion;
    this.notify();
  }

  public resetSimulation() {
    if (this.users.length === 0) return;
    const firstEngineer = this.users[0];
    const track = this.liveTracking[firstEngineer.uid];
    if (!track) return;

    const updatedTrack: LiveTracking = {
      ...track,
      speedKmh: 42,
      batteryPercentage: 92,
      lastUpdated: Date.now(),
    };

    this.liveTracking[firstEngineer.uid] = updatedTrack;
    this.notify();
  }

  // Actions
  public createSite(newSite: Omit<Site, 'siteId' | 'createdAt'>) {
    const siteId = `SITE_${1000 + this.sites.length + 1}`;
    const created: Site = {
      ...newSite,
      siteId,
      createdAt: new Date().toISOString(),
    };
    this.sites = [created, ...this.sites];
    
    // Sync to Live Firestore
    firebaseService.pushSite(created);

    this.notify();
    return created;
  }

  public updateSiteStatus(siteId: string, status: SiteStatus, notes?: string, signature?: string) {
    const idx = this.sites.findIndex((s) => s.siteId === siteId);
    if (idx !== -1) {
      const now = new Date().toISOString();
      const updates: Partial<Site> = {
        status,
        ...(status === 'working' ? { arrivedAt: this.sites[idx].arrivedAt || now } : {}),
        ...(status === 'completed' ? { completedAt: now, workSummary: notes || 'Job verified & completed by engineer.', customerSignature: signature } : {}),
      };

      const updatedSite = {
        ...this.sites[idx],
        ...updates,
      };

      this.sites[idx] = updatedSite;

      // Sync to Live Firestore
      firebaseService.pushSiteStatus(siteId, updates);

      // Trigger completion notification alert for Admin Dashboard
      if (status === 'completed') {
        const completionAlert: ArrivalAlert = {
          alertId: `ALERT_COMP_${Date.now()}`,
          engineerId: updatedSite.assignedEngineerId,
          engineerName: updatedSite.assignedEngineerName,
          siteId: updatedSite.siteId,
          siteName: updatedSite.clientName,
          arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          locationStatus: 'Site Completed',
          timestamp: now,
          isReadByAdmin: false,
        };
        this.arrivalAlerts = [completionAlert, ...this.arrivalAlerts];
        firebaseService.pushArrivalAlert(completionAlert);
      }

      this.notify();
    }
  }

  public updateSiteDetails(siteId: string, updates: Partial<Site>) {
    const idx = this.sites.findIndex((s) => s.siteId === siteId);
    if (idx !== -1) {
      this.sites[idx] = {
        ...this.sites[idx],
        ...updates,
      };
      firebaseService.pushSiteStatus(siteId, updates);
      this.notify();
    }
  }

  public deleteSite(siteId: string) {
    this.sites = this.sites.filter((s) => s.siteId !== siteId);
    firebaseService.deleteSite(siteId);
    this.notify();
  }

  public markAlertAsRead(alertId: string) {
    this.arrivalAlerts = this.arrivalAlerts.map((alert) =>
      alert.alertId === alertId ? { ...alert, isReadByAdmin: true } : alert
    );

    const alert = this.arrivalAlerts.find(a => a.alertId === alertId);
    if (alert) {
      firebaseService.pushArrivalAlert({ ...alert, isReadByAdmin: true });
    }

    this.notify();
  }

  public addReport(report: Omit<Report, 'reportId' | 'generatedAt'>) {
    const newReport: Report = {
      ...report,
      reportId: `REP_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 10)}_${Math.floor(Math.random() * 90 + 10)}`,
      generatedAt: new Date().toISOString(),
    };
    this.reports = [newReport, ...this.reports];
    
    // Sync to Live Firestore
    firebaseService.pushReport(newReport);

    this.notify();
    return newReport;
  }
}

export const fsmStore = new FSMStore();
