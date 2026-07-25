import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/fsm';
import { UserPlus, Mail, Lock, Phone, User as UserIcon, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { auth } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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

  const nextEngineerId = (178 + existingUsersCount + 1).toString();

  // Clear all inputs on modal open / state reset
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setRole('engineer');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

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
      let uid = `USER_${Math.floor(1000 + Math.random() * 9000)}`;

      // Create secondary Firebase Auth user
      if (auth) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
          if (userCred.user) {
            uid = userCred.user.uid;
          }
        } catch (authErr: any) {
          console.warn('Firebase Auth creation warning:', authErr.message);
        }
      }

      const newUser: User = {
        uid,
        engineerId: nextEngineerId,
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

      setSuccessMessage(`Account for ${name} (${role.toUpperCase()}) successfully created!`);
      setTimeout(() => {
        onClose();
      }, 1200);
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
                  ID: #{nextEngineerId}
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

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-4 space-y-3.5 text-xs">
          {/* Dynamic Auto-Generated ID Banner */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">System Generated ID</label>
            <input
              type="text"
              disabled
              value={`#${nextEngineerId}`}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-cyan-400 font-mono font-bold"
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
      </div>
    </div>
  );
};
