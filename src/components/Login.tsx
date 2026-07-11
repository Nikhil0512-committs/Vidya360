'use client';

import { useState } from 'react';
import { handleSignIn } from '@/app/actions';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Login({ onLoginSuccess, isDarkMode, toggleDarkMode }: LoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const res = await handleSignIn(email);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'User not found. Try a seed email.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (seedEmail: string) => {
    setEmail(seedEmail);
    setLoading(true);
    setError(null);
    try {
      const res = await handleSignIn(seedEmail);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Quick login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#070d19]' : 'bg-[#F8FAFC]'}`}>
      {/* Absolute Theme Toggle in top corner */}
      <div className="absolute top-4 right-6 z-20">
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-full border transition flex items-center justify-center active:scale-90 ${isDarkMode ? 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white' : 'border-slate-200 text-slate-655 hover:border-slate-400'}`}
          title={isDarkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      {/* Background radial neon glowing orbs (only in dark mode) */}
      {isDarkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-550/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        </>
      )}

      <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl relative z-10 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-2xl text-white' : 'bg-white border border-slate-200 shadow-xl text-slate-800'}`}>
        <div className="text-center">
          <a href="/" className="flex justify-center items-center gap-2.5 hover:opacity-85 transition">
            <span className={`material-symbols-outlined text-3xl font-extrabold ${isDarkMode ? 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'text-teal-650'}`}>school</span>
            <span className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-[#091426]'}`}>
              Vidya360
            </span>
          </a>
          <h2 className={`mt-5 text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>
            Fee Intelligence & Credit Layer
          </h2>
          <p className={`mt-2 text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>
            Next-gen educational FinTech, academic audits, and trust onboarding
          </p>
        </div>

        {error && (
          <div className={`px-4 py-3 rounded-lg text-xs text-center font-medium border ${isDarkMode ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="email-address" className={`text-[9px] font-bold uppercase tracking-widest block ${isDarkMode ? 'text-slate-455' : 'text-slate-400'}`}>
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold focus:outline-none transition ${isDarkMode ? 'bg-slate-800/80 border border-slate-700/80 text-white focus:ring-1 focus:ring-teal-400' : 'bg-slate-55 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-[#0D9488] focus:border-transparent'}`}
              placeholder="admin@greenwood.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-xs font-bold rounded-lg transition active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.25)]' : 'bg-[#0D9488] hover:bg-[#0f766c] text-white shadow-sm'}`}
          >
            {loading ? 'Logging in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className={`w-full border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}></div>
          </div>
          <span className={`relative px-3 text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-[#0d1524] text-slate-450' : 'bg-white text-slate-400'}`}>
            Select Demo Account
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-1">
          <button
            onClick={() => handleQuickLogin('admin@greenwood.edu')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-350 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Greenwood School Admin</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@greenwood.edu</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
              School A
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('admin@dps.edu')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-350 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Delhi Public School Admin</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@dps.edu</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-teal-950/60 text-teal-300 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
              School B
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('admin@dav.edu')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-350 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>DAV Public School Admin</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@dav.edu</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
              School C
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('ramesh@sharma.com')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Ramesh Sharma (Parent)</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ramesh@sharma.com</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-amber-950/60 text-amber-350 border-amber-850' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              Fair Rating
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('sunita@patel.com')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Sunita Patel (Parent)</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">sunita@patel.com</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-teal-950/60 text-teal-350 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
              Good Rating
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('anil@gupta.com')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Anil Gupta (Parent)</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">anil@gupta.com</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-[#1e152d] text-purple-300 border-purple-800' : 'bg-[#e8e2f7] text-[#7C3AED] border border-[#d6c7f5]'}`}>
              Excellent
            </span>
          </button>

          <button
            onClick={() => handleQuickLogin('karan@kapoor.com')}
            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl transition text-left ${isDarkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-750 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300 text-slate-700'}`}
          >
            <div>
              <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-[#091426]'}`}>Karan Kapoor (Parent)</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">karan@kapoor.com</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-red-950/60 text-red-300 border-red-900' : 'bg-red-50 text-red-700 border-red-150'}`}>
              Poor / EWS
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
