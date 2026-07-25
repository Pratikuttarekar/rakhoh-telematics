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
    this.startAutoTelematics();
  }

  private initFirebaseSync() {
    if (firebaseService.isEnabled()) {
      firebaseService.subscribeToLiveUpdates({
        onUsersUpdate: (liveUsers) => {
          // Merge live Firestore engineers with INITIAL_USERS (7 demo engineers)
          const mergedMap = new Map<string, User>();
          INITIAL_USERS.forEach((u) => mergedMap.set(u.uid, u));
          liveUsers.forEach((u) => {
            if (u.role === 'engineer' || !u.role) {
              mergedMap.set(u.uid, u);
            }
          });
          this.users = Array.from(mergedMap.values());
          
          if (!this.selectedEngineerId && this.users.length > 0) {
            this.selectedEngineerId = this.users[0].uid;
          }
          this.notify();
        },
        onSitesUpdate: (liveSites) => {
          const mergedSites = new Map<string, Site>();
          INITIAL_SITES.forEach((s) => mergedSites.set(s.siteId, s));
          liveSites.forEach((s) => mergedSites.set(s.siteId, s));
          this.sites = Array.from(mergedSites.values());
          this.notify();
        },
        onAlertsUpdate: (liveAlerts) => {
          const mergedAlerts = new Map<string, ArrivalAlert>();
          INITIAL_ARRIVAL_ALERTS.forEach((a) => mergedAlerts.set(a.alertId, a));
          liveAlerts.forEach((a) => mergedAlerts.set(a.alertId, a));
          this.arrivalAlerts = Array.from(mergedAlerts.values());
          this.notify();
        },
        onReportsUpdate: (liveReports) => {
          const mergedReports = new Map<string, Report>();
          INITIAL_REPORTS.forEach((r) => mergedReports.set(r.reportId, r));
          liveReports.forEach((r) => mergedReports.set(r.reportId, r));
          this.reports = Array.from(mergedReports.values());
          this.notify();
        },
        onLiveTrackingUpdate: (liveTrackingData) => {
          this.liveTracking = {
            ...INITIAL_LIVE_TRACKING,
            ...liveTrackingData,
          };
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
    firebaseService.pushLiveTracking(firstEngineer.uid, updatedTrack);

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

  // Background Telematics Ticker (Simulates live GPS motion updates to RTDB for active engineers)
  private startAutoTelematics() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = window.setInterval(() => {
      if (!this.isSimulatingMotion || this.users.length === 0) return;

      this.users.forEach((user) => {
        const track = this.liveTracking[user.uid];
        if (!track || !track.routePolyline) return;

        const waypoints = track.routePolyline;
        let currentIndex = track.currentWaypointIndex || 0;

        if (currentIndex >= waypoints.length - 1) return;

        const nextIndex = currentIndex + 1;
        const start = waypoints[currentIndex];
        const target = waypoints[nextIndex];

        const [newLat, newLng] = interpolatePosition(start[0], start[1], target[0], target[1], 0.35);
        const assignedSite = this.sites.find((s) => s.siteId === user.currentSiteId);
        const targetLat = assignedSite ? assignedSite.location.latitude : target[0];
        const targetLng = assignedSite ? assignedSite.location.longitude : target[1];

        const remainingKm = calculateHaversineDistanceKm(newLat, newLng, targetLat, targetLng);
        const heading = calculateBearing(track.latitude, track.longitude, newLat, newLng);
        const speedKmh = 36 + Math.floor(Math.random() * 10);
        const eta = calculateETA(remainingKm, speedKmh);

        const updatedTrack: LiveTracking = {
          ...track,
          latitude: newLat,
          longitude: newLng,
          speedKmh,
          heading,
          travelledDistanceKm: parseFloat((track.travelledDistanceKm + 0.15).toFixed(2)),
          remainingDistanceKm: remainingKm,
          etaMinutes: eta,
          lastUpdated: Date.now(),
          currentWaypointIndex: nextIndex,
        };

        this.liveTracking[user.uid] = updatedTrack;
        firebaseService.pushLiveTracking(user.uid, updatedTrack);
      });

      this.notify();
    }, 3000);
  }
}

export const fsmStore = new FSMStore();
