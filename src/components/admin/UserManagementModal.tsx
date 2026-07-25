import React, { useState } from 'react';
import { User, UserRole } from '../../types/fsm';
import { Users, Search, Edit3, Trash2, UserPlus, X, ShieldCheck, User as UserIcon, Mail, Phone, Check } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('engineer');
  const [editPhone, setEditPhone] = useState('');
  const [editEngineerId, setEditEngineerId] = useState('');

  const [deleteConfirmUid, setDeleteConfirmUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.engineerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.uid);
    setEditName(user.name);
    setEditRole(user.role || 'engineer');
    setEditPhone(user.phone || '');
    setEditEngineerId(user.engineerId || '');
  };

  const handleSaveEdit = async (user: User) => {
    const updatedUser: User = {
      ...user,
      name: editName.trim(),
      role: editRole,
      phone: editPhone.trim(),
      engineerId: editEngineerId.trim(),
      updatedAt: new Date().toISOString(),
    };

    await firebaseService.pushUser(updatedUser);
    setEditingUserId(null);
  };

  const handleDelete = async (uid: string) => {
    await firebaseService.deleteUser(uid);
    setDeleteConfirmUid(null);
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
              <h3 className="font-extrabold text-lg text-slate-100">Classification / Users Console</h3>
              <p className="text-xs text-slate-400">Manage real-time Firestore user profiles, access credentials & roles</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAddUser();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> + Add User Account
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Users Directory Table */}
        <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">User & ID</th>
                <th className="p-3">Username / Email</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No registered user accounts found in Firestore `/users`.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isEditing = editingUserId === user.uid;
                  const isDeleting = deleteConfirmUid === user.uid;

                  if (isEditing) {
                    return (
                      <tr key={user.uid} className="bg-slate-900/90">
                        <td className="p-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200"
                          />
                          <input
                            type="text"
                            value={editEngineerId}
                            onChange={(e) => setEditEngineerId(e.target.value)}
                            placeholder="ID e.g. 178"
                            className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-cyan-400 font-mono text-[10px]"
                          />
                        </td>

                        <td className="p-3 font-mono text-slate-400">
                          {user.email}
                        </td>

                        <td className="p-3">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                          >
                            <option value="engineer">Field Engineer</option>
                            <option value="admin">System Admin</option>
                          </select>
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+919876543210"
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(user)}
                              className="px-3 py-1 rounded bg-cyan-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={user.uid} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.name}
                            className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
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
                            <span className="text-[10px] text-rose-300 font-bold">Delete profile?</span>
                            <button
                              onClick={() => setDeleteConfirmUid(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleDelete(user.uid)}
                              className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold"
                            >
                              Yes
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmUid(user.uid)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};
