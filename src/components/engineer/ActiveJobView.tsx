import React, { useState, useRef, useEffect } from 'react';
import { Site, LiveTracking, User } from '../../types/fsm';
import { Navigation, MapPin, Gauge, Battery, ArrowLeft, CheckCircle2, ShieldCheck, Play, Pause, Radio, ShieldAlert } from 'lucide-react';
import { isWithinGeofence, calculateHaversineDistanceKm } from '../../utils/geoUtils';
import { firebaseService } from '../../services/firebaseService';

interface ActiveJobViewProps {
  currentUser: User;
  site: Site;
  track: LiveTracking;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onBack: () => void;
  onArrived: () => void;
  onOpenSignoff: () => void;
}

export const ActiveJobView: React.FC<ActiveJobViewProps> = ({
  currentUser,
  site,
  track,
  isSimulating,
  onToggleSimulation,
  onBack,
  onArrived,
  onOpenSignoff,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [isLiveGpsTracking, setIsLiveGpsTracking] = useState(!isAdmin);
  const watchIdRef = useRef<number | null>(null);

  const startGpsStream = () => {
    if (isAdmin) return;
    if ('geolocation' in navigator) {
      setIsLiveGpsTracking(true);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 25;

          const remainingKm = calculateHaversineDistanceKm(lat, lng, site.location.latitude, site.location.longitude);

          const livePayload: LiveTracking = {
            engineerId: track.engineerId,
            engineerName: track.engineerName,
            latitude: lat,
            longitude: lng,
            speedKmh: speed,
            heading: pos.coords.heading || 0,
            batteryPercentage: 92,
            isOnline: true,
            travelledDistanceKm: 5.2,
            remainingDistanceKm: Number(remainingKm.toFixed(2)),
            etaMinutes: Math.round((remainingKm / 40) * 60),
            lastUpdated: Date.now(),
          };

          firebaseService.pushLiveTracking(track.engineerId, livePayload, currentUser.role);
        },
        (err) => {
          console.warn('HTML5 Geolocation Note:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    // Only start high-accuracy GPS streaming if logged in as a Field Engineer
    if (!isAdmin) {
      startGpsStream();
    } else {
      setIsLiveGpsTracking(false);
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [site.siteId, isAdmin]);

  const toggleLiveGps = () => {
    if (isAdmin) return;
    if (isLiveGpsTracking) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveGpsTracking(false);
      onToggleSimulation();
    } else {
      startGpsStream();
      onToggleSimulation();
    }
  };
  const arrivedWithinGeofence = isWithinGeofence(
    track.latitude,
    track.longitude,
    site.location.latitude,
    site.location.longitude,
    100
  ) || site.status === 'working' || site.status === 'completed';

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
      {isAdmin && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Admin Preview Mode - GPS tracking can only be initiated by assigned Field Engineers on their mobile devices.</span>
        </div>
      )}

      {/* Header Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-cyan-400 font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sites
        </button>
        <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
          JOB: {site.siteId}
        </span>
      </div>

      {/* Target Site Card */}
      <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-100">{site.clientName}</h2>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            site.status === 'working' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
            site.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {site.status}
          </span>
        </div>

        <p className="text-xs text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          {site.location.address}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Scheduled: <strong className="text-slate-200">{site.scheduledDate}</strong></span>
          <span className="text-slate-400">Client: <strong className="text-cyan-300">{site.clientPhone}</strong></span>
        </div>
      </div>

      {/* GPS Streaming & Foreground Service Simulator */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isSimulating ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <h4 className="font-bold text-xs text-slate-100">Foreground Location Stream</h4>
              <p className="text-[10px] text-slate-400">Native Background Service (5s pulse / RTDB)</p>
            </div>
          </div>

          <button
            onClick={toggleLiveGps}
            disabled={isAdmin}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              isAdmin
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : isLiveGpsTracking || isSimulating
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-cyan-500 text-slate-950 shadow-md'
            }`}
          >
            {isLiveGpsTracking || isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLiveGpsTracking || isSimulating ? 'Pause GPS' : 'Start GPS'}
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Current Speed</span>
              <span className="font-bold text-slate-100">{track.speedKmh} km/h</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Battery Level</span>
              <span className="font-bold text-slate-100">{track.batteryPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Threshold Inspector */}
      <div className={`rounded-2xl p-4 border transition ${
        arrivedWithinGeofence
          ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-cyan-400" />
            Remaining Distance to Site
          </span>
          <span className="text-sm font-extrabold text-cyan-300">
            {track.remainingDistanceKm} km ({Math.round(track.remainingDistanceKm * 1000)}m)
          </span>
        </div>

        {arrivedWithinGeofence ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Arrived inside 100m Geofence Radius! Site marked working.</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">
            Approaching site. Geofence trigger will fire automatically when within 100m.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        {site.status === 'working' ? (
          <button
            onClick={onOpenSignoff}
            disabled={isAdmin}
            className={`w-full py-3 rounded-2xl font-extrabold text-sm shadow-xl transition flex items-center justify-center gap-2 ${
              isAdmin
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" /> Complete Job & Capture Signature
          </button>
        ) : site.status === 'completed' ? (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
            ✓ Job Signed Off & Completed
          </div>
        ) : (
          <button
            onClick={onArrived}
            disabled={isAdmin}
            className={`w-full py-3 rounded-2xl font-extrabold text-sm shadow-xl transition flex items-center justify-center gap-2 ${
              isAdmin
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
            }`}
          >
            Manual Mark Arrived at Site
          </button>
        )}
      </div>
    </div>
  );
};
