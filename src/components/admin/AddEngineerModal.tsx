import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/fsm';
import { UserPlus, Mail, Lock, Phone, User as UserIcon, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createSecondaryAuthUser } from '../../services/firebase';
import { firebaseService } from '../../services/firebaseService';

interface AddEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEngineerAdded: (newEngineer: User) => void;
  existingUsersCount?: number;
}

export const AddEngineerModal: React.FC<AddEngineerModalProps> = ({
  isOpen,
  onClose,
  onEngineerAdded,
  existingUsersCount = 7,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    id: string;
    name: string;
    email: string;
    pass: string;
    role: string;
  } | null>(null);

  const defaultNextId = (178 + existingUsersCount + 1).toString();
  const [customEngineerId, setCustomEngineerId] = useState(defaultNextId);

  // Clear all inputs on modal open / state reset
  useEffect(() => {
    if (isOpen) {
      const generated = (178 + existingUsersCount + 1).toString();
      setCustomEngineerId(generated);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('engineer');
      setErrorMessage(null);
      setSuccessMessage(null);
      setCreatedUserCredentials(null);
    }
  }, [isOpen, existingUsersCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      let uid = `USER_${Math.floor(1000 + Math.random() * 9000)}`;

      // Create secondary Firebase Auth user so Admin session is untouched
      try {
        const authUid = await createSecondaryAuthUser(cleanEmail, cleanPassword);
        if (authUid) {
          uid = authUid;
        }
      } catch (authErr: any) {
        console.warn('Firebase Auth user creation note:', authErr.message);
      }

      const assignedId = customEngineerId.trim().replace(/^#/, '') || defaultNextId;

      const newUser: User = {
        uid,
        engineerId: assignedId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+919876543210',
        role,
        status: 'online',
        currentSiteId: null,
        deviceInfo: {
          batteryLevel: 98,
          isCharging: false,
          networkStatus: '5G',
          appVersion: '1.0.4',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Write user document to Cloud Firestore /users/{uid}
      await firebaseService.pushUser(newUser);

      // Trigger UI callback
      onEngineerAdded(newUser);

      setCreatedUserCredentials({
        id: `#${assignedId}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pass: password.trim(),
        role: role.toUpperCase(),
      });

      setSuccessMessage(`Account for ${name} (${role.toUpperCase()}) successfully created!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto glass-panel-glow rounded-3xl p-6 border border-emerald-500/30 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-100">Add New Account</h3>
                <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  ID: #{customEngineerId.replace(/^#/, '')}
                </span>
              </div>
              <p className="text-xs text-slate-400">Create engineer/admin account & assign Firestore permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {createdUserCredentials ? (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Account Credentials Generated</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">System ID:</span>
                <span className="font-bold text-cyan-400">{createdUserCredentials.id}</span>
              </div>

              <div className="flex justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Full Name:</span>
                <span className="font-bold text-slate-200">{createdUserCredentials.name}</span>
              </div>

              <div className="flex justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Username / Email:</span>
                <span className="font-bold text-emerald-300">{createdUserCredentials.email}</span>
              </div>

              <div className="flex justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Assigned Password:</span>
                <span className="font-bold text-amber-300">{createdUserCredentials.pass}</span>
              </div>

              <div className="flex justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-bold text-blue-400">{createdUserCredentials.role}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center pt-1">
              Share these login credentials directly with the real field engineer to log in via the mobile portal.
            </p>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Rakhoh Telematics Login Credentials:\nEmail: ${createdUserCredentials.email}\nPassword: ${createdUserCredentials.pass}\nRole: ${createdUserCredentials.role}`
                );
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition"
            >
              Copy Credentials & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="mt-4 space-y-3.5 text-xs">
          {/* Fully Editable Employee / System ID */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>Employee / System ID</span>
              <span className="text-[10px] text-cyan-400">Editable (e.g. EMP-101, ENG-05)</span>
            </label>
            <input
              type="text"
              required
              value={customEngineerId}
              onChange={(e) => setCustomEngineerId(e.target.value)}
              placeholder="e.g. 179, EMP-101, ENG-05..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                id="new_user_fullname"
                name="new_user_fullname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                id="new_user_email"
                name="new_user_email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh.k@rakhoh.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                id="new_user_password"
                name="new_user_password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="tel"
                id="new_user_phone"
                name="new_user_phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dual Role Selector (Engineer vs Admin) */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>Assigned System Role</span>
              <span className="text-[10px] text-cyan-400">Select Access Control Level</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('engineer')}
                className={`py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 border ${
                  role === 'engineer'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" /> Field Engineer
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 border ${
                  role === 'admin'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> System Admin
              </button>
            </div>
          </div>

          {/* Submit */}
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              {isSubmitting ? 'Creating Account...' : `Create ${role === 'admin' ? 'Admin' : 'Engineer'}`}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
