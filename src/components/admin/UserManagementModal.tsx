import React, { useState } from 'react';
import { User, UserRole } from '../../types/fsm';
import { Users, Search, Edit3, Trash2, UserPlus, X, ShieldCheck, User as UserIcon, Mail, Phone, Check, Lock, AlertTriangle } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { fsmStore } from '../../services/store';

interface UserManagementModalProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onOpenAddUser: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  isOpen,
  onClose,
  onOpenAddUser,
}) => {
  const [activeTab, setActiveTab] = useState<'engineer' | 'admin'>('engineer');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Account Form state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('engineer');
  const [editPhone, setEditPhone] = useState('');
  const [editEngineerId, setEditEngineerId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPasswordNote, setEditPasswordNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter users by tab role & search query
  const engineerUsers = users.filter((u) => u.role === 'engineer' || !u.role);
  const adminUsers = users.filter((u) => u.role === 'admin');

  const displayedUsers = (activeTab === 'engineer' ? engineerUsers : adminUsers).filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.engineerId && u.engineerId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role || 'engineer');
    setEditPhone(user.phone || '');
    setEditEngineerId(user.engineerId || '');
    setEditEmail(user.email);
    setEditPasswordNote('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const updatedUser: User = {
        ...editingUser,
        name: editName.trim(),
        role: editRole,
        phone: editPhone.trim() || '+919876543210',
        engineerId: editEngineerId.trim() || editingUser.engineerId,
        email: editEmail.trim().toLowerCase(),
        updatedAt: new Date().toISOString(),
      };

      // Push to Firestore /users/{uid} and RTDB /users & /status
      await firebaseService.pushUser(updatedUser);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Failed to update account:', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (uid: string) => {
    fsmStore.removeLocalUser(uid);
    await firebaseService.deleteUser(uid);
    setDeleteConfirmUid(null);
  };

  const handlePurgeNonAdmin = async () => {
    if (window.confirm('Purge all stale non-admin dummy users (including test engineers) from Firestore and RTDB?')) {
      await firebaseService.purgeNonAdminUsers();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto glass-panel-glow rounded-3xl p-6 border border-cyan-500/30 text-slate-100 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Classification & User Management</h3>
              <p className="text-xs text-slate-400">Manage real-time Firestore profiles, credentials & access roles</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePurgeNonAdmin}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition flex items-center gap-1"
              title="Purge all non-admin test users"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Stale Users
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAddUser();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> + Add Account
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Role Classification Tabs (Engineers vs Admins) */}
        <div className="flex items-center justify-between my-4 gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('engineer')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'engineer'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Field Engineers ({engineerUsers.length})
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-blue-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> System Admins ({adminUsers.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users Table View */}
        <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">User & Employee ID</th>
                <th className="p-3">Username / Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No registered {activeTab === 'engineer' ? 'field engineers' : 'system admins'} found matching search criteria.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => {
                  const isDeleting = deleteConfirmUid === user.uid;

                  return (
                    <tr key={user.uid} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-cyan-500/40 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-100">{user.name}</div>
                            <div className="text-[10px] font-mono text-cyan-400 font-bold">ID: #{user.engineerId || user.uid}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {user.email}
                      </td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          user.role === 'admin'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {user.role === 'admin' ? <ShieldCheck className="w-3 h-3 text-blue-400" /> : <UserIcon className="w-3 h-3 text-cyan-400" />}
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3 text-slate-300 font-mono">
                        {user.phone || '+919876543210'}
                      </td>

                      <td className="p-3 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-300 font-bold">Confirm delete?</span>
                            <button
                              onClick={() => setDeleteConfirmUid(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleDelete(user.uid)}
                              className="px-2.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold"
                            >
                              Yes, Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold transition flex items-center gap-1 text-[11px]"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Account
                            </button>

                            <button
                              onClick={() => setDeleteConfirmUid(user.uid)}
                              className="px-2 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 font-bold transition flex items-center gap-1 text-[11px]"
                              title="Delete or Deactivate Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Deactivate
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Embedded Edit Account Modal Overlay */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md glass-panel-glow rounded-3xl p-6 border border-cyan-500/40 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-bold text-base text-slate-100">Edit Account: #{editingUser.engineerId}</h4>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editEngineerId}
                    onChange={(e) => setEditEngineerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Username / Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assigned Role Permission</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRole('engineer')}
                      className={`py-2 rounded-xl text-xs font-extrabold transition border ${
                        editRole === 'engineer'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Field Engineer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole('admin')}
                      className={`py-2 rounded-xl text-xs font-extrabold transition border ${
                        editRole === 'admin'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      System Admin
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg transition flex items-center gap-1.5"
                  >
                    {isSaving ? 'Saving...' : 'Save Account Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
