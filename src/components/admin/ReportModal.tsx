import React from 'react';
import { Site, User, LiveTracking, ArrivalAlert } from '../../types/fsm';
import { exportFSMToExcel, exportFSMToPDF } from '../../utils/exportUtils';
import { FileSpreadsheet, FileText, Download, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  sites: Site[];
  users: User[];
  liveTracking: Record<string, LiveTracking>;
  alerts: ArrivalAlert[];
  isOpen: boolean;
  onClose: () => void;
  onAddReport: (type: 'engineer' | 'site' | 'pending' | 'completed' | 'daily_summary', title: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  sites,
  users,
  liveTracking,
  alerts,
  isOpen,
  onClose,
  onAddReport,
}) => {
  if (!isOpen) return null;

  const handleExportExcel = () => {
    exportFSMToExcel(sites, users, liveTracking, alerts);
    onAddReport('daily_summary', 'FSM Full Operational Excel Export');
  };

  const handleExportPDF = () => {
    exportFSMToPDF(sites, users, 'Field Service Daily Telematics & Site Audit');
    onAddReport('site', 'Field Service PDF Executive Summary');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel-glow rounded-2xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Export FSM Operational Reports</h3>
              <p className="text-xs text-slate-400">Generate structured Excel sheets & PDF field documentation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <div className="my-6 space-y-4">
          {/* Excel Export Card */}
          <div className="p-4 rounded-xl glass-card border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Full Excel Telematics Workbook (.xlsx)</h4>
                <p className="text-xs text-slate-400">3 Worksheets: Live Engineers, Field Sites, Geofence Alerts</p>
              </div>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Export XLSX
            </button>
          </div>

          {/* PDF Export Card */}
          <div className="p-4 rounded-xl glass-card border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Executive Summary PDF Report (.pdf)</h4>
                <p className="text-xs text-slate-400">Formatted daily dispatch breakdown with styled tables</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
