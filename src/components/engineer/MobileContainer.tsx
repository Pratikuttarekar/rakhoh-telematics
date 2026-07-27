import React, { useState } from 'react';
import { User, Site, LiveTracking } from '../../types/fsm';
import { SiteListView } from './SiteListView';
import { ActiveJobView } from './ActiveJobView';
import { CompletionSignoffModal } from './CompletionSignoffModal';
import { Wifi, Signal, Battery, Smartphone } from 'lucide-react';

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

  if (!currentUser) {
    return (
      <div className="w-full max-w-[390px] h-[780px] mx-auto bg-slate-950 rounded-[48px] p-4 shadow-2xl border-4 border-slate-800 flex flex-col justify-center items-center text-center p-6 space-y-3">
        <Smartphone className="w-12 h-12 text-cyan-400/40 animate-pulse" />
        <h4 className="font-extrabold text-base text-slate-100">No Engineer Logged In</h4>
        <p className="text-xs text-slate-400">
          Please log in as a field engineer or register a new engineer account using the + Account button.
        </p>
      </div>
    );
  }

  const track = liveTracking[currentUser.uid] || {
    engineerId: currentUser.uid,
    engineerName: currentUser.name,
    latitude: 18.6298,
    longitude: 73.7997,
    speedKmh: 0,
    heading: 0,
    batteryPercentage: currentUser.deviceInfo?.batteryLevel || 90,
    isOnline: true,
    travelledDistanceKm: 14.8,
    remainingDistanceKm: 0.25,
    etaMinutes: 2,
    lastUpdated: Date.now(),
  };

  return (
    <div className="w-full max-w-[390px] h-[780px] mx-auto bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col relative overflow-hidden">
      {/* Dynamic Notch & Speaker */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center gap-2 border border-slate-800">
        <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
        <div className="w-10 h-1 bg-slate-800 rounded-full" />
      </div>

      {/* Top Status Bar */}
      <div className="pt-6 px-6 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-300 z-30 select-none">
        <span>10:30</span>
        <div className="flex items-center gap-2">
          <Signal className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[10px]">5G</span>
          <Wifi className="w-3.5 h-3.5 text-slate-300" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-emerald-400 font-extrabold">{track.batteryPercentage}%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Mobile Header Title */}
      <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-cyan-400"
          />
          <div>
            <h3 className="font-bold text-xs text-slate-100">{currentUser.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono">Field Engineer #{currentUser.engineerId}</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
          ONLINE
        </span>
      </div>

      {/* Mobile Screen Body */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
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

      {/* Bottom Gesture Home Indicator Bar */}
      <div className="py-2 flex justify-center bg-slate-950">
        <div className="w-32 h-1 bg-slate-600 rounded-full" />
      </div>
    </div>
  );
};
