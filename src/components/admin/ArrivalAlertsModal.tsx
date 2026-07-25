import React from 'react';
import { ArrivalAlert } from '../../types/fsm';
import { ShieldAlert, CheckCircle2, Clock, MapPin, UserCheck } from 'lucide-react';

interface ArrivalAlertsModalProps {
  alerts: ArrivalAlert[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (alertId: string) => void;
}

export const ArrivalAlertsModal: React.FC<ArrivalAlertsModalProps> = ({
  alerts,
  isOpen,
  onClose,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel-glow rounded-2xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Geofence Arrival Audit Log</h3>
              <p className="text-xs text-slate-400">Cloud Function `onGeofenceArrival` breach events</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <div className="my-4 max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No arrival alerts recorded yet.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`p-4 rounded-xl border transition ${
                  alert.isReadByAdmin
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : 'bg-amber-950/20 border-amber-500/40 text-slate-100 shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{alert.alertId}</span>
                      <span className="text-xs font-bold text-slate-100">{alert.engineerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">(ID: {alert.engineerId})</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Arrived at: <strong className="text-slate-100">{alert.siteName}</strong>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> {alert.arrivalTime}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        {alert.locationStatus}
                      </span>
                    </div>
                  </div>

                  {!alert.isReadByAdmin && (
                    <button
                      onClick={() => onMarkRead(alert.alertId)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
