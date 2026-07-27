import React, { useState } from 'react';
import { Site, User } from '../../types/fsm';
import { History, Calendar, Search, Filter, X, CheckCircle2, Clock, MapPin, Download, Edit3 } from 'lucide-react';
import { exportEngineerCompletedSitesToExcel } from '../../utils/exportUtils';

interface HistoricalLogsModalProps {
  sites: Site[];
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onOpenEditDispatch?: (site: Site) => void;
}

export const HistoricalLogsModal: React.FC<HistoricalLogsModalProps> = ({
  sites,
  users,
  isOpen,
  onClose,
  onOpenEditDispatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'working' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  if (!isOpen) return null;

  // Filter sites dynamically by search term, status, and date
  const filteredSites = sites.filter((site) => {
    const matchSearch =
      site.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.assignedEngineerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.siteId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || site.status === statusFilter;
    const matchDate = !dateFilter || site.scheduledDate === dateFilter || (site.completedAt && site.completedAt.slice(0, 10) === dateFilter);

    return matchSearch && matchStatus && matchDate;
  });

  const handleExportAll = () => {
    exportEngineerCompletedSitesToExcel({ name: 'All Engineers', role: 'admin' } as User, sites);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto glass-panel-glow rounded-3xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Date-Wise Historical Job Ledger</h3>
              <p className="text-xs text-slate-400">Complete historical dispatch logs & completion records across all engineers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search engineer, site, or ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({sites.length})</option>
              <option value="pending">Pending ({sites.filter((s) => s.status === 'pending').length})</option>
              <option value="working">Working ({sites.filter((s) => s.status === 'working').length})</option>
              <option value="completed">Completed ({sites.filter((s) => s.status === 'completed').length})</option>
            </select>
          </div>

          {/* Scheduled / Completion Date Filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Historical Logs Table */}
        <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Site ID & Client Name</th>
                <th className="p-3">Assigned Engineer</th>
                <th className="p-3">Scheduled Date</th>
                <th className="p-3">Completion Date</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No historical job records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const assignedEng = users.find((u) => u.uid === site.assignedEngineerId);
                  const engIdTag = assignedEng?.engineerId || site.assignedEngineerId;

                  let statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  if (site.status === 'working') statusBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                  if (site.status === 'completed') statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

                  return (
                    <tr key={site.siteId} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-cyan-400 font-bold">#{site.siteId}</span>
                          <span className="font-bold text-slate-100">{site.clientName}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                          {site.location.address}
                        </p>
                      </td>

                      <td className="p-3 font-medium">
                        <div className="font-bold text-slate-200">{site.assignedEngineerName}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: #{engIdTag}</div>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {site.scheduledDate}
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {site.completedAt ? (
                          <span className="text-emerald-400 font-bold">
                            {new Date(site.completedAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not Completed</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusBadge}`}>
                            {site.status}
                          </span>
                          {site.status !== 'completed' && onOpenEditDispatch && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenEditDispatch(site);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold transition text-[10px] flex items-center gap-1"
                              title="Edit or Reassign Job Dispatch"
                            >
                              <Edit3 className="w-3 h-3 text-cyan-400" /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
