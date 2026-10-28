import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Eye,
  LogIn,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setErrorMsg('Full Name is required.');
          return;
        }
        await register({ email: email.trim(), name: name.trim(), role: 'Staff' });
      } else {
        await login(email.trim());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const handlePresetLogin = async (presetEmail: string) => {
    setErrorMsg(null);
    try {
      await login(presetEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white font-bold text-3xl mx-auto">
            ♻️
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            EcoSegregate IoT
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Automated Commercial Solid Waste Segregation Optimization Dashboard for Municipal Recycling Plants
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">
              {isRegistering ? 'Register Municipal Operator' : 'Sign In to Portal'}
            </h2>
            <button
              onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(null); }}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              {isRegistering ? 'Sign In Instead' : 'Register New'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh K."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                placeholder="name@municipal.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : isRegistering ? 'Create Account' : 'Authenticate & Enter'}</span>
            </button>
          </form>

          {/* Preset 1-Click Evaluation Accounts */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block text-center">
              Quick 1-Click Evaluation Presets
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handlePresetLogin('admin@municipal.gov.in')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-rose-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Director Rajesh Sharma</span>
                    <span className="text-[10px] text-rose-300 font-mono">Role: Administrator (Full Access)</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('staff@municipal.gov.in')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Operator Ananya Deshmukh</span>
                    <span className="text-[10px] text-emerald-300 font-mono">Role: Municipal Staff (Fleet / Ops)</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('auditor@environment.org')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-blue-500/30 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Dr. Vikram Sen</span>
                    <span className="text-[10px] text-blue-300 font-mono">Role: Viewer (Read-Only Audit)</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500">
          Connected to local persistent JSON store & Cloud Firestore sync
        </p>
      </div>
    </div>
  );
};
