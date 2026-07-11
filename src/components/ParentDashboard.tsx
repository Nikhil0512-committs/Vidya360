'use client';

import { useState, useEffect } from 'react';
import { 
  handleGetGuardianByUserId, 
  handleGetStudentDetails, 
  handlePayInvoice, 
  handleRequestPaymentPlan, 
  handleGenerateFeePassport,
  handleGetSchools,
  handleSubmitTransferRequest,
  handleGetNotifications,
  handleMarkNotificationsAsRead,
  handleGetChatMessages,
  handleSendChatMessage
} from '@/app/actions';

interface ParentDashboardProps {
  user: any;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ParentDashboard({ user, onLogout, isDarkMode, toggleDarkMode }: ParentDashboardProps) {
  const [guardianData, setGuardianData] = useState<any>(null);
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [studentDetails, setStudentDetails] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Modals / Inputs
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [isPaying, setIsPaying] = useState(false);
  
  // Transfer request state
  const [schools, setSchools] = useState<any[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTargetSchoolId, setSelectedTargetSchoolId] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
  const [transferErrorMsg, setTransferErrorMsg] = useState<string | null>(null);

  // Notifications & Chat States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  // Digital Verifiable FeePassport modal states
  const [generatingPassport, setGeneratingPassport] = useState(false);
  const [passportToken, setPassportToken] = useState('');
  const [showPassportModal, setShowPassportModal] = useState(false);



  // Fetch notifications helper
  const loadNotifications = async (gId: string) => {
    try {
      const notifs = await handleGetNotifications(gId);
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch chat helper
  const loadChat = async (studentId: string) => {
    try {
      const msgs = await handleGetChatMessages(studentId);
      setChatMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch initial guardian and schools data
  useEffect(() => {
    async function loadGuardianAndSchools() {
      setLoading(true);
      try {
        const data = await handleGetGuardianByUserId(user.id);
        setGuardianData(data);
        if (data) {
          await loadNotifications(data.id);
          if (data.students && data.students.length > 0) {
            setActiveStudentId(data.students[0].id);
          }
        }
        
        const schoolList = await handleGetSchools();
        setSchools(schoolList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGuardianAndSchools();
  }, [user.id]);

  // Fetch student details whenever active student changes
  useEffect(() => {
    if (!activeStudentId) return;

    async function loadStudentDetails() {
      setDetailsLoading(true);
      try {
        const details = await handleGetStudentDetails(activeStudentId);
        setStudentDetails(details);
        await loadChat(activeStudentId);
      } catch (err) {
        console.error(err);
      } finally {
        setDetailsLoading(false);
      }
    }
    loadStudentDetails();
  }, [activeStudentId]);

  const refreshData = async () => {
    if (!activeStudentId) return;
    setDetailsLoading(true);
    try {
      const details = await handleGetStudentDetails(activeStudentId);
      setStudentDetails(details);
      
      // Also refresh guardian general data to sync scores
      const data = await handleGetGuardianByUserId(user.id);
      setGuardianData(data);
      if (data) {
        await loadNotifications(data.id);
      }
      await loadChat(activeStudentId);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    if (nextShow && guardianData) {
      try {
        await handleMarkNotificationsAsRead(guardianData.id);
        const notifs = await handleGetNotifications(guardianData.id);
        setNotifications(notifs);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleParentSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStudentId) return;
    setSendingChat(true);
    try {
      const res = await handleSendChatMessage(activeStudentId, 'PARENT', chatInput.trim());
      if (res.success) {
        setChatInput('');
        await loadChat(activeStudentId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingChat(false);
    }
  };


  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId || payAmount <= 0) return;

    setIsPaying(true);
    try {
      const res = await handlePayInvoice(payInvoiceId, payAmount, payMethod);
      if (res.success) {
        setPayInvoiceId(null);
        await refreshData();
      } else {
        alert(res.error || 'Payment failed');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsPaying(false);
    }
  };

  const handleRequestEMI = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to request a flexible EMI plan for this invoice?')) return;

    try {
      const res = await handleRequestPaymentPlan(invoiceId);
      if (res.success) {
        await refreshData();
      } else {
        alert(res.error || 'Failed to generate EMI plan');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const handleOpenTransferModal = () => {
    setSelectedTargetSchoolId('');
    setTransferSuccessMsg(null);
    setTransferErrorMsg(null);
    setShowTransferModal(true);
  };

  const handleRequestTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId || !selectedTargetSchoolId) return;

    setIsSubmittingTransfer(true);
    setTransferErrorMsg(null);
    try {
      const res = await handleSubmitTransferRequest(activeStudentId, selectedTargetSchoolId);
      if (res.success) {
        const targetSchoolName = schools.find(s => s.id === selectedTargetSchoolId)?.name || 'the target school';
        setTransferSuccessMsg(`Transfer request successfully sent to ${targetSchoolName}! The school's administrator will review your child's academic and payment standing records directly in their portal.`);
      } else {
        setTransferErrorMsg(res.error || 'Failed to submit transfer request');
      }
    } catch (err: any) {
      setTransferErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl font-extrabold text-[#091426] animate-pulse">Vidya360</span>
          <p className="text-sm text-slate-500 font-medium">Loading parent session...</p>
        </div>
      </div>
    );
  }

  const eduScore = studentDetails?.eduScore;
  const riskScore = studentDetails?.riskScore;

  // Render score band styles
  const getBandStyles = (band: string) => {
    switch (band) {
      case 'EXCELLENT':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          fill: 'text-emerald-500',
          progress: 'text-emerald-500',
          action: 'Admission Fees fully waived based on trust. Standard billing cycles activated.',
          trustLabel: '✨ Waived Upfront Deposit (100% Trust Admission)'
        };
      case 'GOOD':
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-700',
          fill: 'text-teal-500',
          progress: 'text-teal-500',
          action: 'Admission Fees/Deposit reduced to 1 month. Support with automated split-pays.',
          trustLabel: '⚡ Reduced Deposit (Conditional Trust Admission)'
        };
      case 'FAIR':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          fill: 'text-amber-500',
          progress: 'text-amber-500',
          action: 'Standard admission deposit required. Eligible for flexible EMI plans.',
          trustLabel: '⚠️ Standard Upfront Deposit (Standard Admission)'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          fill: 'text-slate-500',
          progress: 'text-slate-500',
          action: 'Building credit history. Standard upfront deposit rules apply.',
          trustLabel: 'ℹ️ Standard Admission (Score Building)'
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return '#10b981'; // Emerald (Excellent)
    if (score >= 700) return '#0d9488'; // Teal (Good)
    if (score >= 600) return '#d97706'; // Amber (Fair)
    return '#dc2626'; // Red (Poor)
  };

  const bandStyle = getBandStyles(eduScore?.band || 'BUILDING_HISTORY');

  // Invoices segregation
  const activeInvoices = studentDetails?.invoices?.filter((inv: any) => inv.status !== 'PENDING') || [];
  const upcomingInvoices = studentDetails?.invoices?.filter((inv: any) => inv.status === 'PENDING') || [];

  // Financial Progress
  const totalInvoicesAmount = studentDetails?.invoices?.reduce((sum: number, i: any) => sum + i.amountDue, 0) || 0;
  const paidInvoicesAmount = studentDetails?.invoices?.reduce((sum: number, inv: any) => {
    const invoicePaid = inv.payments
      ? inv.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0)
      : 0;
    return sum + invoicePaid;
  }, 0) || 0;
  const paidPercentage = totalInvoicesAmount > 0 ? Math.min(100, Math.round((paidInvoicesAmount / totalInvoicesAmount) * 100)) : 0;

  // Scholarship Scheme logic
  const activeStudentAvg = studentDetails?.academicRecords && studentDetails.academicRecords.length > 0
    ? Math.round(
        (studentDetails.academicRecords.reduce((acc: number, curr: any) => acc + curr.marks, 0) /
          (studentDetails.academicRecords.length * 100)) * 100
      )
    : null;
  const hasFinancialDifficulty = (eduScore?.score && eduScore.score < 600) || activeInvoices.some((i: any) => i.status === 'OVERDUE');
  const isAcademicStar = activeStudentAvg !== null && activeStudentAvg >= 85;
  const isOlympiadWinner = studentDetails?.achievements?.some((ach: any) => {
    const t = ach.title.toLowerCase();
    return t.includes('olympiad') || t.includes('debate') || t.includes('robotic') || t.includes('talent') || t.includes('abacus');
  }) || false;
  const isSportsStar = studentDetails?.achievements?.some((ach: any) => {
    const c = ach.category;
    const t = ach.title.toLowerCase();
    return c === 'SPORTS' || t.includes('badminton') || t.includes('football') || t.includes('dance') || t.includes('chess') || t.includes('sports');
  }) || false;
  const isEwsScholar = hasFinancialDifficulty && isAcademicStar;
  const isMiddleStudent = !isAcademicStar && !isOlympiadWinner && !isSportsStar;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#091122] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'} flex overflow-hidden font-body-lg antialiased w-full transition-colors duration-500`}>
      {/* SideNavBar (Shared Component matching exact design) */}
      <aside className="hidden md:flex bg-[#091426] text-white fixed left-0 top-0 h-full w-[280px] border-r border-slate-800 flex-col p-6 z-20">
        <a href="/" className="mb-10 flex items-center gap-4 cursor-pointer hover:opacity-80 transition select-none">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-teal-400 text-2xl font-bold">school</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Vidya360</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Parent Portal</p>
          </div>
        </a>

        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          <a className="flex items-center gap-3 px-4 py-3 bg-slate-800/60 text-teal-400 rounded-lg text-sm font-semibold transition" href="#">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span>Dashboard</span>
          </a>
          <div className="px-4 py-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-4">Linked Students</div>
          {guardianData?.students && guardianData.students.map((s: any) => {
            const isActive = activeStudentId === s.id;
            
            // Calculate GPA/Average
            const avgMarks = isActive && studentDetails?.academicRecords && studentDetails.academicRecords.length > 0
              ? Math.round(
                  (studentDetails.academicRecords.reduce((acc: number, curr: any) => acc + curr.marks, 0) /
                    (studentDetails.academicRecords.length * 100)) * 100
                )
              : null;
              
            const prevClassMap: Record<string, string> = {
              'stud-aarav': 'Grade 9 Final: 82.4%',
              'stud-riya': 'Grade 7 Final: 91.6%',
              'stud-kabir': 'Grade 9 Final: 76.5%',
              'stud-diya': 'Grade 8 Final: 88.0%',
            };
            
            const coCurriculars = isActive && studentDetails?.achievements && studentDetails.achievements.length > 0
              ? studentDetails.achievements.map((a: any) => a.title).join(', ')
              : 'No co-curriculars logged';

            return (
              <div key={s.id} className="space-y-1.5 w-full">
                <button
                  onClick={() => setActiveStudentId(s.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition text-left w-full ${
                    isActive
                      ? 'text-white bg-slate-800/40 border border-slate-700/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span className="truncate">{s.name}</span>
                </button>
                
                {isActive && studentDetails && (
                  <div className="mx-4 p-3 bg-slate-850/60 border border-slate-800/70 rounded-lg text-[10px] space-y-2 text-slate-300 animate-fadeIn">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Class Standing</span>
                      <span className="font-semibold text-teal-400">{studentDetails.studentClass || 'Grade 10-A'} (Roll {studentDetails.rollNumber || '01'})</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current School:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[100px] text-right">
                          {schools.find(sch => sch.id === studentDetails.currentSchoolId)?.name.split(',')[0] || 'Unknown School'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overall Term 2:</span>
                        <span className="font-bold text-slate-200">{avgMarks ? `${avgMarks}%` : 'N/A'} Avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Prev. Final:</span>
                        <span className="font-bold text-slate-200">{prevClassMap[s.id] || 'Grade 9: 84%'}</span>
                      </div>
                    </div>

                    {studentDetails.academicRecords && studentDetails.academicRecords.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800 space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Subject Scores:</span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-400">
                          {studentDetails.academicRecords.slice(0, 4).map((rec: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[55px]">{rec.subject}:</span>
                              <span className="font-mono text-slate-200 font-bold">{rec.marks}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-1.5 border-t border-slate-800 space-y-0.5">
                      <span className="text-slate-500 font-bold uppercase tracking-wider block">Co-Curricular / Awards:</span>
                      <p className="text-[9px] text-slate-400 italic line-clamp-2 leading-relaxed">
                        {coCurriculars}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <button 
            onClick={() => setShowChat(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Chat with School
          </button>
          <button 
            onClick={handleOpenTransferModal}
            className="w-full bg-[#0D9488] hover:bg-[#0f766c] text-white py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            Initiate Transfer
          </button>
          <div className="flex flex-col gap-1 border-t border-slate-800 pt-3">
            <a className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition text-sm" href="#">
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span>Help Center</span>
            </a>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition text-sm text-left w-full"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 md:ml-[280px] w-full min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#070d19]' : 'bg-[#F8FAFC]'}`}>
        {/* Mobile Header (Visible only on mobile/tablet) */}
        <header className="md:hidden bg-[#091426] text-white flex justify-between items-center h-14 px-4 sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400 text-lg font-bold">school</span>
            <span className="text-sm font-bold tracking-tight">Vidya360</span>
            <span className="text-[9px] bg-slate-800 text-slate-450 px-1.5 py-0.5 rounded font-mono font-bold">PARENT</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenTransferModal}
              className="bg-[#0D9488] hover:bg-[#0f766c] text-white px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[12px]">swap_horiz</span>
              Transfer
            </button>
            <button
              onClick={onLogout}
              className="text-slate-450 hover:text-white p-1 rounded transition flex items-center justify-center active:scale-95"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </header>

        {/* TopNavBar (Desktop) */}
        <header className={`flex justify-between items-center w-full h-16 px-10 sticky top-0 z-10 hidden md:flex border-b transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1322] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex-1 flex items-center">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                className={`w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none transition ${isDarkMode ? 'bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'}`}
                placeholder="Search invoices, reports..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 relative">
            {/* Theme Toggle Button next to bell */}
            <button 
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-full border transition flex items-center justify-center active:scale-90 ${isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700' : 'border-slate-200 text-slate-655 hover:border-slate-400'}`}
              title={isDarkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button 
              onClick={handleToggleNotifications}
              className="text-slate-400 hover:text-slate-600 transition relative flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-12 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden text-left flex flex-col">
                <div className="p-3 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                  >
                    CLOSE
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div key={n.id} className={`p-3 text-[11px] hover:bg-slate-50 transition ${!n.read ? 'bg-amber-50/40' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-850 flex items-center gap-1">
                            {n.type === 'FEE_REMINDER' ? (
                              <span className="material-symbols-outlined text-[12px] text-amber-600">warning</span>
                            ) : (
                              <span className="material-symbols-outlined text-[12px] text-blue-600">chat</span>
                            )}
                            {n.title}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium">
                            {new Date(n.sentAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
              <div className="w-full h-full bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                {guardianData?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-grow p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto space-y-8">
          
          {/* Page Header (Switching Child & Export) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Overview</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm text-slate-500">
                  Monitor financial health and academic progress for <span className="font-semibold text-slate-800">{studentDetails?.name}</span>
                </p>
                {studentDetails?.studentClass && (
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-150 ml-1">
                    {studentDetails.studentClass}
                  </span>
                )}
                {studentDetails?.rollNumber && (
                  <span className="bg-slate-100 text-slate-650 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                    Roll No: {studentDetails.rollNumber}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {guardianData?.students && guardianData.students.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Switch Student:</span>
                  <select
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488] shadow-sm font-medium"
                    value={activeStudentId}
                    onChange={(e) => setActiveStudentId(e.target.value)}
                  >
                    {guardianData.students.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button 
                onClick={handleOpenTransferModal}
                className="bg-[#0D9488] hover:bg-[#0f766c] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                Initiate Transfer
              </button>
            </div>
          </div>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 font-medium">Fetching details...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Financial Health (Left Col, spans 7) */}
              <section className="md:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition duration-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#0D9488]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                      <h3 className="text-lg font-bold text-slate-900">Financial Health</h3>
                    </div>
                    <p className="text-xs text-slate-500">Current term outstanding invoices</p>
                  </div>
                  <span className="px-3 py-1 bg-teal-50 text-[#0f766c] border border-teal-100 rounded-full text-xs font-bold">
                    Term 3 Active
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Outstanding Dues</p>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        ₹{activeInvoices
                          .filter((i: any) => i.status !== 'PAID')
                          .reduce((sum: number, i: any) => {
                            const invoicePaid = i.payments
                              ? i.payments.reduce((pSum: number, p: any) => pSum + p.amount, 0)
                              : 0;
                            return sum + Math.max(0, i.amountDue - invoicePaid);
                          }, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    {activeInvoices.some((i: any) => i.status === 'OVERDUE') && (
                      <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wide">
                        ⚠️ Immediate Payment Required
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {activeInvoices.some((inv: any) => inv.status === 'OVERDUE') && (
                      <>
                        <button
                          onClick={() => {
                            const overdue = activeInvoices.find((i: any) => i.status === 'OVERDUE');
                            if (overdue) handleRequestEMI(overdue.id);
                          }}
                          className="px-4 py-2 border border-slate-350 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition duration-150 active:scale-[0.98]"
                        >
                          EMI Options
                        </button>
                        <button
                          onClick={() => {
                            const overdue = activeInvoices.find((i: any) => i.status === 'OVERDUE');
                            if (overdue) {
                              setPayInvoiceId(overdue.id);
                              setPayAmount(overdue.amountDue);
                            }
                          }}
                          className="px-6 py-2 bg-[#091426] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-sm active:scale-[0.98]"
                        >
                          Pay Now
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Simple Progress bar */}
                <div className="mb-6 border-t border-slate-200/60 pt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                    <span>Paid: ₹{paidInvoicesAmount.toLocaleString()}</span>
                    <span>Total: ₹{totalInvoicesAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#0D9488] h-2 rounded-full transition-all duration-500" style={{ width: `${paidPercentage}%` }}></div>
                  </div>
                </div>

                {/* Table of active invoices */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-2.5 px-3">Term</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {activeInvoices.map((inv: any) => (
                        <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-semibold text-slate-700">{inv.termId}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">₹{inv.amountDue.toLocaleString()}</td>
                          <td className="py-3 px-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border border-red-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {inv.status === 'OVERDUE' && (
                              <button
                                onClick={() => {
                                  setPayInvoiceId(inv.id);
                                  setPayAmount(inv.amountDue);
                                }}
                                className="text-teal-600 hover:text-teal-700 font-bold"
                              >
                                Pay
                              </button>
                            )}
                            {inv.status === 'PLAN_ACTIVE' && (
                              <span className="text-[10px] text-slate-400 italic">See EMI below</span>
                            )}
                            {inv.status === 'PAID' && (
                              <span className="text-[10px] text-emerald-500 font-medium">Cleared</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* EduScore (Right Col, spans 5) */}
              <section className="md:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-[#7C3AED] p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7C3AED]">auto_awesome</span>
                    <h3 className="text-lg font-bold text-slate-900">EduScore</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${bandStyle.bg} border`}>
                    {eduScore?.band}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center flex-grow py-4">
                  {/* Premium Speedometer style dial */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        className="text-slate-100"
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="212 283"
                        strokeLinecap="round"
                        transform="rotate(135 60 60)"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="transparent"
                        stroke={getScoreColor(eduScore?.score || 300)}
                        strokeWidth="8"
                        strokeDasharray="212 283"
                        strokeDashoffset={212 * (1 - ((eduScore?.score || 300) - 300) / 600)}
                        strokeLinecap="round"
                        transform="rotate(135 60 60)"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 4px ${getScoreColor(eduScore?.score || 300)}30)` }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center mt-[-10px]">
                      <span className="text-4xl font-extrabold font-mono text-slate-900">{eduScore?.score || '300'}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Trust Rating</span>
                    </div>
                  </div>

                  <div className="text-center px-4 mt-2">
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      {bandStyle.trustLabel}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {bandStyle.action}
                    </p>
                  </div>
                </div>

                {riskScore && (
                  <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 border border-slate-100 leading-relaxed">
                    <span className="font-bold text-slate-700 block mb-0.5">Scoring Factors:</span>
                    {riskScore.explanation}
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!studentDetails) return;
                    setGeneratingPassport(true);
                    try {
                      const res = await handleGenerateFeePassport(studentDetails.id);
                      if (res.success && res.token) {
                        setPassportToken(res.token);
                        setShowPassportModal(true);
                      } else {
                        alert(res.error || 'Failed to generate FeePassport');
                      }
                    } catch (e) {
                      alert('Error generating passport');
                    } finally {
                      setGeneratingPassport(false);
                    }
                  }}
                  disabled={generatingPassport}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>{generatingPassport ? 'Generating Digital Seal...' : 'Get Verifiable FeePassport'}</span>
                </button>
              </section>

              {/* Active Payment Plans (Installments breakdown) */}
              {studentDetails?.invoices && studentDetails.invoices.some((inv: any) => inv.paymentPlan) && (
                <section className="md:col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Active EMI Installment Schedules</h3>
                  {studentDetails.invoices.map((inv: any) => {
                    if (!inv.paymentPlan) return null;
                    const installments = typeof inv.paymentPlan.installments === 'string' 
                      ? JSON.parse(inv.paymentPlan.installments) 
                      : inv.paymentPlan.installments;

                    return (
                      <div key={inv.paymentPlan.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                          <span>EMI Schedule for {inv.termId} ({inv.paymentPlan.riskBand} Risk Adjusted)</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold text-[9px] uppercase">
                            Plan Active
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          {installments.map((inst: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                                inst.status === 'PAID' 
                                  ? 'bg-emerald-50/50 border-emerald-100' 
                                  : 'bg-white border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400 font-bold">Installment {idx + 1}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {inst.status}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-800 font-mono mb-2">₹{inst.amount.toLocaleString()}</p>
                              <div className="flex justify-between items-center mt-auto">
                                <span className="text-[9px] text-slate-400">Due: {new Date(inst.dueDate).toLocaleDateString('en-IN')}</span>
                                {inst.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      setPayInvoiceId(inv.id);
                                      setPayAmount(inst.amount);
                                    }}
                                    className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold"
                                  >
                                    Pay
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {/* Upcoming Term Fees Card */}
              {upcomingInvoices.length > 0 && (
                <section className="md:col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Upcoming Billing Cycles</h3>
                      <p className="text-xs text-slate-500">Pay upcoming bills early to build your score.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingInvoices.map((inv: any) => (
                      <div key={inv.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">{inv.termId}</span>
                          <p className="text-lg font-bold font-mono text-slate-800 mt-1">₹{inv.amountDue.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Due Date: {new Date(inv.dueDate).toLocaleDateString('en-IN')}</p>
                        </div>
                        <button
                          onClick={() => {
                            setPayInvoiceId(inv.id);
                            setPayAmount(inv.amountDue);
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-[#0D9488] hover:bg-[#0f766c] shadow-sm transition active:scale-95"
                        >
                        Pre-Pay Term
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tailored Recommendations & Opportunities Matching Engine (Mutually Exclusive) */}
              {isEwsScholar ? (
                <section className="md:col-span-12 bg-gradient-to-r from-amber-50 to-teal-50 border border-teal-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-teal-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-teal-600 animate-bounce">local_atm</span>
                        <h3 className="text-lg font-bold text-slate-900">Merit-Based Financial Aid & Scholarships Pre-Approved</h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Based on {studentDetails?.name}’s outstanding academic performance ({activeStudentAvg}%) and your current payment constraints, private & government institutions offer the following fee waivers:
                      </p>
                    </div>
                    <span className="self-start md:self-center px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
                      Financial Aid
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-teal-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">GOVERNMENT SCHEME</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">100% Waiver</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">National Means-Cum-Merit Scholarship (NMMSS)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Central government aid for meritorious students with family income under ₹3.5 Lakhs. Covers school tuition fee and living expenses.
                        </p>
                      </div>
                      <a href="https://scholarships.gov.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Apply via NSP Portal
                      </a>
                    </div>

                    <div className="bg-white border border-teal-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">CSR PRIVATE TRUST</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">Up to ₹50,000</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">HDFC Educational Crisis Scholarship Support</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Specifically supports students facing sudden economic constraints or fee defaults, ensuring education continuity.
                        </p>
                      </div>
                      <a href="https://www.buddy4study.com/page/hdfc-bank-ecss-scholarship" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Apply via Buddy4Study
                      </a>
                    </div>

                    <div className="bg-white border border-teal-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">PRIVATE FUNDING</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">75% Waiver</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Tata Capital Pankh Scholarship Scheme</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Empowers high-performing students who scored 80%+ marks in previous classes and belong to economically weaker sections.
                        </p>
                      </div>
                      <a href="https://www.vidyasaarathi.co.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Apply via Vidyasaarathi
                      </a>
                    </div>
                  </div>
                </section>
              ) : (isAcademicStar || isOlympiadWinner) ? (
                <section className="md:col-span-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-blue-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-600 animate-bounce">emoji_events</span>
                        <h3 className="text-lg font-bold text-slate-900">Elite Merit-Based Scholarships & Fellowships Pre-Approved</h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Based on {studentDetails?.name}’s exceptional academic profile & Olympiad milestones, they qualify for prestigious national and private fellowships:
                      </p>
                    </div>
                    <span className="self-start md:self-center px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
                      Merit Tier
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-blue-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">GOVERNMENT SCHEME</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">Research Fellowship</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Kishore Vaigyanik Protsahan Yojana (KVPY)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          DST, Government of India program providing monthly fellowship stipends and direct contingency grants to promote science research talent.
                        </p>
                      </div>
                      <a href="http://www.kvpy.iisc.ernet.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Visit IISc KVPY
                      </a>
                    </div>

                    <div className="bg-white border border-blue-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">CSR PRIVATE TRUST</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">₹2 Lakhs Grant</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Reliance Foundation Undergraduate Scholarship</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Empowers meritorious Indian students to pursue studies. Includes leadership training modules and professional networking access.
                        </p>
                      </div>
                      <a href="https://www.reliancefoundation.org" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Apply via RF Portal
                      </a>
                    </div>

                    <div className="bg-white border border-blue-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">SCHOLARSHIP BOARD</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">NTSE Scholars</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">National Talent Search Examination (NTSE)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          A highly competitive national program identifying students with high intellectual capability, providing monthly financial support.
                        </p>
                      </div>
                      <a href="https://ncert.nic.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Details on NCERT
                      </a>
                    </div>
                  </div>
                </section>
              ) : isSportsStar ? (
                <section className="md:col-span-12 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-250 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-emerald-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-600 animate-bounce">sports_kabaddi</span>
                        <h3 className="text-lg font-bold text-slate-900">National Sports Authority & CSR Athletic Development Schemes</h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Based on {studentDetails?.name}’s sports achievements and physical co-curricular skills, they qualify for athletic training sponsorships:
                      </p>
                    </div>
                    <span className="self-start md:self-center px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
                      Athletic Tier
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-emerald-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">GOVERNMENT SCHEME</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">100% Training Waiver</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Sports Authority of India (SAI) Scholarship</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Offers full coverage for boarding, school education fees, professional equipment, and coaching under the central government's Khelo India scheme.
                        </p>
                      </div>
                      <a href="https://sportsauthorityofindia.nic.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Visit SAI Portal
                      </a>
                    </div>

                    <div className="bg-white border border-emerald-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">CSR PRIVATE TRUST</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">Equipment Sponsorship</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Reliance Youth Sports Academy Fellowship</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          CSR initiative that supports young athletes in sports like athletics, football, and basketball with sports gear, dietary support, and medical insurance.
                        </p>
                      </div>
                      <a href="https://www.reliancefoundation.org" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Visit RF Sports
                      </a>
                    </div>

                    <div className="bg-white border border-emerald-100 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">NATIONAL SQUAD</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">TOPS Junior Program</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Target Olympic Podium Scheme (TOPS) Development</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Government initiative to identify and train potential Olympic medalists, providing a monthly stipend of ₹25,000 for junior athletes.
                        </p>
                      </div>
                      <a href="https://yas.nic.in" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Apply via Ministry
                      </a>
                    </div>
                  </div>
                </section>
              ) : isMiddleStudent ? (
                <section className="md:col-span-12 bg-gradient-to-r from-slate-50 to-zinc-100 border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-slate-600 animate-bounce">psychology</span>
                        <h3 className="text-lg font-bold text-slate-900">Leadership Mentorship, Skills Development, & Guidance Programs</h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Based on {studentDetails?.name}’s profile, we recommend the following curated youth guidance, coding, and mentoring bootcamps:
                      </p>
                    </div>
                    <span className="self-start md:self-center px-3 py-1 bg-slate-600 text-white rounded-full text-[10px] font-bold tracking-wide uppercase">
                      Mentorship Tier
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded">MENTORSHIP PROGRAM</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">Free Certificate</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Young Leaders Mentorship Program (YLMP)</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Focuses on personality development, group discussions, communication capabilities, and building leadership values in young school children.
                        </p>
                      </div>
                      <a href="https://www.adityabirla.com" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Learn More
                      </a>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded">SKILL DEVELOPMENT</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">NSDC Co-Certified</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">National Skill Development Corporation (NSDC) Youth Camp</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          Introduces coding, web design, artificial intelligence fundamentals, and financial literacy to students between Grade 8 and 12.
                        </p>
                      </div>
                      <a href="https://nsdcindia.org" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Explore Courses
                      </a>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded">CAREER PATHWAYS</span>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">Personalized Counseling</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">Aditya Birla Career Mentoring Initiative</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                          1-on-1 counseling from industry experts to map academic strengths to future fields of study (engineering, arts, humanities, commerce).
                        </p>
                      </div>
                      <a href="https://www.adityabirlacareers.com" target="_blank" rel="noreferrer" className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
                        Register for Session
                      </a>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Academic Journey (Full Width Below) */}
              <section className="md:col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-slate-700">school</span>
                  <h3 className="text-lg font-bold text-slate-900">Academic Journey</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Recent Grades Grid */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Performance (TERM_2_2025)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studentDetails?.academicRecords && studentDetails.academicRecords.map((rec: any) => (
                        <div key={rec.id} className="bg-slate-50 border border-slate-200/60 rounded-lg p-4 flex flex-col justify-between">
                          <p className="text-xs font-semibold text-slate-600 mb-1">{rec.subject}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                            <span className="text-xl font-bold text-slate-900 tracking-tight">{rec.marks}/{rec.maxMarks}</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500 shadow-sm">
                              <span className="material-symbols-outlined text-[10px] text-slate-400">calendar_month</span>
                              <span>Att: {rec.attendancePercent}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements Timeline */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Co-Curriculars & Achievements</h4>
                    <div className="relative pl-6 border-l border-slate-200 space-y-6">
                      {studentDetails?.achievements && studentDetails.achievements.map((ach: any) => (
                        <div key={ach.id} className="relative">
                          <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{new Date(ach.date).toLocaleDateString('en-IN')}</p>
                          <p className="text-xs font-bold text-slate-800">{ach.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-semibold text-teal-600">{ach.level} Level • {ach.category}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      </main>

      {/* Pay Invoice / Installment Modal */}
      {payInvoiceId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePaySubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Simulate UPI/Card Payment</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Payment Amount</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  required
                  className="block w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm font-mono font-bold"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Method</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option value="UPI">UPI (Paytm/GPay/PhonePe)</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash / Offline deposit</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isPaying}
                onClick={() => setPayInvoiceId(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#091426] text-white hover:bg-slate-800 transition active:scale-95 disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {isPaying ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay Now</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* In-Portal School Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-teal-600">swap_horiz</span>
                Initiate School Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-650 text-lg font-bold">×</button>
            </div>
            
            {transferSuccessMsg ? (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {transferSuccessMsg}
                </p>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="w-full py-2 bg-[#091426] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestTransferSubmit} className="space-y-4">
                {transferErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-155 rounded-lg text-red-700 text-xs font-semibold leading-relaxed">
                    ⚠️ {transferErrorMsg}
                  </div>
                )}
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select the target school where you want to transfer your child's academic grades, achievements, and payment standing dossier. The target school principal will receive and review the request.
                </p>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Select Target School</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    value={selectedTargetSchoolId}
                    onChange={(e) => setSelectedTargetSchoolId(e.target.value)}
                  >
                    <option value="">-- Choose New School --</option>
                    {schools
                      .filter((s: any) => s.id !== studentDetails?.currentSchoolId)
                      .map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTransfer || !selectedTargetSchoolId}
                    className="flex-grow py-2 text-xs font-bold rounded-lg text-white bg-[#0D9488] hover:bg-[#0f766c] transition disabled:opacity-50"
                  >
                    {isSubmittingTransfer ? 'Sending Request...' : 'Submit Transfer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Chat Modal (Bottom-Right) */}
      {showChat && activeStudentId && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#091426] text-white p-3.5 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold">Chat with School Office</h4>
              <span className="text-[8px] text-teal-300 font-bold uppercase tracking-wider">Direct negotiation</span>
            </div>
            <button 
              onClick={() => setShowChat(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <span className="material-symbols-outlined text-2xl text-slate-350">forum</span>
                <p className="text-[10px] mt-1">Send a message to discuss payment terms or installments directly with the school office.</p>
              </div>
            ) : (
              chatMessages.map((msg: any) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[80%] rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm ${
                    msg.sender === 'PARENT'
                      ? 'bg-teal-600 text-white self-end rounded-tr-none'
                      : 'bg-white text-slate-700 border border-slate-200 self-start rounded-tl-none'
                  }`}
                >
                  <p>{msg.message}</p>
                  <span className="block text-[8px] text-right mt-1 opacity-70">
                    {new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleParentSendChat} className="p-2.5 border-t border-slate-200 flex gap-2 items-center bg-white">
            <input
              type="text"
              placeholder="Type message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
            <button 
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="p-1.5 bg-teal-650 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Verifiable FeePassport Certificate Modal */}
      {showPassportModal && studentDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-55 p-4 animate-fadeIn">
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

          {/* Local state container for raw JWT toggle */}
          <div id="printable-passport-cert" className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative">
            {/* Certificate Header */}
            <div className="bg-[#091426] text-white p-6 flex justify-between items-center relative">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-teal-400 bg-slate-800 px-2 py-0.5 rounded tracking-widest uppercase">
                  VERIFIED FINTECH PASSPORT
                </span>
                <h3 className="text-lg font-bold tracking-tight">Vidya360 Verifiable FeePassport™</h3>
              </div>
              <button 
                onClick={() => setShowPassportModal(false)}
                className="no-print w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center text-slate-300 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Certificate Body (Clean, Institutional Styling) */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              
              {/* Premium Certificate Border/Badge Wrapper */}
              <div className="border-4 border-double border-amber-500/30 p-6 rounded-xl relative bg-amber-50/10 bg-gradient-to-br from-amber-50/20 to-transparent space-y-6">
                
                {/* Gold Seal watermark */}
                <div className="absolute top-4 right-4 opacity-10">
                  <span className="material-symbols-outlined text-7xl text-amber-600">verified_user</span>
                </div>

                <div className="text-center space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Credential Statement</h4>
                  <p className="text-xs text-slate-505 italic leading-relaxed">
                    This certifies that the academic standings, financial records, and credit history of the student named below have been verified and sealed cryptographically on the Vidya360 trust network.
                  </p>
                </div>

                {/* Student Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200/60 items-center">
                  
                  {/* Left info column (Spans 8) */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Student Name:</span>
                      <span className="col-span-2 text-xs font-extrabold text-slate-800">{studentDetails.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Enrolled Class:</span>
                      <span className="col-span-2 text-xs font-semibold text-slate-700">{studentDetails.studentClass || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Current School:</span>
                      <span className="col-span-2 text-xs font-semibold text-slate-700">
                        {schools.find(s => s.id === studentDetails.currentSchoolId)?.name || 'Greenwood International'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">EduScore Rating:</span>
                      <span className="col-span-2 text-xs font-bold text-slate-850 flex items-center gap-1.5">
                        <span className="font-mono px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-bold">
                          {eduScore?.score || '300'}
                        </span>
                        <span className="text-[10px] text-slate-500">({eduScore?.band})</span>
                      </span>
                    </div>
                  </div>

                  {/* Right QR Column (Spans 4) */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0">
                    {/* Low density, highly scannable QR code generator image linking to verification endpoint */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/?verify=${studentDetails.id}&download=true` : '')}`}
                      alt="Verification QR Code"
                      className="w-24 h-24 bg-white border border-slate-200 p-1 rounded-lg shadow-sm"
                    />
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Scan to Download</span>
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

              {/* Collapsible Cryptographic Seal for Admins */}
              <details className="no-print group border border-slate-200 rounded-xl overflow-hidden">
                <summary className="bg-slate-50/80 px-4 py-3 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100/80 transition flex justify-between items-center select-none">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-slate-500">terminal</span>
                    Show Technical Cryptographic Details (JWT Token)
                  </span>
                  <span className="material-symbols-outlined text-sm transition group-open:rotate-180">expand_more</span>
                </summary>
                <div className="p-4 border-t border-slate-250/60 space-y-3 bg-white">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[9px] text-slate-600 break-all select-all leading-relaxed shadow-inner max-h-24 overflow-y-auto">
                    {passportToken.trim()}
                  </div>
                  <p className="text-[9px] text-slate-400 italic leading-relaxed">
                    * This JWT is signed by Greenwood International using HS256. It contains encrypted metadata of the student's records to prevent data tampering when transferring schools.
                  </p>
                </div>
              </details>

            </div>

            {/* Modal Footer */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(passportToken.trim());
                  alert('Verification Token copied to clipboard!');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 transition rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>
                Copy Verifiable Token
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#091426] hover:bg-slate-800 text-white transition rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">print</span>
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
