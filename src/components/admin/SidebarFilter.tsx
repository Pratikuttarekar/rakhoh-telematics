import React from 'react';
import { User, LiveTracking, Site } from '../../types/fsm';
import { Search, Battery, ShieldAlert, Navigation, Activity, UserPlus, Bell, History, Radio, Users } from 'lucide-react';
import { getEngineerColor } from './GlobalMapCanvas';

interface SidebarFilterProps {
  users: User[];
  sites: Site[];
  liveTracking: Record<string, LiveTracking>;
  selectedEngineerId: string | null;
  filterStatus: 'all' | 'online' | 'working' | 'offline';
  searchQuery: string;
  onSelectEngineer: (id: string) => void;
  onFilterChange: (status: 'all' | 'online' | 'working' | 'offline') => void;
  onSearchChange: (query: string) => void;
  onOpenDispatch: () => void;
  onOpenReport: () => void;
  onOpenAddEngineer?: () => void;
  onOpenHistoricalLogs?: () => void;
  onOpenUserManagement?: () => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  users,
  sites,
  liveTracking,
  selectedEngineerId,
  filterStatus,
  searchQuery,
  onSelectEngineer,
  onFilterChange,
  onSearchChange,
  onOpenDispatch,
  onOpenReport,
  onOpenAddEngineer,
  onOpenHistoricalLogs,
  onOpenUserManagement,
  unreadAlertCount,
  onOpenAlerts,
}) => {
  // Compute real counts
  const totalEngineers = users.length;
  const onlineCount = users.filter((u) => u.status === 'online').length;
  const offlineCount = users.filter((u) => u.status === 'offline').length;
  const workingCount = sites.filter((s) => s.status === 'working').length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.engineerId.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'offline') return user.status === 'offline';
    if (filterStatus === 'online') return user.status === 'online';
    if (filterStatus === 'working') {
      const site = sites.find((s) => s.siteId === user.currentSiteId);
      return site?.status === 'working';
    }
    return true;
  });

  return (
    <aside className="w-full lg:w-80 glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col space-y-3.5 z-20 shrink-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Live Telematics Radar
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Real-Time Engineers ({totalEngineers})</p>
        </div>

        {/* Arrival Alerts Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Arrival & Geofence Alerts"
        >
          <Bell className="w-5 h-5 text-amber-400" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
              {unreadAlertCount}
            </span>
          )}
        </button>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenDispatch}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5" />
          Dispatch Job
        </button>
        {onOpenAddEngineer && (
          <button
            onClick={onOpenAddEngineer}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Account
          </button>
        )}
      </div>

      {/* Ledger & Reports Action Bar */}
      <div className="grid grid-cols-2 gap-2">
        {onOpenHistoricalLogs && (
          <button
            onClick={onOpenHistoricalLogs}
            className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 transition border border-cyan-500/30 flex items-center justify-center gap-1"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" /> Job Ledger
          </button>
        )}
        <button
          onClick={onOpenReport}
          className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800 flex items-center justify-center gap-1"
        >
          Export Reports
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search engineer, ID..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] font-semibold">
        <button
          onClick={() => onFilterChange('all')}
          className={`py-1.5 rounded-lg transition ${
            filterStatus === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({totalEngineers})
        </button>
        <button
          onClick={() => onFilterChange('online')}
          className={`py-1.5 rounded-lg transition ${
            filterStatus === 'online' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Online ({onlineCount})
        </button>
        <button
          onClick={() => onFilterChange('working')}
          className={`py-1.5 rounded-lg transition ${
            filterStatus === 'working' ? 'bg-blue-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Work ({workingCount})
        </button>
        <button
          onClick={() => onFilterChange('offline')}
          className={`py-1.5 rounded-lg transition ${
            filterStatus === 'offline' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Off ({offlineCount})
        </button>
      </div>

      {/* Engineer List Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px]">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center glass-card rounded-2xl border border-slate-800 space-y-2 my-4">
            <Users className="w-8 h-8 text-cyan-400/40 mx-auto" />
            <p className="font-bold text-xs text-slate-200">No field engineers found in Firestore `/users`.</p>
            <p className="text-[10px] text-slate-400">Click "+ Account" above to register active engineers.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
          const track = liveTracking[user.uid];
          const isSelected = selectedEngineerId === user.uid;
          const assignedSite = sites.find((s) => s.siteId === user.currentSiteId);
          const color = getEngineerColor(user.uid);

          let statusBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          let statusText = 'Online';

          if (user.status === 'offline') {
            statusBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            statusText = 'Offline';
          } else if (track && track.speedKmh > 5) {
            statusBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            statusText = `Moving ${track.speedKmh}km/h`;
          } else if (assignedSite && assignedSite.status === 'working') {
            statusBadgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            statusText = 'Working on Site';
          }

          return (
            <div
              key={user.uid}
              onClick={() => onSelectEngineer(user.uid)}
              className={`p-3 rounded-xl cursor-pointer transition border ${
                isSelected
                  ? 'glass-panel-glow border-cyan-400/80 bg-cyan-950/30 shadow-lg scale-102'
                  : 'glass-card hover:bg-slate-800/50 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar with Distinct Color Ring */}
                <div className="relative">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2"
                    style={{ borderColor: color.hex }}
                  />
                  <span
                    className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                    title={`Color Code: ${color.hex}`}
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      user.status === 'online' ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-slate-100 truncate">{user.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      #{user.engineerId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full border font-semibold ${statusBadgeColor}`}>
                      {statusText}
                    </span>

                    {track && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Battery className="w-3 h-3" />
                          {track.batteryPercentage}%
                        </span>
                      </div>
                    )}
                  </div>

                  {assignedSite && (
                    <p className="text-[11px] text-slate-400 mt-1.5 truncate">
                      📍 {assignedSite.clientName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>
    </aside>
  );
};
