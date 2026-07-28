import React, { useState, useEffect } from 'react';
import { User, Site, LiveTracking } from '../../types/fsm';
import { SiteListView } from './SiteListView';
import { ActiveJobView } from './ActiveJobView';
import { CompletionSignoffModal } from './CompletionSignoffModal';
import { Smartphone } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';

interface MobileContainerProps {
  currentUser: User | null;
  sites: Site[];
  liveTracking: Record<string, LiveTracking>;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onArrivedAtSite: (siteId: string) => void;
  onCompleteJob: (siteId: string, notes: string, signature: string) => void;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  currentUser,
  sites,
  liveTracking,
  isSimulating,
  onToggleSimulation,
  onArrivedAtSite,
  onCompleteJob,
}) => {
  const [activeJobSite, setActiveJobSite] = useState<Site | null>(null);
  const [isSignoffOpen, setIsSignoffOpen] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

          const payload: LiveTracking = {
            engineerId: currentUser.uid,
            engineerName: currentUser.name,
            latitude: lat,
            longitude: lng,
            speedKmh: speed,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
            batteryPercentage: 92,
            isOnline: true,
            travelledDistanceKm: 0,
            remainingDistanceKm: 0,
            etaMinutes: 0,
            lastUpdated: Date.now(),
            timestamp: Date.now(),
          };

          firebaseService.pushLiveTracking(currentUser.uid, payload, currentUser.role);
        },
        (err) => {
          console.warn('Initial GPS query note:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [currentUser?.uid]);

  if (!currentUser) {
    return (
      <div className="w-full max-w-md mx-auto glass-panel rounded-3xl p-6 text-center flex flex-col justify-center items-center space-y-3 border border-slate-800">
        <Smartphone className="w-12 h-12 text-cyan-400/40 animate-pulse" />
        <h4 className="font-extrabold text-base text-slate-100">No Engineer Logged In</h4>
        <p className="text-xs text-slate-400">
          Please log in as a field engineer or register a new engineer account using the + Account button.
        </p>
      </div>
    );
  }

  const track: LiveTracking = liveTracking[currentUser.uid] || {
    engineerId: currentUser.uid,
    engineerName: currentUser.name,
    latitude: 0,
    longitude: 0,
    speedKmh: 0,
    heading: 0,
    batteryPercentage: 92,
    isOnline: true,
    travelledDistanceKm: 0,
    remainingDistanceKm: 0,
    etaMinutes: 0,
    lastUpdated: Date.now(),
  };

  return (
    <div className="w-full flex-1 max-w-2xl mx-auto glass-panel rounded-3xl p-4 border border-slate-800 flex flex-col relative overflow-hidden shadow-2xl space-y-3">
      {/* Mobile Header Title */}
      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border border-cyan-400"
          />
          <div>
            <h3 className="font-bold text-sm text-slate-100">{currentUser.name}</h3>
            <p className="text-xs text-slate-400 font-mono">Field Engineer #{currentUser.engineerId}</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
        </span>
      </div>

      {/* Screen Body */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60 rounded-2xl border border-slate-800/60 overflow-hidden">
        {activeJobSite ? (
          <ActiveJobView
            currentUser={currentUser}
            site={activeJobSite}
            track={track}
            isSimulating={isSimulating}
            onToggleSimulation={onToggleSimulation}
            onBack={() => setActiveJobSite(null)}
            onArrived={() => onArrivedAtSite(activeJobSite.siteId)}
            onOpenSignoff={() => setIsSignoffOpen(true)}
          />
        ) : (
          <SiteListView
            currentUser={currentUser}
            sites={sites}
            onSelectJob={(site) => setActiveJobSite(site)}
          />
        )}
      </div>

      {/* Signoff Modal */}
      {activeJobSite && (
        <CompletionSignoffModal
          siteId={activeJobSite.siteId}
          clientName={activeJobSite.clientName}
          isOpen={isSignoffOpen}
          onClose={() => setIsSignoffOpen(false)}
          onConfirm={(notes, sig) => {
            onCompleteJob(activeJobSite.siteId, notes, sig);
            setIsSignoffOpen(false);
          }}
        />
      )}
    </div>
  );
};
