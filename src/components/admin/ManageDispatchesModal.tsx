import React, { useState } from 'react';
import { Site, User } from '../../types/fsm';
import { Briefcase, Calendar, MapPin, Edit3, Trash2, PlusCircle, X, Check, ShieldAlert, Building, UserCheck } from 'lucide-react';
import { fsmStore } from '../../services/store';
import { GeocodingAddressInput } from './GeocodingAddressInput';

interface ManageDispatchesModalProps {
  engineerUser: User | null;
  sites: Site[];
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onOpenNewDispatch: (engineerId?: string) => void;
}

export const ManageDispatchesModal: React.FC<ManageDispatchesModalProps> = ({
  engineerUser,
  sites,
  users,
  isOpen,
  onClose,
  onOpenNewDispatch,
}) => {
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number>(18.6320);
  const [editLongitude, setEditLongitude] = useState<number>(73.8010);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAssignedEngId, setEditAssignedEngId] = useState('');
  
  const [deleteConfirmSiteId, setDeleteConfirmSiteId] = useState<string | null>(null);

  if (!isOpen || !engineerUser) return null;

  // Filter ONLY active/future jobs assigned to this engineer (STRICTLY EXCLUDE completed jobs)
  const activeDispatches = sites.filter((site) => {
    const isAssigned =
      site.assignedEngineerId === engineerUser.uid ||
      site.assignedEngineerId === engineerUser.engineerId ||
      site.assignedEngineerName.toLowerCase() === engineerUser.name.toLowerCase();

    return isAssigned && site.status !== 'completed';
  });

  const handleStartEdit = (site: Site) => {
    setEditingSiteId(site.siteId);
    setEditClientName(site.clientName);
    setEditAddress(site.location.address);
    setEditLatitude(site.location.latitude);
    setEditLongitude(site.location.longitude);
    setEditDate(site.scheduledDate);
    setEditNotes(site.notes || '');
    setEditAssignedEngId(site.assignedEngineerId);
  };

  const handleSaveEdit = (siteId: string) => {
    const assignedEng = users.find((u) => u.uid === editAssignedEngId) || engineerUser;
    
    fsmStore.updateSiteDetails(siteId, {
      clientName: editClientName,
      assignedEngineerId: assignedEng.uid,
      assignedEngineerName: assignedEng.name,
      scheduledDate: editDate,
      notes: editNotes,
      location: {
        address: editAddress,
        latitude: Number(editLatitude),
        longitude: Number(editLongitude),
        geofenceRadiusMeters: 100,
      },
    });

    setEditingSiteId(null);
  };

  const handleDelete = (siteId: string) => {
    fsmStore.deleteSite(siteId);
    setDeleteConfirmSiteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[90vw] sm:max-w-xl max-h-[85vh] overflow-y-auto glass-panel-glow rounded-3xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Manage Engineer Dispatches</h3>
              <p className="text-xs text-slate-400">Active & pending job dispatches for <strong className="text-cyan-300">{engineerUser.name}</strong></p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Actions Bar */}
        <div className="flex items-center justify-between my-4 pt-1">
          <span className="text-xs text-slate-400 font-semibold">
            Active Jobs Queue ({activeDispatches.length})
          </span>

          <button
            onClick={() => {
              onClose();
              onOpenNewDispatch(engineerUser.uid);
            }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Assign New Job
          </button>
        </div>

        {/* Dispatches List */}
        <div className="space-y-3.5">
          {activeDispatches.length === 0 ? (
            <div className="text-center py-10 glass-card rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
              <ShieldAlert className="w-8 h-8 text-cyan-400/50 mx-auto" />
              <p className="font-bold text-slate-200">No active pending or in-progress jobs for this engineer.</p>
              <p className="text-[11px] text-slate-500">Completed jobs are strictly preserved in the historical audit ledger.</p>
            </div>
          ) : (
            activeDispatches.map((site) => {
              const isEditing = editingSiteId === site.siteId;
              const isDeleting = deleteConfirmSiteId === site.siteId;

              if (isEditing) {
                return (
                  <div key={site.siteId} className="bg-slate-900/90 p-4 rounded-2xl border border-cyan-500/50 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-mono text-xs text-cyan-400 font-bold">Edit Job: #{site.siteId}</span>
                      <button onClick={() => setEditingSiteId(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Target Facility Name</label>
                        <input
                          type="text"
                          value={editClientName}
                          onChange={(e) => setEditClientName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Scheduled Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-400 mb-1 flex items-center justify-between">
                        <span>Site Location & Address</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Live Nominatim Geocoder</span>
                      </label>
                      <GeocodingAddressInput
                        address={editAddress}
                        setAddress={setEditAddress}
                        onSelectCoordinates={(lat, lng, formattedAddress) => {
                          setEditLatitude(lat);
                          setEditLongitude(lng);
                          setEditAddress(formattedAddress);
                        }}
                        placeholder="Search landmark, plant name or address..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editLatitude}
                          onChange={(e) => setEditLatitude(parseFloat(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editLongitude}
                          onChange={(e) => setEditLongitude(parseFloat(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-400 mb-1">Reassign Engineer</label>
                      <select
                        value={editAssignedEngId}
                        onChange={(e) => setEditAssignedEngId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      >
                        {users.filter(u => u.role === 'engineer' || !u.role).map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.name} (#{u.engineerId || u.uid})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs">
                      <label className="block text-slate-400 mb-1">Work Instructions</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 text-xs">
                      <button
                        onClick={() => setEditingSiteId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(site.siteId)}
                        className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center gap-1 shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={site.siteId} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">#{site.siteId}</span>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-cyan-400" />
                        {site.clientName}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      site.status === 'working'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {site.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{site.location.address}</span>
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> {site.scheduledDate}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {site.location.latitude.toFixed(4)}, {site.location.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {isDeleting ? (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between animate-in fade-in">
                      <span>Confirm delete job #{site.siteId}?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDeleteConfirmSiteId(null)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold"
                        >
                          No
                        </button>
                        <button
                          onClick={() => handleDelete(site.siteId)}
                          className="px-3 py-1 rounded-md bg-rose-500 text-white font-bold"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleStartEdit(site)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 font-semibold transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Details
                      </button>

                      <button
                        onClick={() => setDeleteConfirmSiteId(site.siteId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel / Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
