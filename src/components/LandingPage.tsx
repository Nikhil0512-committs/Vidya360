'use client';

import { useState } from 'react';

interface LandingPageProps {
  onEnterPortal: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LandingPage({ onEnterPortal, isDarkMode, toggleDarkMode }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'passport' | 'score' | 'escrow'>('passport');

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans relative overflow-hidden flex flex-col selection:bg-teal-500/30 selection:text-teal-200 ${isDarkMode ? 'bg-[#030303] text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Premium CSS Keyframe Animations & Micro-Interactions */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtle-fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes subtle-scale-in {
          0% {
            opacity: 0;
            transform: scale(0.98);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-up {
          animation: subtle-fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-scale {
          animation: subtle-scale-in 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-delay-1 {
          animation-delay: 100ms;
        }
        .animate-delay-2 {
          animation-delay: 200ms;
        }
        .animate-delay-3 {
          animation-delay: 300ms;
        }
        
        .bento-card {
          position: relative;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)'};
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: ${isDarkMode ? 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent, rgba(255,255,255,0.05))' : 'linear-gradient(135deg, rgba(0,0,0,0.05), transparent, rgba(0,0,0,0.02))'};
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.5;
          transition: opacity 0.4s ease;
        }
        .bento-card:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
          transform: translateY(-2px);
        }
        .bento-card:hover::before {
          opacity: 1;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#030303' : '#fafafa'};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#222' : '#ccc'};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#333' : '#bbb'};
        }
      `}} />

      {/* Grid Overlay Pattern (Linear/Stripe style) */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(${isDarkMode ? '255,255,255' : '0,0,0'},0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(${isDarkMode ? '255,255,255' : '0,0,0'},0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none`} />

      {/* Header / Navbar */}
      <header className={`border-b transition-colors duration-500 sticky top-0 z-50 backdrop-blur-lg ${isDarkMode ? 'border-white/[0.06] bg-[#030303]/75' : 'border-slate-200/80 bg-white/75'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className={`text-sm font-extrabold tracking-[0.2em] uppercase cursor-pointer transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`} onClick={() => window.location.reload()}>
            Vidya360
          </div>
          <nav className={`hidden md:flex items-center gap-8 text-[11px] font-bold tracking-widest transition-colors ${isDarkMode ? 'text-neutral-450' : 'text-slate-500'}`}>
            <a href="#features" className="hover:text-teal-500 transition duration-200">FEATURES</a>
            <a href="#pricing" className="hover:text-teal-500 transition duration-200">PRICING</a>
            <a href="#infrastructure" className="hover:text-teal-500 transition duration-200">INFRASTRUCTURE</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button at top */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full border transition flex items-center justify-center active:scale-90 ${isDarkMode ? 'border-white/[0.08] hover:border-white/30 text-white' : 'border-slate-200 hover:border-slate-400 text-slate-800'}`}
              title={isDarkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button 
              onClick={onEnterPortal}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition duration-300 active:scale-95 ${isDarkMode ? 'border border-white/[0.08] hover:border-white/30 hover:bg-white hover:text-black' : 'border border-slate-250 hover:bg-slate-900 hover:text-white'}`}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (Shifted a bit above by reducing padding-top) */}
      <main className="flex-grow">
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 md:pt-20 md:pb-28 text-center space-y-7 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-neutral-450 text-[10px] font-bold tracking-wider animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse"></span>
            PROVABLE FINANCIAL TRUST FOR INSTITUTIONS
          </div>
          
          <h1 className={`text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.05] animate-fade-up animate-delay-1 select-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            The unified trust layer <br />
            <span className={isDarkMode ? 'text-neutral-400' : 'text-slate-450'}>for education.</span>
          </h1>
          
          <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed font-medium animate-fade-up animate-delay-2 transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
            Vidya360 introduces credit portability and sibling-isolated scoring. Cryptographically seal billing credentials, disburse endowment escrows, and audit histories.
          </p>
          
          <div className="pt-3 flex justify-center gap-4 animate-fade-up animate-delay-3">
            <button 
              onClick={onEnterPortal}
              className={`px-6 py-3 rounded-full text-xs font-bold transition duration-300 transform active:scale-95 ${isDarkMode ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_4px_25px_rgba(255,255,255,0.15)]' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_25px_rgba(0,0,0,0.1)]'}`}
            >
              Access Portal
            </button>
            <a 
              href="#features"
              className={`px-6 py-3 border rounded-full text-xs font-bold transition duration-300 flex items-center justify-center ${isDarkMode ? 'border-white/[0.08] hover:border-white/20 bg-white/[0.01] text-white' : 'border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-800'}`}
            >
              Read Documentation
            </a>
          </div>
        </section>

        {/* Dynamic Interactive Showroom Section */}
        <section className="max-w-5xl mx-auto px-6 py-6 animate-scale">
          <div className={`border transition-colors duration-500 rounded-2xl p-6 md:p-8 space-y-6 ${isDarkMode ? 'bg-neutral-950/60 border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex flex-wrap justify-center gap-2 md:gap-4 border-b pb-4 ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-100'}`}>
              <button
                onClick={() => setActiveTab('passport')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition duration-300 ${activeTab === 'passport' ? (isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'text-neutral-450 hover:text-teal-555'}`}
              >
                FeePassport™ Transfer
              </button>
              <button
                onClick={() => setActiveTab('score')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition duration-300 ${activeTab === 'score' ? (isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'text-neutral-450 hover:text-teal-555'}`}
              >
                EduScore™ Ledger
              </button>
              <button
                onClick={() => setActiveTab('escrow')}
                className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition duration-300 ${activeTab === 'escrow' ? (isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white') : 'text-neutral-450 hover:text-teal-555'}`}
              >
                Escrow Endowments
              </button>
            </div>

            {/* Interactive Tab Renderings */}
            <div className="min-h-[220px] flex flex-col justify-center">
              {activeTab === 'passport' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-up">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block">// PORTABILITY MODULE</span>
                    <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Cryptographic Certificate Porting</h3>
                    <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Ensure families carrying clean records don't face repeated verification friction. The FeePassport seals historical balances and ratings with institutional private keys, transferrable via a simple scan.
                    </p>
                  </div>
                  <div className={`border p-5 rounded-xl font-mono text-[10px] space-y-2.5 transition-colors ${isDarkMode ? 'bg-[#0b0b0b] border-white/[0.05] text-neutral-450' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <div className={`flex justify-between border-b pb-2 ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-200'}`}>
                      <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>STATUS: SEALED</span>
                      <span className="text-emerald-500 font-bold">AUTHENTIC ✅</span>
                    </div>
                    <div>
                      <span className="text-neutral-450">Issuer Key:</span> <span className={isDarkMode ? 'text-white font-semibold' : 'text-slate-800 font-semibold'}>Greenwood_Acad_2026</span>
                    </div>
                    <div>
                      <span className="text-neutral-450">Holder ID:</span> <span className={isDarkMode ? 'text-white font-semibold' : 'text-slate-800 font-semibold'}>stud-aarav</span>
                    </div>
                    <div>
                      <span className="text-neutral-450">Signature:</span> <span className={`block truncate px-2 py-1 mt-1 rounded text-[9px] ${isDarkMode ? 'bg-neutral-900 text-neutral-450' : 'bg-slate-200 text-slate-655'}`}>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJHcmVlbndvb2Q...</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'score' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-up">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-teal-500 uppercase tracking-widest block">// RISK ISOLATION</span>
                    <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sibling-Isolated Standings</h3>
                    <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Traditional score trackers penalize the entire household. Vidya360 segregates track records to individual sibling streams, safeguarding scholarship eligibilities and payment installment terms.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`border p-4 rounded-xl text-center space-y-1 transition-colors ${isDarkMode ? 'bg-[#0b0b0b] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[8px] font-bold text-neutral-550 uppercase block">Sibling A (Aarav)</span>
                      <span className="text-xl font-extrabold text-emerald-500 font-mono">810</span>
                      <span className={`text-[9px] block font-semibold ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Low Risk / Excellent</span>
                    </div>
                    <div className={`border p-4 rounded-xl text-center space-y-1 transition-colors ${isDarkMode ? 'bg-[#0b0b0b] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-[8px] font-bold text-neutral-550 uppercase block">Sibling B (Rohan)</span>
                      <span className="text-xl font-extrabold text-amber-500 font-mono">680</span>
                      <span className={`text-[9px] block font-semibold ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Medium Risk / Good</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'escrow' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-up">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">// LIQUIDITY MANAGEMENT</span>
                    <h3 className={`text-lg font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Endowment Escrow Settlement</h3>
                    <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                      Alumni funding pools are kept in secure interest-bearing trust accounts yielding 6.5% APY. The school admin can disburse funds to automatically settle outstanding invoices with direct audit trails.
                    </p>
                  </div>
                  <div className={`border p-5 rounded-xl space-y-3 transition-colors ${isDarkMode ? 'bg-[#0b0b0b] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className={isDarkMode ? 'text-neutral-400' : 'text-slate-500'}>Total Endowment Pool:</span>
                      <span className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹75,400.00</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className={isDarkMode ? 'text-neutral-400' : 'text-slate-500'}>Escrow Yield (6.5% APY):</span>
                      <span className="font-mono text-emerald-500 font-bold">+₹4,901.00</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-neutral-900' : 'bg-slate-200'}`}>
                      <div className={`h-full w-[70%] rounded-full ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bento Grid Layout Section */}
        <section id="features" className="max-w-5xl mx-auto px-6 py-20 space-y-14">
          <div className="text-center space-y-3">
            <h2 className={`text-2xl md:text-4xl font-extrabold tracking-tight select-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Clean tech stack, deep capability.</h2>
            <p className="text-xs text-neutral-500 font-bold tracking-widest uppercase">Every capability designed with structural excellence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1 (Wide card) */}
            <div className="bento-card md:col-span-2 p-8 rounded-2xl flex flex-col justify-between min-h-[200px]">
              <span className={`material-symbols-outlined text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>safety_check</span>
              <div className="space-y-2 mt-6">
                <h3 className={`text-base font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Cryptographic Verification</h3>
                <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  No databases or cloud endpoints are consulted to verify student standing. The signature verification uses robust JWT HMAC-SHA256 tokens validated directly inside the user's browser runtime.
                </p>
              </div>
            </div>

            {/* Bento Card 2 (Standard card) */}
            <div className="bento-card p-8 rounded-2xl flex flex-col justify-between min-h-[200px]">
              <span className={`material-symbols-outlined text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>monitoring</span>
              <div className="space-y-2 mt-6">
                <h3 className={`text-base font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dynamic Scoring</h3>
                <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Custom mathematical models recompute student risk and standing immediately after every payment activity, bypassing scholarship grants to protect ratings.
                </p>
              </div>
            </div>

            {/* Bento Card 3 (Standard card) */}
            <div className="bento-card p-8 rounded-2xl flex flex-col justify-between min-h-[200px]">
              <span className={`material-symbols-outlined text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>query_stats</span>
              <div className="space-y-2 mt-6">
                <h3 className={`text-base font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Early-Warnings</h3>
                <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Tracks gaps in attendance and delays in billing to flag counseling requirements before dropouts manifest.
                </p>
              </div>
            </div>

            {/* Bento Card 4 (Wide card) */}
            <div className="bento-card md:col-span-2 p-8 rounded-2xl flex flex-col justify-between min-h-[200px]">
              <span className={`material-symbols-outlined text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>volunteer_activism</span>
              <div className="space-y-2 mt-6">
                <h3 className={`text-base font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Alumni-Directed Settlements</h3>
                <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Alumni endowment trust funds disburse straight to invoice ledgers, triggering automatic real-time push alerts to parent portals without delay.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Ultra-Minimal Pricing Section */}
        <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-white/[0.04] space-y-12">
          <div className="text-center space-y-3">
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight select-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Clean. Transparent.</h2>
            <p className="text-xs text-neutral-500 font-bold tracking-widest uppercase">All features unlocked for hackathon review</p>
          </div>

          <div className="flex justify-center">
            <div className={`w-full max-w-sm p-8 border rounded-2xl relative space-y-8 transition duration-300 ${isDarkMode ? 'bg-white/[0.01] border-white/[0.08] hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-350 shadow-sm'}`}>
              <div className={`absolute top-[-10px] right-6 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isDarkMode ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
                COMMUNITY PLAN
              </div>

              <div className="space-y-1 text-center">
                <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest">Hackathon Edition</h3>
                <span className={`text-5xl font-black font-mono transition-colors ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>₹0</span>
                <span className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider mt-1">Free Forever</span>
              </div>

              <ul className={`space-y-4 text-xs font-semibold border-t pt-6 transition-colors ${isDarkMode ? 'text-neutral-350 border-white/[0.06]' : 'text-slate-600 border-slate-100'}`}>
                <li className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>check</span>
                  <span>Verifiable JWT FeePassports</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>check</span>
                  <span>Isolated Sibling EduScores</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>check</span>
                  <span>Active Yield Escrow Ledger (6.5% APY)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>check</span>
                  <span>AI counselor dispatch indicators</span>
                </li>
              </ul>

              <button 
                onClick={onEnterPortal}
                className={`w-full py-3.5 rounded-full text-xs font-bold transition duration-300 transform active:scale-95 ${isDarkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                Access System Now
              </button>
            </div>
          </div>
        </section>

        {/* Security Infrastructure (Linear style console block) */}
        <section id="infrastructure" className={`max-w-5xl mx-auto px-6 py-20 border-t space-y-10 transition-colors ${isDarkMode ? 'border-white/[0.04]' : 'border-slate-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">SECURITY SCHEMAS</span>
              <h2 className={`text-xl md:text-3xl font-extrabold tracking-tight leading-tight select-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Cryptographic Integrity & Decentralized Validation
              </h2>
              <p className={`text-xs leading-relaxed font-semibold transition-colors ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                Vidya360 utilizes standard JSON Web Tokens (JWT) signed with secure HMAC-SHA256 algorithms using unique institutional private keys. Student academic histories and credit standings are sealed cryptographically, ensuring that external admission systems can instantly verify record authenticity on our public ledger interface without intermediate databases.
              </p>
            </div>
            <div className={`border p-6 rounded-2xl shadow-2xl space-y-3 font-mono text-[9px] select-all max-h-48 overflow-y-auto transition-colors ${isDarkMode ? 'bg-black/80 border-white/[0.06] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <span className="text-emerald-500 font-bold block">// Verification Node Security Seal Check:</span>
              <span>Header: &#123; "alg": "HS256", "typ": "JWT" &#125;<br /></span>
              <span>Payload: &#123; "iss": "Greenwood International", "eduScore": 820, "band": "EXCELLENT", "status": "VERIFIED" &#125;<br /></span>
              <span className="text-teal-500 font-bold block mt-3">Signature Verified:</span>
              <span className="break-all text-slate-400">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJHcmVlbndvb2Q...</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t py-12 text-center text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${isDarkMode ? 'border-white/[0.04] text-neutral-600' : 'border-slate-200 text-slate-400'}`}>
        © 2026 Vidya360. Built for Next-Gen Educational Trust.
      </footer>
    </div>
  );
}
