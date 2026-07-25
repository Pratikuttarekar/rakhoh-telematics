import { db, rtdb, isFirebaseConfigured } from './firebase';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { User, Site, ArrivalAlert, LiveTracking, Report } from '../types/fsm';

export class FirebaseService {
  private isConfigured: boolean = isFirebaseConfigured;

  public isEnabled(): boolean {
    return this.isConfigured && Boolean(db) && Boolean(rtdb);
  }

  // Subscribe strictly to Live Firestore & RTDB collections
  public subscribeToLiveUpdates(callbacks: {
    onUsersUpdate: (users: User[]) => void;
    onSitesUpdate: (sites: Site[]) => void;
    onAlertsUpdate: (alerts: ArrivalAlert[]) => void;
    onReportsUpdate: (reports: Report[]) => void;
    onLiveTrackingUpdate: (tracking: Record<string, LiveTracking>) => void;
  }) {
    if (!this.isEnabled() || !db || !rtdb) {
      console.log('FSM Platform: Firebase credentials not initialized.');
      callbacks.onUsersUpdate([]);
      callbacks.onLiveTrackingUpdate({});
      return () => {};
    }

    console.log('FSM Platform: Querying Firestore /users (role == engineer) & RTDB /live_locations...');

    // 1. Strict Firestore /users Query for role == 'engineer'
    const usersRef = collection(db, 'users');
    const engineerQuery = query(usersRef, where('role', '==', 'engineer'));
    
    const unsubUsers = onSnapshot(
      engineerQuery,
      (snapshot) => {
        const engineers = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as User;
          return {
            ...data,
            uid: docSnap.id || data.uid,
          };
        });
        callbacks.onUsersUpdate(engineers);
      },
      (err) => {
        // If index is building or query unsupported, fall back to whole /users snapshot filtered in JS
        onSnapshot(
          usersRef,
          (snapshot) => {
            const allUsers = snapshot.docs.map((docSnap) => docSnap.data() as User);
            const engineers = allUsers.filter((u) => u.role === 'engineer');
            callbacks.onUsersUpdate(engineers);
          },
          (allErr) => console.warn('Firestore Users Listener Warning:', allErr.message)
        );
      }
    );

    // 2. Firestore /sites Collection Listener
    const unsubSites = onSnapshot(
      collection(db, 'sites'),
      (snapshot) => {
        const sites = snapshot.docs.map((docSnap) => docSnap.data() as Site);
        callbacks.onSitesUpdate(sites);
      },
      (err) => console.warn('Firestore Sites Listener Warning:', err.message)
    );

    // 3. Firestore /arrival_alerts Collection Listener
    const unsubAlerts = onSnapshot(
      collection(db, 'arrival_alerts'),
      (snapshot) => {
        const alerts = snapshot.docs.map((docSnap) => docSnap.data() as ArrivalAlert);
        callbacks.onAlertsUpdate(alerts);
      },
      (err) => console.warn('Firestore Alerts Listener Warning:', err.message)
    );

    // 4. Firestore /reports Collection Listener
    const unsubReports = onSnapshot(
      collection(db, 'reports'),
      (snapshot) => {
        const reports = snapshot.docs.map((docSnap) => docSnap.data() as Report);
        callbacks.onReportsUpdate(reports);
      },
      (err) => console.warn('Firestore Reports Listener Warning:', err.message)
    );

    // 5. Firebase Realtime Database (RTDB) /live_locations and /live_tracking Node Listener
    const liveLocationsRef = ref(rtdb, 'live_locations');
    const liveTrackingRef = ref(rtdb, 'live_tracking');

    const unsubRTDBLocations = onValue(
      liveLocationsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const locData = snapshot.val() as Record<string, LiveTracking>;
          callbacks.onLiveTrackingUpdate(locData);
        }
      },
      (err) => console.warn('RTDB live_locations Listener Warning:', err.message)
    );

    const unsubRTDBTracking = onValue(
      liveTrackingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const trackingData = snapshot.val() as Record<string, LiveTracking>;
          callbacks.onLiveTrackingUpdate(trackingData);
        }
      },
      (err) => console.warn('RTDB live_tracking Listener Warning:', err.message)
    );

    return () => {
      unsubUsers();
      unsubSites();
      unsubAlerts();
      unsubReports();
      unsubRTDBLocations();
      unsubRTDBTracking();
    };
  }

  // Push User creation to Firestore /users/{uid}
  public async pushUser(user: User) {
    if (!this.isEnabled() || !db) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, user);
    } catch (err: any) {
      console.warn('Firestore User Push Error:', err.message);
    }
  }

  // Push Live Telematics Update to RTDB node /live_locations/{engineerId} and /live_tracking/{engineerId}
  public async pushLiveTracking(engineerId: string, data: LiveTracking) {
    if (!this.isEnabled() || !rtdb) return;
    try {
      const locRef = ref(rtdb, `live_locations/${engineerId}`);
      const trackRef = ref(rtdb, `live_tracking/${engineerId}`);
      await set(locRef, data);
      await set(trackRef, data);
    } catch (err: any) {
      console.warn('RTDB Live Tracking Push Error:', err.message);
    }
  }

  // Push Site Creation to Firestore /sites/{siteId}
  public async pushSite(site: Site) {
    if (!this.isEnabled() || !db) return;
    try {
      const siteDocRef = doc(db, 'sites', site.siteId);
      await setDoc(siteDocRef, site);
    } catch (err: any) {
      console.warn('Firestore Site Push Error:', err.message);
    }
  }

  // Push Notification payload under Firestore /notifications/{engineerUid} and RTDB /notifications/{engineerUid}
  public async pushNotification(engineerUid: string, payload: any) {
    if (!this.isEnabled() || !db) return;
    try {
      const notifDocRef = doc(db, 'notifications', `${engineerUid}_${Date.now()}`);
      await setDoc(notifDocRef, {
        engineerUid,
        ...payload,
        createdAt: new Date().toISOString(),
        isRead: false,
      });

      if (rtdb) {
        const rtdbNotifRef = ref(rtdb, `notifications/${engineerUid}`);
        await set(rtdbNotifRef, {
          engineerUid,
          ...payload,
          timestamp: Date.now(),
        });
      }
    } catch (err: any) {
      console.warn('Notification Push Error:', err.message);
    }
  }

  // Push Site Status Update to Firestore /sites/{siteId}
  public async pushSiteStatus(siteId: string, updates: Partial<Site>) {
    if (!this.isEnabled() || !db) return;
    try {
      const siteDocRef = doc(db, 'sites', siteId);
      await updateDoc(siteDocRef, updates);
    } catch (err: any) {
      console.warn('Firestore Site Update Error:', err.message);
    }
  }

  // Push Geofence Arrival Alert to Firestore /arrival_alerts/{alertId}
  public async pushArrivalAlert(alert: ArrivalAlert) {
    if (!this.isEnabled() || !db) return;
    try {
      const alertDocRef = doc(db, 'arrival_alerts', alert.alertId);
      await setDoc(alertDocRef, alert);
    } catch (err: any) {
      console.warn('Firestore Arrival Alert Push Error:', err.message);
    }
  }

  // Push Report to Firestore /reports/{reportId}
  public async pushReport(report: Report) {
    if (!this.isEnabled() || !db) return;
    try {
      const reportDocRef = doc(db, 'reports', report.reportId);
      await setDoc(reportDocRef, report);
    } catch (err: any) {
      console.warn('Firestore Report Push Error:', err.message);
    }
  }

  // Push Dispatch record to Firestore /dispatches/{dispatchId}
  public async pushDispatch(dispatchRecord: any) {
    if (!this.isEnabled() || !db) return;
    try {
      const dispatchDocRef = doc(db, 'dispatches', `DISP_${Date.now()}`);
      await setDoc(dispatchDocRef, dispatchRecord);
    } catch (err: any) {
      console.warn('Firestore Dispatch Push Error:', err.message);
    }
  }

  // Delete Site from Firestore /sites/{siteId}
  public async deleteSite(siteId: string) {
    if (!this.isEnabled() || !db) return;
    try {
      const siteDocRef = doc(db, 'sites', siteId);
      await deleteDoc(siteDocRef);
    } catch (err: any) {
      console.warn('Firestore Site Delete Error:', err.message);
    }
  }
}

export const firebaseService = new FirebaseService();
