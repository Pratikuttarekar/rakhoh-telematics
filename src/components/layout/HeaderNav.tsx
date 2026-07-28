import React from 'react';
import { ViewMode, UserRole } from '../../types/fsm';
import { LayoutDashboard, Smartphone, Columns, Play, Pause, RotateCcw, LogOut, UserPlus, History, Users } from 'lucide-react';

interface HeaderNavProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  currentRole: UserRole | null;
  currentEmail: string | null;
  onLogout: () => void;
  onOpenAddEngineer?: () => void;
  onOpenHistoricalLogs?: () => void;
  onOpenUserManagement?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  viewMode,
  onChangeViewMode,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  currentRole,
  currentEmail,
  onLogout,
  onOpenAddEngineer,
  onOpenHistoricalLogs,
  onOpenUserManagement,
}) => {
  return (
    <header className="w-full glass-panel px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-30 sticky top-0">
      {/* Brand Title with Compact Rakhoh Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/assets/rakhoh-logo.svg"
          alt="RAKHOH INDUSTRIES PVT. LTD."
          className="h-9 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight">RAKHOH TELEMATICS</h1>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
              v2.4 Enterprise SaaS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Boilers | Heaters | Power Projects</p>
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 gap-1 text-xs font-bold shadow-inner">
        <button
          onClick={() => onChangeViewMode('admin')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            viewMode === 'admin'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Admin Global Map</span><span className="sm:hidden">Admin</span>
        </button>

        <button
          onClick={() => onChangeViewMode('split')}
          className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            viewMode === 'split'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-lg font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Columns className="w-4 h-4" /> <span className="hidden sm:inline">Dual Live View</span><span className="sm:hidden">Split</span>
        </button>

        {currentRole !== 'admin' && (
          <button
            onClick={() => onChangeViewMode('engineer')}
            className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              viewMode === 'engineer'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" /> <span className="hidden sm:inline">Engineer Mobile View</span><span className="sm:hidden">Mobile</span>
          </button>
        )}
      </div>

      {/* Live Stream Telematics Controller & Admin Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            title="Classification / User Accounts Console"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Users Console</span>
          </button>
        )}

        {onOpenHistoricalLogs && (
          <button
            onClick={onOpenHistoricalLogs}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            title="Date-Wise Historical Job Ledger"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Job Ledger</span>
          </button>
        )}

        {onOpenAddEngineer && (
          <button
            onClick={onOpenAddEngineer}
            className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            title="Add New Account Profile"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Account</span>
          </button>
        )}



        {currentRole && (
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition flex items-center gap-1 text-xs font-bold"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
