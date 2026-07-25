import React, { useState, useEffect } from 'react';
import { UserRole } from '../../types/fsm';
import { ShieldCheck, HardHat, Lock, Mail, ArrowRight, Flame, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLoginSuccess?: (role: UserRole, email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Inputs initialize strictly to empty strings
  const [engEmail, setEngEmail] = useState('');
  const [engPassword, setEngPassword] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Explicitly clear all state variables on mount
  useEffect(() => {
    setEngEmail('');
    setEngPassword('');
    setAdminEmail('');
    setAdminPassword('');
    setErrorMessage(null);
  }, []);

  const handleLogin = async (role: UserRole, emailVal: string, passVal: string) => {
    if (!emailVal.trim() || !passVal.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoadingRole(role);
    setErrorMessage(null);

    try {
      const assignedRole = await login(role, emailVal, passVal);
      if (onLoginSuccess) {
        onLoginSuccess(assignedRole, emailVal);
      }

      // Role-Based Navigation Redirect:
      if (assignedRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/engineer/dashboard');
      }
    } catch (err: any) {
      console.warn('Real-Time Authentication Exception:', err);
      // Display targeted error message from AuthContext
      setErrorMessage(err?.message || 'Invalid Login Credentials');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Cyber Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/20 to-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Rakhoh Corporate Branding Header */}
      <div className="text-center space-y-4 mb-8 z-10 max-w-2xl">
        <div className="flex justify-center mb-2">
          <img
            src="/assets/rakhoh-logo.svg"
            alt="RAKHOH INDUSTRIES PVT. LTD."
            className="max-h-[80px] h-20 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] transition transform hover:scale-105 duration-300"
          />
        </div>
        
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full glass-panel-glow border border-amber-500/30 text-amber-400 font-extrabold text-xs tracking-wider shadow-lg shadow-amber-500/10">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          RAKHOH INDUSTRIES PVT. LTD. &mdash; Thermal Power & Industrial Boilers
        </div>

        <h1 className="font-extrabold text-xl sm:text-3xl text-slate-100 tracking-tight">
          Boilers | Heaters | Power Projects
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Enterprise Field Service Management & High-Frequency Engineer Telematics Platform
        </p>
      </div>

      {/* Error Message Red Toast Alert */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold max-w-md w-full text-center z-10 shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dual Login Form Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
        
        {/* Card A: Engineer Login */}
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-500/50 transition duration-300 shadow-2xl relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <HardHat className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">Engineer Log In</h2>
                  <p className="text-xs text-slate-400">Mobile Field Telematics & Job Execution</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                FIELD PORTAL
              </span>
            </div>

            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin('engineer', engEmail, engPassword);
              }}
              className="space-y-3.5 text-xs pt-2"
            >
              <div>
                <label className="block text-slate-400 font-semibold mb-1">User ID / Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    id="eng_email_field"
                    name="eng_email_field"
                    autoComplete="new-email"
                    required
                    value={engEmail}
                    onChange={(e) => setEngEmail(e.target.value)}
                    placeholder="engineer@rakhoh.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    id="eng_pass_field"
                    name="eng_pass_field"
                    autoComplete="new-password"
                    required
                    value={engPassword}
                    onChange={(e) => setEngPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingRole === 'engineer'}
                className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {loadingRole === 'engineer' ? (
                  'Authenticating Real-Time...'
                ) : (
                  <>
                    Sign In as Engineer <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Card B: Admin Login */}
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-blue-500/30 flex flex-col justify-between hover:border-blue-500/50 transition duration-300 shadow-2xl relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-100">Admin Log In</h2>
                  <p className="text-xs text-slate-400">Global Map Dispatch & Operations</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-500/30">
                ADMIN CONSOLE
              </span>
            </div>

            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin('admin', adminEmail, adminPassword);
              }}
              className="space-y-3.5 text-xs pt-2"
            >
              <div>
                <label className="block text-slate-400 font-semibold mb-1">User ID / Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    id="admin_email_field"
                    name="admin_email_field"
                    autoComplete="new-email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@rakhoh.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-blue-500 focus:outline-none transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    id="admin_pass_field"
                    name="admin_pass_field"
                    autoComplete="new-password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-blue-500 focus:outline-none transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingRole === 'admin'}
                className="w-full mt-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                {loadingRole === 'admin' ? (
                  'Authenticating Real-Time...'
                ) : (
                  <>
                    Sign In as Admin <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Footer Copyright */}
      <div className="mt-10 text-center text-[11px] text-slate-500 font-medium z-10">
        © 2026 Rakhoh Industries Pvt. Ltd. All rights reserved. Powered by Firebase Realtime Database & Cloud Firestore.
      </div>
    </div>
  );
};
