import { db, rtdb, isFirebaseConfigured } from './firebase';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
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

    // 1. Direct Firestore /users Collection Listener
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        const allUsers = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as User;
          return {
            ...data,
            uid: docSnap.id || data.uid,
          };
        });
        callbacks.onUsersUpdate(allUsers);
      },
      (err) => console.warn('Firestore Users Listener Warning:', err.message)
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

    // 5. Firebase Realtime Database (RTDB) /live_locations Node Listener
    const liveLocationsRef = ref(rtdb, 'live_locations');

    const unsubRTDBLocations = onValue(
      liveLocationsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const locData = snapshot.val() as Record<string, LiveTracking>;
          callbacks.onLiveTrackingUpdate(locData);
        } else {
          callbacks.onLiveTrackingUpdate({});
        }
      },
      (err) => console.warn('RTDB live_locations Listener Warning:', err.message)
    );

    return () => {
      unsubUsers();
      unsubSites();
      unsubAlerts();
      unsubReports();
      unsubRTDBLocations();
    };
  }

  // Push User creation to Firestore /users/{uid} and RTDB /users/{uid} & /status/{uid}
  public async pushUser(user: User) {
    if (!this.isEnabled() || !db) return;
    const cleanEmail = user.email.trim().toLowerCase();
    const cleanUser = {
      ...user,
      email: cleanEmail,
      updatedAt: new Date().toISOString(),
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, cleanUser, { merge: true });

      if (rtdb) {
        const rtdbUserRef = ref(rtdb, `users/${user.uid}`);
        const rtdbStatusRef = ref(rtdb, `status/${user.uid}`);
        const statusPayload = {
          uid: user.uid,
          engineerId: user.engineerId,
          name: user.name,
          email: cleanEmail,
          role: user.role,
          phone: user.phone,
          status: user.status || 'online',
          lastSeen: Date.now(),
        };
        await set(rtdbUserRef, statusPayload);
        await set(rtdbStatusRef, statusPayload);
      }
    } catch (err: any) {
      console.error('Firestore/RTDB User Push Error:', err.message);
      throw new Error(`Failed to save engineer to database: ${err.message}`);
    }
  }

  // Delete User document from Firestore /users/{uid} and RTDB /status/{uid}, /users/{uid}, /live_locations/{uid}
  public async deleteUser(uid: string) {
    if (!this.isEnabled() || !db) return;
    try {
      const userDocRef = doc(db, 'users', uid);
      await deleteDoc(userDocRef);

      if (rtdb) {
        await set(ref(rtdb, `users/${uid}`), null);
        await set(ref(rtdb, `status/${uid}`), null);
        await set(ref(rtdb, `live_locations/${uid}`), null);
      }
    } catch (err: any) {
      console.warn('User Delete Error:', err.message);
    }
  }

  // Push Live Telematics Update strictly to RTDB node /live_locations/{engineerId} (Field Engineers ONLY)
  public async pushLiveTracking(engineerId: string, data: LiveTracking, userRole: string = 'engineer') {
    if (!this.isEnabled() || !rtdb) return;
    if (userRole === 'admin') {
      console.warn('FSM Telematics Warning: Admin browser location push rejected.');
      return;
    }
    try {
      const locRef = ref(rtdb, `live_locations/${engineerId}`);
      const payload = {
        engineerId,
        engineerName: data.engineerName || 'Field Engineer',
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speedKmh || 0,
        speedKmh: data.speedKmh || 0,
        heading: data.heading || 0,
        timestamp: Date.now(),
        lastUpdated: Date.now(),
        status: 'online',
        isOnline: true,
        remainingDistanceKm: data.remainingDistanceKm || 0,
        etaMinutes: data.etaMinutes || 0,
      };
      await set(locRef, payload);
    } catch (err: any) {
      console.warn('RTDB Live Location Push Error:', err.message);
    }
  }

  // Push Site / Dispatch document to Firestore /sites/{siteId} and /dispatches/{siteId}
  public async pushSite(site: Site) {
    if (!this.isEnabled() || !db) return;
    try {
      const siteDocRef = doc(db, 'sites', site.siteId);
      const dispatchDocRef = doc(db, 'dispatches', site.siteId);
      const payload = {
        ...site,
        assignedEngineerId: site.assignedEngineerId,
        assignedEngineerName: site.assignedEngineerName,
        latitude: site.location.latitude,
        longitude: site.location.longitude,
        clientName: site.clientName,
        status: site.status,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(siteDocRef, payload, { merge: true });
      await setDoc(dispatchDocRef, payload, { merge: true });
    } catch (err: any) {
      console.warn('Firestore Site Push Error:', err.message);
    }
  }

  // Delete Site / Dispatch document from Firestore /sites/{siteId} and /dispatches/{siteId}
  public async deleteSite(siteId: string) {
    if (!this.isEnabled() || !db) return;
    try {
      await deleteDoc(doc(db, 'sites', siteId));
      await deleteDoc(doc(db, 'dispatches', siteId));
    } catch (err: any) {
      console.warn('Firestore Site Delete Error:', err.message);
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

  // Purge all non-admin dummy users from Firestore /users and RTDB /users & /status
  public async purgeNonAdminUsers() {
    if (!this.isEnabled() || !db) return;
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      for (const docSnap of snapshot.docs) {
        const userData = docSnap.data() as User;
        if (userData.role !== 'admin' && userData.email?.toLowerCase().trim() !== 'admin@rakhoh.com') {
          await deleteDoc(doc(db, 'users', docSnap.id));

          if (rtdb) {
            await set(ref(rtdb, `users/${docSnap.id}`), null);
            await set(ref(rtdb, `status/${docSnap.id}`), null);
            await set(ref(rtdb, `live_locations/${docSnap.id}`), null);
            await set(ref(rtdb, `live_tracking/${docSnap.id}`), null);
          }
        }
      }
    } catch (err: any) {
      console.warn('Purge Users Error:', err.message);
    }
  }
}

export const firebaseService = new FirebaseService();
