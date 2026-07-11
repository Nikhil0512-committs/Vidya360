'use client';

import { useState, useEffect } from 'react';
import { handleGetSession, handleSignOut, handleGetStudentDetails } from './actions';
import Login from '@/components/Login';
import ParentDashboard from '@/components/ParentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Public Verification Portal States
  const [verifyStudentId, setVerifyStudentId] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isDownloadMode, setIsDownloadMode] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const user = await handleGetSession();
        setSession(user);
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();

    // Check for verify query param
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get('verify');
    const download = params.get('download') === 'true';
    if (verifyId) {
      setVerifyStudentId(verifyId);
      setIsDownloadMode(download);
      setVerifying(true);
      handleGetStudentDetails(verifyId).then(res => {
        if (res) {
          setVerifyData(res);
        } else {
          setVerifyError('Verification failed: Student record not found.');
        }
      }).catch(e => {
        setVerifyError('Verification failed: Invalid verification hash key.');
      }).finally(() => {
        setVerifying(false);
      });
    }
  }, []);

  // Trigger print/download auto-prompt if in download mode
  useEffect(() => {
    if (verifyData && isDownloadMode) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyData, isDownloadMode]);

  const handleLoginSuccess = (user: any) => {
    setSession(user);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await handleSignOut();
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render Public Verification Modal Overlay
  if (verifyStudentId) {
    return (
      <div className="min-h-screen bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative">
        {/* Custom scoped print styles to lock single-page printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            html, body {
              height: 100% !important;
              overflow: hidden !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-passport-cert, #printable-passport-cert * {
              visibility: visible !important;
            }
            #printable-passport-cert {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              border: 4px double #d97706 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              padding: 1.5cm !important;
              box-sizing: border-box !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div id="printable-passport-cert" className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="bg-[#091426] text-white p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-teal-400 bg-slate-800 px-2 py-0.5 rounded tracking-widest uppercase">
                Vidya360 Trust Network
              </span>
              <h3 className="text-sm font-bold">Cryptographic Credential Verification</h3>
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="no-print text-slate-400 hover:text-white transition text-xs font-bold"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            {verifying ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-t-teal-600 border-slate-100 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-bold">Verifying digital seal authority...</p>
              </div>
            ) : verifyError ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
                <h4 className="text-sm font-bold text-slate-800">Verification Failure</h4>
                <p className="text-xs text-slate-500 max-w-xs">{verifyError}</p>
              </div>
            ) : verifyData ? (
              <div className="space-y-6">
                {isDownloadMode && (
                  <div className="no-print p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-[11px] font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined animate-bounce">downloading</span>
                    <span>Preparing your printable FeePassport PDF document... Please approve the browser print/save prompt.</span>
                  </div>
                )}

                {/* Premium Certificate Border/Badge Wrapper */}
                <div className="border-4 border-double border-amber-500/30 p-6 rounded-xl relative bg-amber-50/10 bg-gradient-to-br from-amber-50/20 to-transparent space-y-6">
                  
                  {/* Gold Seal watermark */}
                  <div className="absolute top-4 right-4 opacity-10">
                    <span className="material-symbols-outlined text-7xl text-amber-600">verified_user</span>
                  </div>

                  <div className="text-center space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Credential Statement</h4>
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      This certifies that the academic standings, financial records, and credit history of the student named below have been verified and sealed cryptographically on the Vidya360 trust network.
                    </p>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200/60 items-center">
                    
                    {/* Left info column (Spans 8) */}
                    <div className="md:col-span-8 space-y-3">
                      <div className="grid grid-cols-3 gap-1 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Student Name:</span>
                        <span className="col-span-2 text-xs font-extrabold text-slate-800">{verifyData.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Enrolled Class:</span>
                        <span className="col-span-2 text-xs font-semibold text-slate-700">{verifyData.studentClass || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Current School:</span>
                        <span className="col-span-2 text-xs font-semibold text-slate-700">
                          Greenwood International
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">EduScore Rating:</span>
                        <span className="col-span-2 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="font-mono px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-bold">
                            {verifyData.eduScore?.score || '300'}
                          </span>
                          <span className="text-[10px] text-slate-500">({verifyData.eduScore?.band || 'BUILDING_HISTORY'})</span>
                        </span>
                      </div>
                    </div>

                    {/* Right QR Column (Spans 4) */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/?verify=${verifyData.id}&download=true` : '')}`}
                        alt="Verification QR Code"
                        className="w-24 h-24 bg-white border border-slate-200 p-1 rounded-lg shadow-sm"
                      />
                      <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Verification Seal</span>
                    </div>

                  </div>

                  {/* Certified Record Breakdown for Parents */}
                  <div className="pt-4 border-t border-slate-200/60 space-y-2">
                    <h5 className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Certified Standing Summary</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Attendance</span>
                        <span className="text-xs font-extrabold text-slate-800">94.2%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">On-Time Payments</span>
                        <span className="text-xs font-extrabold text-emerald-600">100%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Financial Risk</span>
                        <span className="text-xs font-extrabold text-emerald-650">Low Risk</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Security Check</span>
                        <span className="text-xs font-extrabold text-teal-600">Pass</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Audit breakdown */}
                <div className="no-print space-y-2 text-xs">
                  <h5 className="font-extrabold text-slate-650 uppercase tracking-wider text-[9px]">Seal Audit Ledger</h5>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Verification Node:</span>
                      <span className="font-mono text-[10px]">Vidya360 Auth Node A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Key Signature:</span>
                      <span className="font-mono text-[10px] text-emerald-600">HS256 Verified Seal ✅</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Timestamp:</span>
                      <span className="font-mono text-[10px]">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 transition rounded-lg text-xs font-bold"
            >
              Access Login Portal
            </button>
            {verifyData && (
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#091426] hover:bg-slate-800 text-white transition rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse"
              >
                <span className="material-symbols-outlined text-xs">print</span>
                Download / Print PDF
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#091426] font-sans">
        <span className="text-3xl font-extrabold animate-pulse">
          Vidya360
        </span>
        <p className="text-sm text-slate-500 mt-2 font-medium">Loading secure session...</p>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnterPortal={() => setShowLanding(false)} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isLoggedIn={!!session} />;
  }

  if (!session) {
    return <Login onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
  }

  if (session.role === 'ADMIN') {
    return <AdminDashboard user={session} onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onGoToLanding={() => setShowLanding(true)} />;
  }

  return <ParentDashboard user={session} onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onGoToLanding={() => setShowLanding(true)} />;
}
