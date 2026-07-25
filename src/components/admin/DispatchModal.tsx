import React, { useState } from 'react';
import { User, Site } from '../../types/fsm';
import { MapPin, Calendar, UserCheck, Phone, Building, PlusCircle, ChevronDown, X, Navigation } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { GeocodingAddressInput } from './GeocodingAddressInput';

interface DispatchModalProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (site: Omit<Site, 'siteId' | 'createdAt'>) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  users,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const activeEngineers = users.filter((u) => u.role === 'engineer' || !u.role);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [assignedEngineerId, setAssignedEngineerId] = useState(
    activeEngineers[0]?.uid || 'ENG_178'
  );
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const [latitude, setLatitude] = useState(18.6320);
  const [longitude, setLongitude] = useState(73.8010);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedEng = users.find((u) => u.uid === assignedEngineerId) || activeEngineers[0];
    const engId = assignedEng ? assignedEng.uid : assignedEngineerId;
    const engName = assignedEng ? assignedEng.name : 'Prathamesh Patil';

    const dispatchPayload: Omit<Site, 'siteId' | 'createdAt'> = {
      clientName,
      clientPhone,
      assignedEngineerId: engId,
      assignedEngineerName: engName,
      scheduledDate,
      category,
      status: 'pending',
      location: {
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        geofenceRadiusMeters: 100,
      },
      arrivedAt: null,
      completedAt: null,
      notes,
    };

    // Trigger local state submit
    onSubmit(dispatchPayload);

    // Push notification payload under /notifications/{engineer_uid} in Firestore & RTDB
    await firebaseService.pushNotification(engId, {
      title: 'New Site Dispatched',
      message: `You have been assigned to ${clientName} at ${address}`,
      clientName,
      scheduledDate,
      address,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[90vw] sm:max-w-lg max-h-[85vh] overflow-y-auto glass-panel-glow rounded-3xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Dispatch New Field Site</h3>
              <p className="text-xs text-slate-400">Assign job requirements & location geofence radius</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Client / Facility Name</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Cummins Power Hub"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Client Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Assigned Engineer & Scheduled Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Assigned Engineer</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400 z-10" />
                <select
                  value={assignedEngineerId}
                  onChange={(e) => setAssignedEngineerId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none appearance-none font-medium cursor-pointer"
                >
                  {activeEngineers.length === 0 ? (
                    <option value="ENG_178">Prathamesh Patil (ID: #178)</option>
                  ) : (
                    activeEngineers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} (ID: #{u.engineerId || u.uid})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Scheduled Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interactive Geocoding Address Search */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>Site Location & Address</span>
              <span className="text-[10px] text-cyan-400 font-mono">Live Nominatim Geocoder</span>
            </label>
            <GeocodingAddressInput
              address={address}
              setAddress={setAddress}
              onSelectCoordinates={(lat, lng, formattedAddress) => {
                setLatitude(lat);
                setLongitude(lng);
                setAddress(formattedAddress);
              }}
              placeholder="Type plant name, landmark, or city (e.g. Pune, NTPC Delhi)..."
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Work Order Instructions */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Work Order Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific inspection or maintenance guidelines..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition"
            >
              Confirm Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
