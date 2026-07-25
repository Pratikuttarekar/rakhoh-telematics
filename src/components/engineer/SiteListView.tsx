import React, { useState } from 'react';
import { Site, User } from '../../types/fsm';
import { MapPin, Calendar, Clock, Phone, ChevronRight, CheckCircle, PlayCircle, FileSpreadsheet, Download, AlertCircle, ShieldAlert } from 'lucide-react';
import { exportEngineerCompletedSitesToExcel } from '../../utils/exportUtils';

interface SiteListViewProps {
  currentUser: User;
  sites: Site[];
  onSelectJob: (site: Site) => void;
}

export const SiteListView: React.FC<SiteListViewProps> = ({ currentUser, sites, onSelectJob }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [alertToast, setAlertToast] = useState<{ message: string; isError: boolean } | null>(null);

  // Strict Engineer-Specific Site Filtering:
  // Fetch ONLY records where assignedEngineerId == currentUser.uid or assignedEngineerName == currentUser.name
  const isUserAssigned = (s: Site) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true; // Admin can preview all sites in simulator mode

    const matchId =
      s.assignedEngineerId === currentUser.uid ||
      s.assignedEngineerId === currentUser.engineerId;
    const matchName =
      s.assignedEngineerName &&
      currentUser.name &&
      s.assignedEngineerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

    return matchId || matchName;
  };

  const myAssignedSites = sites.filter(isUserAssigned);
  const filteredSites = myAssignedSites.filter((s) => s.category === activeTab);
  const myCompletedSites = myAssignedSites.filter((s) => s.status === 'completed');

  const handleExportCompletedExcel = () => {
    setAlertToast(null);
    const result = exportEngineerCompletedSitesToExcel(currentUser, sites);

    if (!result.success) {
      setAlertToast({
        message: 'No completed sites found for your account to export.',
        isError: true,
      });
    } else {
      setAlertToast({
        message: `Successfully exported ${result.count} completed site(s) to ${result.fileName}!`,
        isError: false,
      });
    }

    // Auto dismiss toast after 4 seconds
    setTimeout(() => {
      setAlertToast(null);
    }, 4000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto relative">
      {/* Toast Notification Alert */}
      {alertToast && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl ${
            alertToast.isError
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {alertToast.isError ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{alertToast.message}</span>
        </div>
      )}

      {/* View Category Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'today' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Today ({myAssignedSites.filter((s) => s.category === 'today').length})
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'tomorrow' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tomorrow ({myAssignedSites.filter((s) => s.category === 'tomorrow').length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 rounded-xl transition ${
            activeTab === 'upcoming' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upcoming ({myAssignedSites.filter((s) => s.category === 'upcoming').length})
        </button>
      </div>

      {/* Export Individual Engineer Completed Sites Action */}
      <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">My Completed Sites ({myCompletedSites.length})</span>
        </div>
        <button
          onClick={handleExportCompletedExcel}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
        </button>
      </div>

      {/* Sites List */}
      <div className="space-y-3">
        {filteredSites.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
            <ShieldAlert className="w-8 h-8 text-cyan-400/50 mx-auto" />
            <p className="font-bold text-slate-200">No sites assigned to your account for this period.</p>
            <p className="text-[11px] text-slate-500">New job dispatches assigned by Admin will appear here automatically.</p>
          </div>
        ) : (
          filteredSites.map((site) => {
            let statusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            if (site.status === 'working') statusClass = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            if (site.status === 'completed') statusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

            return (
              <div
                key={site.siteId}
                className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{site.siteId}</span>
                    <h3 className="font-bold text-base text-slate-100">{site.clientName}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusClass}`}>
                    {site.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{site.location.address}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {site.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Geofence: {site.location.geofenceRadiusMeters}m
                    </span>
                  </div>
                </div>

                {site.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                    "{site.notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={`tel:${site.clientPhone}`}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Client
                  </a>

                  <button
                    onClick={() => onSelectJob(site)}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1 transition"
                  >
                    {site.status === 'completed' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-slate-950" /> View Summary
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-slate-950" /> Start Active Job <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
