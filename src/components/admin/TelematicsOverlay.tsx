import React, { useState } from 'react';
import { User, LiveTracking, Site } from '../../types/fsm';
import { Gauge, Battery, Navigation, Clock, MapPin, Phone, ShieldCheck, Play, Pause, RotateCcw, ChevronUp, ChevronDown, X, Briefcase } from 'lucide-react';
import { getEngineerColor } from '../admin/GlobalMapCanvas';

interface TelematicsOverlayProps {
  user: User | null;
  track: LiveTracking | null;
  assignedSite: Site | null;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onOpenManageDispatches?: (user: User) => void;
  onClose: () => void;
}

export const TelematicsOverlay: React.FC<TelematicsOverlayProps> = ({
  user,
  track,
  assignedSite,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  onOpenManageDispatches,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user || !track) return null;

  const color = getEngineerColor(user.uid);

  return (
    <div className="fixed sm:absolute bottom-4 right-4 z-40 w-80 max-w-[320px] glass-panel-glow rounded-2xl p-3 sm:p-4 border border-cyan-500/30 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border-2 shadow-md"
              style={{ borderColor: color.hex }}
            />
            <span
              className="absolute -top-1 -left-1 w-3 h-3 rounded-full border border-slate-900"
              style={{ backgroundColor: color.hex }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs text-slate-100 truncate">{user.name}</h3>
              <span className="text-[9px] font-mono font-bold bg-cyan-950/60 text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/30 shrink-0">
                #{user.engineerId}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <Phone className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              {user.phone}
            </p>
          </div>
        </div>

        {/* Toggle & Close Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title={isExpanded ? 'Collapse Telemetry' : 'Expand Telemetry'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed Compact Summary Bar */}
      {!isExpanded && (
        <div className="pt-2 flex items-center justify-between text-[11px] font-semibold">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-amber-300 font-extrabold">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              {track.speedKmh} km/h
            </span>
            <span className="flex items-center gap-1 text-emerald-300 font-bold">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              {track.batteryPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenManageDispatches && (
              <button
                onClick={() => onOpenManageDispatches(user)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-bold"
              >
                Dispatches
              </button>
            )}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold"
            >
              Details
            </button>
          </div>
        </div>
      )}

      {/* Expanded Full Metrics Panel */}
      {isExpanded && (
        <div className="animate-in fade-in duration-200">
          {/* Live Telematics Grid */}
          <div className="grid grid-cols-3 gap-2 my-3">
            {/* Speed */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <Gauge className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Speed</span>
              <span className="font-extrabold text-xs text-amber-300">{track.speedKmh} <span className="text-[9px] font-normal">km/h</span></span>
            </div>

            {/* Battery */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <Battery className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
              <span className="text-[9px] text-slate-400 font-semibold uppercase">Battery</span>
              <span className="font-extrabold text-xs text-emerald-300">{track.batteryPercentage}%</span>
            </div>

            {/* ETA */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <Clock className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
              <span className="text-[9px] text-slate-400 font-semibold uppercase">ETA</span>
              <span className="font-extrabold text-xs text-cyan-300">{track.etaMinutes} <span className="text-[9px] font-normal">min</span></span>
            </div>
          </div>

          {/* Distance Telematics Stream */}
          <div className="space-y-1.5 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" />
                Distance:
              </span>
              <span className="font-bold text-slate-200">{track.travelledDistanceKm} km</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                Remaining:
              </span>
              <span className="font-bold text-rose-300">{track.remainingDistanceKm} km</span>
            </div>

            {assignedSite && (
              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate">Target: <strong className="text-slate-200">{assignedSite.clientName}</strong></span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase text-[8px]">
                  {assignedSite.status}
                </span>
              </div>
            )}
          </div>

          {/* Read-Only Telematics & Manage Dispatches Actions Bar */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Live Sensor Telematics
            </div>

            {onOpenManageDispatches && (
              <button
                onClick={() => onOpenManageDispatches(user)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-md"
                title="Manage active job dispatches"
              >
                <Briefcase className="w-3.5 h-3.5" /> Manage Dispatches
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
