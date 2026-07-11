'use client';

import { useState, useEffect } from 'react';
import { 
  handleGetSchools, 
  handleGetStudentsBySchool, 
  handleGetSchoolCashFlowForecast,
  handleVerifyFeePassport,
  handleImportFeePassport,
  handleGetTransferRequestsBySchool,
  handleProcessTransferRequest,
  handlePushFeeReminder,
  handleGetChatMessages,
  handleSendChatMessage,
  handleTriggerCounselorIntervention,
  handleGetEscrowFunds,
  handleGetEscrowDisbursements,
  handleDisburseEscrowFund
} from '@/app/actions';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function AdminDashboard({ user, onLogout, isDarkMode, toggleDarkMode }: AdminDashboardProps) {
  const [schools, setSchools] = useState<any[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'risk' | 'forecast' | 'import' | 'escrow'>('risk');
  const [forecastTerm, setForecastTerm] = useState('TERM_3_2026');

  // FeePassport Verification & Transfers state
  const [passportToken, setPassportToken] = useState('');
  const [verifiedPayload, setVerifiedPayload] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // In-Portal School Transfer state
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<'requests' | 'token'>('requests');

  // Selected student details for inspector panel in Risk tab
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Chat and reminder notifications states
  const [chatStudentId, setChatStudentId] = useState<string | null>(null);
  const [chatStudentName, setChatStudentName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [remindedInvoices, setRemindedInvoices] = useState<Record<string, boolean>>({});

  // Counselor intervention states
  const [interventions, setInterventions] = useState<Record<string, boolean>>({});
  const [dispatchingIntervention, setDispatchingIntervention] = useState(false);

  // Escrow Scholarship Fund states
  const [escrowFunds, setEscrowFunds] = useState<any[]>([]);
  const [escrowDisbursements, setEscrowDisbursements] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [disburseStudentId, setDisburseStudentId] = useState<string>('');
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [disburseReason, setDisburseReason] = useState<string>('');
  const [disbursing, setDisbursing] = useState(false);

  // Fetch schools list initially
  useEffect(() => {
    async function loadSchools() {
      setLoading(true);
      try {
        const schoolsList = await handleGetSchools();
        setSchools(schoolsList);
        if (schoolsList.length > 0) {
          let defaultSchoolId = schoolsList[0].id;
          if (user.email === 'admin@dps.edu') {
            const dps = schoolsList.find(s => s.name.toLowerCase().includes('delhi public'));
            if (dps) defaultSchoolId = dps.id;
          } else if (user.email === 'admin@dav.edu') {
            const dav = schoolsList.find(s => s.name.toLowerCase().includes('dav public'));
            if (dav) defaultSchoolId = dav.id;
          }
          setActiveSchoolId(defaultSchoolId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSchools();
  }, [user.email]);

  // Fetch school-specific data (students and cash flow) when active school or forecast term or active tab switches
  useEffect(() => {
    if (!activeSchoolId) return;
    refreshSchoolData();
    setSelectedStudent(null); // Clear selected student on school switch
    setActiveRequest(null);
    setVerifiedPayload(null);
  }, [activeSchoolId, forecastTerm, activeTab]);

  const refreshSchoolData = async () => {
    setDataLoading(true);
    try {
      const studentList = await handleGetStudentsBySchool(activeSchoolId);
      setStudents(studentList);
      
      const forecastData = await handleGetSchoolCashFlowForecast(activeSchoolId, forecastTerm);
      setForecast(forecastData);

      const requests = await handleGetTransferRequestsBySchool(activeSchoolId);
      setTransferRequests(requests);

      const funds = await handleGetEscrowFunds(activeSchoolId);
      setEscrowFunds(funds);
      if (funds.length > 0) setSelectedFundId(funds[0].id);

      const disbs = await handleGetEscrowDisbursements(activeSchoolId);
      setEscrowDisbursements(disbs);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportToken) return;

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifiedPayload(null);
    setImportSuccess(false);
    
    try {
      const res = await handleVerifyFeePassport(passportToken);
      if (res.success && res.payload) {
        setVerifiedPayload(res.payload);
      } else {
        setVerifyError(res.error || 'Token verification failed. Check signature.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'An error occurred during verification.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleImportSubmit = async () => {
    const token = activeRequest ? activeRequest.passportToken : passportToken;
    if (!token || !activeSchoolId) return;

    const studentName = verifiedPayload.studentName;
    const band = verifiedPayload.eduScore?.band || 'BUILDING_HISTORY';
    
    let trustMessage = '';
    if (band === 'EXCELLENT') {
      trustMessage = '\n\n✨ Waived Upfront Deposit Approved (100% Trust Admission): Upfront fee waiver is automatically applied based on their excellent payment standing.';
    } else if (band === 'GOOD') {
      trustMessage = '\n\n⚡ Reduced Upfront Deposit Approved (Conditional Trust): Recommended 1 month deposit. Balance is eligible for split-pays.';
    }

    if (!confirm(`Are you sure you want to securely import ${studentName} and all verified academic/payment records into ${schools.find(s => s.id === activeSchoolId)?.name}?${trustMessage}`)) {
      return;
    }

    try {
      if (activeRequest) {
        const res = await handleProcessTransferRequest(activeRequest.id, 'APPROVED');
        if (res.success) {
          setImportSuccess(true);
          setVerifiedPayload(null);
          setActiveRequest(null);
          await refreshSchoolData();
          alert('Student profile, grades, and credit details successfully verified and imported! Trust admission rules applied.');
        } else {
          alert(res.error || 'Import failed');
        }
      } else {
        const res = await handleImportFeePassport(token, activeSchoolId);
        if (res.success) {
          setImportSuccess(true);
          setPassportToken('');
          setVerifiedPayload(null);
          await refreshSchoolData();
          alert('Student profile, grades, and credit details successfully verified and imported! Trust admission rules applied.');
        } else {
          alert(res.error || 'Import failed');
        }
      }
    } catch (err) {
      alert('An error occurred during import.');
    }
  };

  const handleDeclineRequest = async () => {
    if (!activeRequest) return;
    if (!confirm('Are you sure you want to decline this student transfer request?')) return;

    try {
      const res = await handleProcessTransferRequest(activeRequest.id, 'REJECTED');
      if (res.success) {
        setVerifiedPayload(null);
        setActiveRequest(null);
        await refreshSchoolData();
        alert('Transfer request declined.');
      } else {
        alert(res.error || 'Failed to decline request');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl font-extrabold text-[#091426] animate-pulse">Vidya360</span>
          <p className="text-sm text-slate-500 font-medium">Loading administrator panel...</p>
        </div>
      </div>
    );
  }

  // Filter students by risk bands
  const lowRiskStudents = students.filter(s => !s.riskScore || s.riskScore.score < 30);
  const medRiskStudents = students.filter(s => s.riskScore && s.riskScore.score >= 30 && s.riskScore.score < 70);
  const highRiskStudents = students.filter(s => s.riskScore && s.riskScore.score >= 70);

  // Trust Admission policy helper for display
  const getTrustRecommendation = (band: string) => {
    switch (band) {
      case 'EXCELLENT':
        return {
          header: '✨ Waived Upfront Deposit Approved (100% Trust Admission)',
          body: 'Based on this parent’s flawless payment history at their previous school, they are approved for 100% trust-based admission. Upfront admission fees, capital levies, and security deposits can be fully waived. Enable standard term billing directly.',
          border: 'border-l-4 border-l-emerald-500 bg-emerald-50 text-emerald-800 border-emerald-250',
          icon: 'verified'
        };
      case 'GOOD':
        return {
          header: '⚡ Reduced Upfront Deposit Approved (Conditional Trust)',
          body: 'Good history verified. Standard security deposits can be reduced to 1 month. The balance is pre-approved for interest-free split-pays to facilitate onboarding.',
          border: 'border-l-4 border-l-teal-500 bg-teal-50 text-teal-800 border-teal-250',
          icon: 'handshake'
        };
      case 'FAIR':
        return {
          header: '⚠️ Standard Onboarding (No Deposit Waiver)',
          body: 'Fair history verified. Standard upfront admission fees and security deposits must be paid. Proactively offer flexible EMI options to avoid future default bottlenecks.',
          border: 'border-l-4 border-l-amber-500 bg-amber-50 text-amber-800 border-amber-250',
          icon: 'warning'
        };
      default:
        return {
          header: '🚨 High-Risk Admission Protocol',
          body: 'Parent history shows active/recurrent late payments or default patterns. Mandatory upfront collection of full term fees is advised. Payment plans must be backed by automated NACH debit mandate.',
          border: 'border-l-4 border-l-red-500 bg-red-50 text-red-800 border-red-250',
          icon: 'gpp_maybe'
        };
    }
  };

  // Chat and reminder handlers
  const handleOpenChat = async (studentId: string, studentName: string) => {
    setChatStudentId(studentId);
    setChatStudentName(studentName);
    try {
      const msgs = await handleGetChatMessages(studentId);
      setChatMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatStudentId) return;
    setSendingMessage(true);
    try {
      const res = await handleSendChatMessage(chatStudentId, 'SCHOOL', chatInput.trim());
      if (res.success) {
        setChatInput('');
        const msgs = await handleGetChatMessages(chatStudentId);
        setChatMessages(msgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      const res = await handlePushFeeReminder(invoiceId) as any;
      if (res.success) {
        setRemindedInvoices(prev => ({ ...prev, [invoiceId]: true }));
        alert('Gentle fee reminder sent successfully to parent!');
      } else {
        alert(res.error || 'Failed to send reminder');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const handleTriggerIntervention = async (studentId: string) => {
    setDispatchingIntervention(true);
    try {
      const res = await handleTriggerCounselorIntervention(studentId);
      if (res.success) {
        setInterventions(prev => ({ ...prev, [studentId]: true }));
        alert('AI early warning intervention triggered! A counselor support team has been dispatched to assist the parent.');
      } else {
        alert((res as any).error || 'Failed to trigger counselor intervention');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDispatchingIntervention(false);
    }
  };

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId || !disburseStudentId || disburseAmount <= 0) {
      alert('Please fill out all fields with valid values.');
      return;
    }

    const fund = escrowFunds.find(f => f.id === selectedFundId);
    if (!fund) {
      alert('Escrow fund not found.');
      return;
    }

    if (fund.remainingAmount < disburseAmount) {
      alert(`Insufficient funds! The selected escrow has only ₹${fund.remainingAmount.toLocaleString()} remaining.`);
      return;
    }

    const student = students.find(s => s.id === disburseStudentId);
    if (!student) {
      alert('Student not found.');
      return;
    }

    const overdueInvoice = (student.invoices || []).find((i: any) => i.status === 'OVERDUE');
    if (!overdueInvoice) {
      alert('No overdue invoices found for this student.');
      return;
    }

    if (disburseAmount > overdueInvoice.amountDue) {
      alert(`The disbursement amount (₹${disburseAmount.toLocaleString()}) cannot exceed the student's overdue fees of ₹${overdueInvoice.amountDue.toLocaleString()}.`);
      return;
    }

    setDisbursing(true);
    try {
      const res = await handleDisburseEscrowFund(selectedFundId, disburseStudentId, disburseAmount, disburseReason);
      if (res.success) {
        alert(`Successfully disbursed ₹${disburseAmount.toLocaleString()} to ${student.name}!`);
        // Reset fields
        setDisburseAmount(0);
        setDisburseReason('');
        setDisburseStudentId('');
        // Reload all dashboard data
        await refreshSchoolData();
      } else {
        alert((res as any).error || 'Failed to disburse funds');
      }
    } catch (err: any) {
      alert('An error occurred: ' + err.message);
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#091122] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'} flex overflow-hidden font-body-lg antialiased w-full transition-colors duration-500`}>
      {/* SideNavBar (Shared component matching parent style) */}
      <aside className="hidden md:flex bg-[#091426] text-white fixed left-0 top-0 h-full w-[280px] border-r border-slate-800 flex-col p-6 z-20">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-teal-400 text-2xl font-bold">school</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Vidya360</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Institutional Portal</p>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('risk')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition text-left w-full ${
              activeTab === 'risk' ? 'bg-slate-800/60 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'risk' ? "'FILL' 1" : "" }}>dashboard</span>
            <span>Overview Pipeline</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition text-left w-full ${
              activeTab === 'forecast' ? 'bg-slate-800/60 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'forecast' ? "'FILL' 1" : "" }}>account_tree</span>
            <span>Fee Forecasting</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition text-left w-full ${
              activeTab === 'import' ? 'bg-slate-800/60 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'import' ? "'FILL' 1" : "" }}>assignment_ind</span>
            <span>Verify & Import</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('escrow')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition text-left w-full ${
              activeTab === 'escrow' ? 'bg-slate-800/60 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/10'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === 'escrow' ? "'FILL' 1" : "" }}>volunteer_activism</span>
            <span>Scholarship Fund</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user.email}</p>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                {schools.find(s => s.id === activeSchoolId)?.name.split(',')[0] || 'School Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition text-sm text-left w-full"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-grow md:ml-[280px] w-full min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#070d19]' : 'bg-[#F8FAFC]'}`}>
        {/* TopNavBar - Always visible to ensure school selection works on mobile/tablet */}
        <header className={`flex justify-between items-center w-full h-16 px-4 md:px-10 sticky top-0 z-10 border-b transition-colors duration-500 ${isDarkMode ? 'bg-[#0b1322] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex-1 flex items-center gap-3 md:gap-4">
            <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">Active School:</span>
            <select
              className={`border text-slate-700 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none shadow-sm font-semibold max-w-[180px] sm:max-w-xs md:max-w-none ${isDarkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-[#F8FAFC] border-slate-200 text-slate-700'}`}
              value={activeSchoolId}
              onChange={(e) => setActiveSchoolId(e.target.value)}
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
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
            <button className="text-slate-400 hover:text-slate-650 transition relative">
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">notifications</span>
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-teal-650 rounded-full"></span>
            </button>
            <span className="text-[10px] md:text-xs text-slate-450 font-mono font-medium hidden sm:inline">Session: Jul-Dec 2026</span>
          </div>
        </header>

        {/* Mobile Navigation Tabs (visible only on mobile md:hidden) */}
        <div className="md:hidden bg-[#091426] text-white px-2 py-1.5 flex justify-around border-b border-slate-800 sticky top-16 z-10 shadow-md">
          <button 
            onClick={() => setActiveTab('risk')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold py-1 px-3 rounded-lg transition ${
              activeTab === 'risk' ? 'text-teal-400 bg-slate-800/40' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'risk' ? "'FILL' 1" : "" }}>dashboard</span>
            <span>Pipeline</span>
          </button>
          <button 
            onClick={() => setActiveTab('forecast')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold py-1 px-3 rounded-lg transition ${
              activeTab === 'forecast' ? 'text-teal-400 bg-slate-800/40' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'forecast' ? "'FILL' 1" : "" }}>account_tree</span>
            <span>Forecast</span>
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold py-1 px-3 rounded-lg transition ${
              activeTab === 'import' ? 'text-teal-400 bg-slate-800/40' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'import' ? "'FILL' 1" : "" }}>assignment_ind</span>
            <span>Verify & Import</span>
          </button>
          <button 
            onClick={() => setActiveTab('escrow')}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-bold py-1 px-3 rounded-lg transition ${
              activeTab === 'escrow' ? 'text-teal-400 bg-slate-800/40' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'escrow' ? "'FILL' 1" : "" }}>volunteer_activism</span>
            <span>Fund</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex flex-col items-center gap-0.5 text-[9px] font-bold py-1 px-3 text-slate-400 transition"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="flex-grow p-6 md:p-10 max-w-[1440px] mx-auto w-full overflow-y-auto space-y-8">
          
          {/* TAB 1: KANBAN RISK PIPELINE */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Institutional Overview</h2>
                <p className={`text-sm mt-1 transition-colors duration-500 ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>Real-time collections risk profiling & family credit standing.</p>
              </div>

              {dataLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-teal-550 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Kanban Pipeline Columns (Spans 8) */}
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Low Risk Column */}
                    <div className={`rounded-xl p-4 flex flex-col gap-4 min-h-[500px] border transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/50 border-slate-200/80'}`}>
                      <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-505'}`}>Low Risk (On-Time)</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                          {lowRiskStudents.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {lowRiskStudents.map((s) => (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedStudent(s)}
                            className={`p-4 rounded-xl border transition active:scale-[0.98] cursor-pointer ${
                              isDarkMode 
                                ? 'bg-slate-900/60 border-slate-800 hover:bg-[#1a2638] hover:border-slate-700 text-white shadow-none' 
                                : 'bg-white border-slate-200/85 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-slate-800'
                            } ${
                              selectedStudent?.id === s.id ? 'ring-2 ring-teal-500/80' : ''
                            }`}
                          >
                            <h4 className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{s.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{s.guardian.familyId}</p>
                            <div className={`flex justify-between items-center mt-3 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                                Score: {s.eduScore?.score || 'N/A'}
                              </span>
                              <span className={`text-[10px] font-bold font-mono transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>₹{(s.invoices || []).filter((i: any) => i.status !== 'PAID').reduce((sum: number, i: any) => sum + i.amountDue, 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medium Risk Column */}
                    <div className={`rounded-xl p-4 flex flex-col gap-4 min-h-[500px] border transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/50 border-slate-200/80'}`}>
                      <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-505'}`}>Medium Risk (DPD 1-30)</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                          {medRiskStudents.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {medRiskStudents.map((s) => (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedStudent(s)}
                            className={`p-4 rounded-xl border transition active:scale-[0.98] cursor-pointer ${
                              isDarkMode 
                                ? 'bg-slate-900/60 border-slate-800 hover:bg-[#1a2638] hover:border-slate-700 text-white shadow-none' 
                                : 'bg-white border-slate-200/85 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-slate-800'
                            } ${
                              selectedStudent?.id === s.id ? 'ring-2 ring-teal-500/80' : ''
                            }`}
                          >
                            <h4 className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{s.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{s.guardian.familyId}</p>
                            <div className={`flex justify-between items-center mt-3 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                                Score: {s.eduScore?.score || 'N/A'}
                              </span>
                              <span className={`text-[10px] font-bold font-mono transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>₹{(s.invoices || []).filter((i: any) => i.status !== 'PAID').reduce((sum: number, i: any) => sum + i.amountDue, 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* High Risk Column */}
                    <div className={`rounded-xl p-4 flex flex-col gap-4 min-h-[500px] border transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/50 border-slate-200/80'}`}>
                      <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-slate-400' : 'text-slate-505'}`}>High Risk (DPD 30+)</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold text-[10px] rounded-full">
                          {highRiskStudents.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {highRiskStudents.map((s) => (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedStudent(s)}
                            className={`p-4 rounded-xl border transition active:scale-[0.98] cursor-pointer ${
                              isDarkMode 
                                ? 'bg-slate-900/60 border-slate-800 hover:bg-[#1a2638] hover:border-slate-700 text-white shadow-none' 
                                : 'bg-white border-slate-200/85 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-slate-800'
                            } ${
                              selectedStudent?.id === s.id ? 'ring-2 ring-teal-500/80' : ''
                            }`}
                          >
                            <h4 className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{s.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{s.guardian.familyId}</p>
                            <div className={`flex justify-between items-center mt-3 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-700 rounded-md">
                                Score: {s.eduScore?.score || 'N/A'}
                              </span>
                              <span className={`text-[10px] font-bold font-mono transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>₹{(s.invoices || []).filter((i: any) => i.status !== 'PAID').reduce((sum: number, i: any) => sum + i.amountDue, 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Inspector Panel (Spans 4) */}
                  <div className={`lg:col-span-4 border rounded-xl p-6 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 shadow-none text-white' : 'bg-white border-slate-200 shadow-sm text-slate-800'} min-h-[500px]`}>
                    {selectedStudent ? (
                      <div className="space-y-6">
                        <div className={`border-b pb-4 flex justify-between items-start ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                          <div>
                            <h3 className={`text-base font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedStudent.name}</h3>
                            <div className="flex gap-2 items-center text-[10px] font-semibold mt-1">
                              <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-teal-950/60 text-teal-300 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-150'}`}>
                                {selectedStudent.studentClass || 'Grade 10'}
                              </span>
                              <span>•</span>
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Roll No: {selectedStudent.rollNumber || '01'}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">Guardian: {selectedStudent.guardian.name}</p>
                          </div>
                          <button
                            onClick={() => handleOpenChat(selectedStudent.id, selectedStudent.name)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-150 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 transition active:scale-95 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">chat</span>
                            <span>Chat</span>
                          </button>
                        </div>

                        {/* Credit stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-3 border rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-750' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">EduScore Rating</span>
                            <span className={`text-lg font-bold font-mono transition-colors ${isDarkMode ? 'text-slate-105' : 'text-slate-850'}`}>
                              {selectedStudent.eduScore?.score || '300'}
                            </span>
                            <span className="block text-[8px] text-slate-400 mt-1 uppercase font-semibold">
                              {selectedStudent.eduScore?.band || 'BUILDING'} Band
                            </span>
                          </div>
                          
                          <div className={`p-3 border rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-750' : 'bg-slate-50 border-slate-100'}`}>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Risk Assessment</span>
                            <span className={`text-lg font-bold font-mono transition-colors ${isDarkMode ? 'text-slate-105' : 'text-slate-850'}`}>
                              {selectedStudent.riskScore?.score || '0'}%
                            </span>
                            <span className="block text-[8px] text-slate-400 mt-1 uppercase font-semibold">
                              {selectedStudent.riskScore?.score >= 70 ? 'High default probability' : 'On track'}
                            </span>
                          </div>
                        </div>

                        {/* AI Dropout Risk Early Warning System Card */}
                        <div className={`p-4 border rounded-xl space-y-3 shadow-sm transition-colors ${isDarkMode ? 'bg-red-950/20 border-red-900/60' : 'bg-gradient-to-r from-red-50/50 to-orange-50/50 border-red-100'}`}>
                          <div className={`flex justify-between items-center border-b pb-2 ${isDarkMode ? 'border-red-950/40' : 'border-red-200/50'}`}>
                            <span className="text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px] animate-pulse">psychology</span>
                              AI DROPOUT PREDICTOR
                            </span>
                            <span className={`text-[10px] font-extrabold ${
                              selectedStudent.riskScore?.score >= 70 ? 'text-red-650' :
                              selectedStudent.riskScore?.score >= 30 ? 'text-orange-550' :
                              'text-emerald-550'
                            }`}>
                              Dropout Probability: {selectedStudent.riskScore ? Math.round(selectedStudent.riskScore.score * 0.95) : 0}%
                            </span>
                          </div>
                          
                          <div className={`space-y-1.5 text-[10px] leading-relaxed transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-650'}`}>
                            <p className={`font-bold transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Early Indicators detected by AI Agent:</p>
                            <ul className={`list-disc pl-4 space-y-1 font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {selectedStudent.riskScore?.score >= 70 ? (
                                <>
                                  <li>Attendance decay: 8% drop in quarterly logs.</li>
                                  <li>Recurrent payment distress: Term 3 overdue by &gt;25 days.</li>
                                  <li>Low credit rating (Score: {selectedStudent.eduScore?.score}) triggering parent stress.</li>
                                </>
                              ) : selectedStudent.riskScore?.score >= 30 ? (
                                <>
                                  <li>Marginal grades drop: Science and math below baseline averages.</li>
                                  <li>Minor delays in payments: Average late payment DPD is 3-6 days.</li>
                                </>
                              ) : (
                                <>
                                  <li>No significant indicators. Perfect attendance standing.</li>
                                  <li>Repayment pattern verified as low default probability.</li>
                                </>
                              )}
                            </ul>
                          </div>

                          {selectedStudent.riskScore?.score >= 30 && (
                            <button
                              onClick={() => handleTriggerIntervention(selectedStudent.id)}
                              disabled={interventions[selectedStudent.id] || dispatchingIntervention}
                              className={`w-full py-2 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 border shadow-sm ${
                                interventions[selectedStudent.id]
                                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 active:scale-95'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">volunteer_activism</span>
                              <span>{interventions[selectedStudent.id] ? 'Counselor Dispatched' : 'Deploy Counselor Support'}</span>
                            </button>
                          )}
                        </div>

                        {/* Invoice checklist */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Historical Term Dues</h4>
                          <div className="space-y-2">
                            {selectedStudent.invoices.map((inv: any) => (
                              <div key={inv.id} className={`flex justify-between items-center text-xs p-2.5 border rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800/40 border-slate-750' : 'bg-slate-50/50 border-slate-100'}`}>
                                <div>
                                  <p className={`font-semibold transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{inv.termId}</p>
                                  <p className="text-[9px] text-slate-450 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <p className="font-mono font-bold">₹{inv.amountDue.toLocaleString()}</p>
                                    <span className={`text-[9px] font-bold block ${
                                      inv.status === 'PAID' ? 'text-emerald-500' :
                                      inv.status === 'OVERDUE' ? 'text-red-500' :
                                      'text-blue-500'
                                    }`}>
                                      {inv.status}
                                    </span>
                                  </div>
                                  {inv.status === 'OVERDUE' && (
                                    <button
                                      onClick={() => handleSendReminder(inv.id)}
                                      disabled={remindedInvoices[inv.id]}
                                      className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-0.5 border shadow-sm transition ${
                                        remindedInvoices[inv.id]
                                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                          : 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100 active:scale-95'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[10px]">notifications_active</span>
                                      <span>{remindedInvoices[inv.id] ? 'Sent' : 'Remind'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center text-center py-20 space-y-3 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className={`material-symbols-outlined text-4xl transition-colors ${isDarkMode ? 'text-slate-750' : 'text-slate-300'}`}>search_activity</span>
                        <p className="text-xs">Select any student card on the pipeline to inspect payment histories and risk profiling factors.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: CASH FLOW FORECASTING */}
          {activeTab === 'forecast' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Recovery Projection</h2>
                  <p className="text-sm text-slate-500 mt-1">Shortfall calculations adjusted dynamically by parent risk scores.</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-medium">Select Term:</span>
                  <select
                    value={forecastTerm}
                    onChange={(e) => setForecastTerm(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold shadow-sm"
                  >
                    <option value="TERM_3_2026">TERM_3_2026 (Current Outstanding Dues)</option>
                    <option value="TERM_4_2026">TERM_4_2026 (Upcoming Term Billing)</option>
                  </select>
                </div>
              </div>

              {forecast ? (
                <>
                  {/* Headline metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Term Dues Raised</h4>
                      <p className="text-2xl font-extrabold font-mono text-slate-900 mt-2">₹{forecast.totalBilling.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 mt-1 font-semibold">Term Code: {forecast.termId}</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Expected Collection (Risk Weighted)</h4>
                      <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-2">₹{forecast.expectedCollection.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 mt-1">Adjusted by trust risk models</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-red-500">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Expected Shortfall</h4>
                      <p className="text-2xl font-extrabold font-mono text-red-600 mt-2">₹{forecast.expectedShortfall.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 mt-1">Probability-based default estimate</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Shortfall Runway Forecast</h4>
                      <p className="text-2xl font-extrabold font-mono text-teal-600 mt-2">{forecast.runwayMonths} months</p>
                      <p className="text-[9px] text-slate-500 mt-1 font-semibold">Burn rate: ₹{forecast.monthlyBurn.toLocaleString()}/mo</p>
                    </div>
                  </div>

                  {/* Recovery Graph analysis */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Recovery Outlook Analysis</h3>
                    <div>
                      <div className="flex justify-between text-xs mb-2 text-slate-500 font-semibold">
                        <span>Collections Probability Breakdown</span>
                        <span>₹{forecast.expectedCollection.toLocaleString()} of ₹{forecast.totalBilling.toLocaleString()} expected</span>
                      </div>
                      
                      <div className="w-full h-7 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                        {forecast.totalBilling > 0 ? (
                          <>
                            <div 
                              className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white rounded-l-full"
                              style={{ width: `${(forecast.expectedCollection / forecast.totalBilling) * 100}%` }}
                            >
                              {Math.round((forecast.expectedCollection / forecast.totalBilling) * 100)}% Recoverable
                            </div>
                            <div 
                              className="bg-red-500 h-full flex items-center justify-center text-[10px] font-bold text-white rounded-r-full"
                              style={{ width: `${(forecast.expectedShortfall / forecast.totalBilling) * 100}%` }}
                            >
                              {Math.round((forecast.expectedShortfall / forecast.totalBilling) * 100)}% Shortfall
                            </div>
                          </>
                        ) : (
                          <div className="w-full bg-slate-300 h-full rounded-full flex items-center justify-center text-[10px] text-slate-500 italic">No billings reported.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed border border-slate-100 mt-4">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-1">Fee Intelligence Insight:</span>
                      Our forecasting algorithms analyze late-payment frequencies and total outstanding DPD variables. The school expects to recover <strong>₹{forecast.expectedCollection.toLocaleString()}</strong>.
                      By offering customized **Flexible EMI Plans** to parents flagged in the medium/high risk columns, the school can securely resolve up to 70% of the ₹{forecast.expectedShortfall.toLocaleString()} potential shortfall.
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">No forecasting reports loaded.</p>
              )}
            </div>
          )}

          {/* TAB 3: VERIFY & IMPORT INBOUND FEEPASSPORT */}
          {activeTab === 'import' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Token Input or Requests List */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transfer Student Verification</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Verify student academics and payment trust standings to enroll them.
                  </p>
                </div>

                {/* Subtab selection toggles */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => {
                      setVerifyMode('requests');
                      setVerifiedPayload(null);
                      setActiveRequest(null);
                      setVerifyError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                      verifyMode === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Inbound Requests ({transferRequests.filter(r => r.status === 'PENDING').length})
                  </button>
                  <button
                    onClick={() => {
                      setVerifyMode('token');
                      setVerifiedPayload(null);
                      setActiveRequest(null);
                      setVerifyError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
                      verifyMode === 'token' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Verify Token Code
                  </button>
                </div>

                {verifyMode === 'requests' ? (
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                    {transferRequests.filter(r => r.status === 'PENDING').map((req) => (
                      <div
                        key={req.id}
                        onClick={() => {
                          setActiveRequest(req);
                          setVerifiedPayload(req.verifiedPayload);
                          setVerifyError(null);
                        }}
                        className={`p-3 bg-slate-50 border rounded-xl cursor-pointer hover:border-slate-350 transition flex flex-col gap-1.5 text-xs ${
                          activeRequest?.id === req.id ? 'ring-2 ring-teal-500/80 border-slate-300' : 'border-slate-200/80'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{req.studentName}</span>
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded border border-amber-100 uppercase">
                            Pending
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">Requested: {new Date(req.requestedAt).toLocaleDateString('en-IN')}</p>
                        <div className="flex justify-between items-center mt-2 border-t border-slate-200/50 pt-2 text-[10px]">
                          <span className="text-teal-700 font-bold">EduScore: {req.verifiedPayload?.eduScore?.score || 'N/A'}</span>
                          <span className="font-semibold text-slate-500">Review Request →</span>
                        </div>
                      </div>
                    ))}

                    {transferRequests.filter(r => r.status === 'PENDING').length === 0 && (
                      <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                        <span className="material-symbols-outlined text-3xl text-slate-300 block">mail_outline</span>
                        <p className="text-[11px] italic">No pending transfer requests found.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <form onSubmit={handleVerifySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Signed JWT Token String</label>
                        <textarea
                          required
                          value={passportToken}
                          onChange={(e) => setPassportToken(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 h-36"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={verifyLoading}
                        className="w-full py-3 bg-[#091426] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
                      >
                        {verifyLoading ? 'Checking Cryptography...' : 'Verify Cryptographic Signature'}
                      </button>
                    </form>

                    {verifyError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-semibold">
                        ⚠️ {verifyError}
                      </div>
                    )}
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-250 rounded-lg text-xs text-emerald-750 font-bold">
                    ✓ Student imported successfully!
                  </div>
                )}
              </div>

              {/* Decrypted Verified Payload Preview */}
              <div className="lg:col-span-2 space-y-8">
                {verifiedPayload ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          ✓ Cryptographically Verified Authenticity
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mt-2">{verifiedPayload.studentName}</h3>
                        <p className="text-xs text-slate-500">Transferred from School ID: {verifiedPayload.issuingSchoolId}</p>
                      </div>

                      <div className="flex gap-2">
                        {activeRequest && (
                          <button
                            onClick={handleDeclineRequest}
                            className="py-2.5 px-4 rounded-lg border border-red-250 text-red-700 hover:bg-red-50 transition text-xs font-bold"
                          >
                            Decline Request
                          </button>
                        )}
                        <button
                          onClick={handleImportSubmit}
                          className="py-2.5 px-5 rounded-lg text-white font-bold bg-[#0D9488] hover:bg-[#0f766c] transition text-xs shadow-sm"
                        >
                          Approve & Enroll Student
                        </button>
                      </div>
                    </div>

                    {/* Trust-Based Admission Recommendation Block (Key requirement) */}
                    {verifiedPayload.eduScore && (
                      <div className={`p-4 rounded-xl border ${getTrustRecommendation(verifiedPayload.eduScore.band).border} space-y-2`}>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                            {getTrustRecommendation(verifiedPayload.eduScore.band).icon}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider leading-relaxed">
                            {getTrustRecommendation(verifiedPayload.eduScore.band).header}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">
                          {getTrustRecommendation(verifiedPayload.eduScore.band).body}
                        </p>
                      </div>
                    )}

                    {/* Basic details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                        <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Guardian Financial Profile</h4>
                        <div>
                          <p className="font-bold text-slate-800">{verifiedPayload.guardianName}</p>
                          <p className="text-slate-500 mt-0.5">{verifiedPayload.guardianContact}</p>
                        </div>
                        
                        {verifiedPayload.eduScore && (
                          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold block">EduScore Score</span>
                              <span className="text-xl font-bold font-mono text-slate-900">{verifiedPayload.eduScore.score}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[9px]">
                              {verifiedPayload.eduScore.band} Band
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Academics grid */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                        <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Verified Grades (6 Core Subjects)</h4>
                        {verifiedPayload.academicRecord && verifiedPayload.academicRecord.length > 0 ? (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {verifiedPayload.academicRecord.map((rec: any, idx: number) => (
                              <div key={idx} className="flex justify-between border-b border-slate-200/40 pb-1.5 last:border-0 last:pb-0 text-slate-700">
                                <span className="font-semibold">{rec.subject}</span>
                                <span className="font-mono text-slate-500">{rec.marks}/{rec.maxMarks} (Att: {rec.attendancePercent}%)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No academic reports found.</p>
                        )}
                      </div>
                    </div>

                    {/* Historical Payment Summaries */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Historical Payment Standing (Security Audit)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {verifiedPayload.paymentHistorySummary.map((inv: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200/80 text-[11px] shadow-sm flex flex-col justify-between">
                            <div>
                              <p className="font-bold text-slate-800">{inv.termId}</p>
                              <p className="font-mono text-slate-500 mt-0.5">₹{inv.amountDue.toLocaleString()}</p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 uppercase font-semibold">{inv.status}</span>
                              {inv.paidOnTime ? (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">✓ On Time</span>
                              ) : inv.status === 'PAID' ? (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">Late</span>
                              ) : (
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded">Defaulted</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-slate-300">verified_user</span>
                    <p className="text-sm">Please paste a cryptographically signed FeePassport token in the field on the left and run verification.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'escrow' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Alumni & CSR Scholarship Fund</h2>
                <p className="text-sm text-slate-500 mt-1">Allocate pre-funded escrow pools directly to outstanding student dues.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Panel: Active Escrow Funds (Spans 5) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-600">account_balance_wallet</span>
                      Active Escrow Pools
                    </h3>
                    <div className="space-y-4">
                      {escrowFunds.length > 0 ? (
                        escrowFunds.map((fund: any) => (
                          <div key={fund.id} className="p-4 bg-slate-50 border border-slate-250/80 rounded-xl space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-[#091426] text-white text-[8px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                              Trust Account
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-800 leading-snug">{fund.source}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Created: {fund.createdAt}</p>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-slate-200/50">
                              <div>
                                <span className="text-[8px] text-slate-450 uppercase font-bold block">Remaining Pool</span>
                                <span className="text-base font-extrabold font-mono text-teal-600">₹{fund.remainingAmount.toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-450 uppercase font-bold block">Total Endowed</span>
                                <span className="text-xs font-bold font-mono text-slate-600">₹{fund.totalAmount.toLocaleString()}</span>
                              </div>
                            </div>
                            {fund.interestRate && (
                              <div className="pt-2 border-t border-slate-200/30 flex justify-between items-center text-[9px] text-slate-500 font-semibold bg-emerald-50/50 px-2 py-1 rounded">
                                <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                                  <span className="material-symbols-outlined text-[10px] font-bold">trending_up</span>
                                  {fund.interestRate}% APY Yield
                                </span>
                                <span className="text-slate-450 font-bold">
                                  Interest Accrued: <strong className="text-emerald-600 font-mono">+₹{fund.accruedInterest}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No scholarship funds registered for this school.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Disburse Funding Form (Spans 7) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600">volunteer_activism</span>
                    Allocate Scholarship to Student
                  </h3>

                  <form onSubmit={handleDisbursementSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fund Selector */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Select Funding Source</label>
                        <select
                          value={selectedFundId}
                          onChange={(e) => setSelectedFundId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                        >
                          {escrowFunds.map((fund: any) => (
                            <option key={fund.id} value={fund.id}>
                              {fund.source.substring(0, 35)}... (₹{fund.remainingAmount.toLocaleString()} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Student Selector */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Select Deserving Needy Student</label>
                        <select
                          value={disburseStudentId}
                          onChange={(e) => {
                            setDisburseStudentId(e.target.value);
                            // Auto-populate remaining overdue due if selected
                            const selectedStud = students.find(s => s.id === e.target.value);
                            const overdueInv = (selectedStud?.invoices || []).find((i: any) => i.status === 'OVERDUE');
                            if (overdueInv) {
                              setDisburseAmount(overdueInv.amountDue);
                            } else {
                              setDisburseAmount(0);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                        >
                          <option value="">-- Choose student with overdue fees --</option>
                          {students
                            .filter(s => (s.invoices || []).some((i: any) => i.status === 'OVERDUE'))
                            .map((s: any) => {
                              const overdueInv = s.invoices.find((i: any) => i.status === 'OVERDUE');
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.studentClass || 'N/A'}) - Dues: ₹{overdueInv.amountDue.toLocaleString()}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Amount Input */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Disbursement Amount (₹)</label>
                        <input
                          type="number"
                          value={disburseAmount || ''}
                          onChange={(e) => setDisburseAmount(Number(e.target.value))}
                          placeholder="e.g. 35000"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold font-mono"
                        />
                      </div>

                      {/* Reason Input */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase text-[9px]">Selection Reason / Milestones Met</label>
                        <input
                          type="text"
                          value={disburseReason}
                          onChange={(e) => setDisburseReason(e.target.value)}
                          placeholder="e.g. Merit award for academic excellence and attendance milestone"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={disbursing || !selectedFundId || !disburseStudentId || disburseAmount <= 0}
                      className="w-full py-2.5 rounded-lg text-white font-bold bg-[#0D9488] hover:bg-[#0f766c] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">handshake</span>
                      <span>{disbursing ? 'Allocating Funds...' : 'Confirm & Disburse Scholarship'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Disbursement History Logs */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">history</span>
                  Disbursement History Logs
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Funding Source</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Allocated For</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Officer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {escrowDisbursements.length > 0 ? (
                        escrowDisbursements.map((d: any) => {
                          const student = students.find(s => s.id === d.studentId);
                          const fund = escrowFunds.find(f => f.id === d.fundId);
                          return (
                            <tr key={d.id} className="text-slate-700 hover:bg-slate-50/50 transition">
                              <td className="py-3.5 px-4 font-bold text-slate-850">{student ? student.name : 'Unknown Student'}</td>
                              <td className="py-3.5 px-4 text-slate-550 font-semibold">{fund ? fund.source : 'Escrow pool'}</td>
                              <td className="py-3.5 px-4 font-bold font-mono text-emerald-600">₹{d.amount.toLocaleString()}</td>
                              <td className="py-3.5 px-4 text-slate-550 max-w-xs truncate italic">"{d.reason}"</td>
                              <td className="py-3.5 px-4 text-slate-400 font-semibold">
                                {new Date(d.disbursedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 text-right font-semibold">{d.disbursedBy}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">No scholarship funds disbursed yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Floating Chat Modal (Bottom-Right) */}
      {chatStudentId && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#091426] text-white p-3.5 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold">{chatStudentName} - Parent Chat</h4>
              <span className="text-[8px] text-slate-300 font-semibold uppercase">Fee Negotiation Channel</span>
            </div>
            <button 
              onClick={() => setChatStudentId(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-405">
                <span className="material-symbols-outlined text-2xl text-slate-350">forum</span>
                <p className="text-[10px] mt-1">No prior messages. Send a message to start negotiating term installments.</p>
              </div>
            ) : (
              chatMessages.map((msg: any) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[80%] rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm ${
                    msg.sender === 'SCHOOL'
                      ? 'bg-blue-600 text-white self-end rounded-tr-none'
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
          <form onSubmit={handleSendChat} className="p-2.5 border-t border-slate-200 flex gap-2 items-center bg-white">
            <input
              type="text"
              placeholder="Type message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit"
              disabled={sendingMessage || !chatInput.trim()}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
