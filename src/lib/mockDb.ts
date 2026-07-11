// Mock Database Schema and Seed Data for Vidya360
import fs from 'fs';
import path from 'path';

export interface MockSchool {
  id: string;
  name: string;
}

export interface MockUserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARENT';
  guardianId?: string;
}

export interface MockStudent {
  id: string;
  name: string;
  guardianId: string;
  currentSchoolId: string;
  enrollmentHistory: { schoolId: string; startTerm: string; endTerm?: string }[];
  studentClass?: string;
  rollNumber?: string;
}

export interface MockGuardian {
  id: string;
  name: string;
  contact: string;
  familyId: string;
}

export interface MockFeeInvoice {
  id: string;
  studentId: string;
  termId: string;
  amountDue: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PLAN_ACTIVE' | 'PENDING';
}

export interface MockPayment {
  id: string;
  invoiceId: string;
  amount: number;
  paidDate: string;
  method: string;
}

export interface MockRiskScore {
  id: string;
  studentId: string;
  termId: string;
  score: number;
  explanation: string;
  computedAt: string;
}

export interface MockEduScore {
  id: string;
  studentId: string;
  score: number;
  band: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'BUILDING_HISTORY';
  history: { score: number; date: string }[];
  lastUpdated: string;
}

export interface MockPaymentPlan {
  id: string;
  invoiceId: string;
  installments: { dueDate: string; amount: number; status: 'PAID' | 'PENDING' }[];
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MockAcademicRecord {
  id: string;
  studentId: string;
  termId: string;
  subject: string;
  marks: number;
  maxMarks: number;
  attendancePercent: number;
}

export interface MockAchievement {
  id: string;
  studentId: string;
  title: string;
  category: 'SPORTS' | 'ACADEMICS' | 'ARTS' | 'OTHER';
  level: 'SCHOOL' | 'DISTRICT' | 'STATE' | 'NATIONAL';
  date: string;
  certificateUrl?: string;
}

export interface MockFeePassportRecord {
  id: string;
  studentId: string;
  issuingSchoolId: string;
  verifyingSchoolId?: string;
  payload: string;
  issuedAt: string;
}

export interface MockTransferRequest {
  id: string;
  studentId: string;
  targetSchoolId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  passportToken: string;
}

export interface MockNotification {
  id: string;
  guardianId: string;
  title: string;
  message: string;
  sentAt: string;
  read: boolean;
  type: 'FEE_REMINDER' | 'CHAT_MESSAGE';
  referenceId?: string;
}

export interface MockChatMessage {
  id: string;
  studentId: string;
  sender: 'SCHOOL' | 'PARENT';
  message: string;
  sentAt: string;
}

export interface MockEscrowFund {
  id: string;
  schoolId: string;
  source: string; // e.g. 'Alumni Association', 'Tata Trusts CSR'
  totalAmount: number;
  remainingAmount: number;
  createdAt: string;
  interestRate?: number;
  accruedInterest?: number;
}

export interface MockEscrowDisbursement {
  id: string;
  fundId: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  disbursedAt: string;
  disbursedBy: string; // school admin
}

// Global registry to persist state across Hot Module Replacement in Next.js development
const globalForMock = global as unknown as {
  mockStateInitialized: boolean;
  schools: MockSchool[];
  userProfiles: MockUserProfile[];
  students: MockStudent[];
  guardians: MockGuardian[];
  invoices: MockFeeInvoice[];
  payments: MockPayment[];
  riskScores: MockRiskScore[];
  eduScores: MockEduScore[];
  paymentPlans: MockPaymentPlan[];
  academicRecords: MockAcademicRecord[];
  achievements: MockAchievement[];
  passports: MockFeePassportRecord[];
  transferRequests: MockTransferRequest[];
  notifications: MockNotification[];
  chatMessages: MockChatMessage[];
  escrowFunds: MockEscrowFund[];
  escrowDisbursements: MockEscrowDisbursement[];
};

if (!globalForMock.mockStateInitialized || !globalForMock.students || globalForMock.students.length < 30) {
  // 1. Schools (3 dummy schools for full verification testing)
  globalForMock.schools = [
    { id: 'school-a-uuid', name: 'Greenwood International School, Bangalore' },
    { id: 'school-b-uuid', name: 'Delhi Public School, New Delhi' },
    { id: 'school-c-uuid', name: 'DAV Public School, Mumbai' },
  ];

  // 2. Guardians
  globalForMock.guardians = [
    { id: 'guard-ramesh', name: 'Ramesh Sharma', contact: '+91 98765 43210', familyId: 'family-sharma' },
    { id: 'guard-sunita', name: 'Sunita Patel', contact: '+91 91234 56789', familyId: 'family-patel' },
    { id: 'guard-anil', name: 'Anil Gupta', contact: '+91 95432 10987', familyId: 'family-gupta' },
    { id: 'guard-vikram', name: 'Vikram Malhotra', contact: '+91 99887 76655', familyId: 'family-malhotra' },
    { id: 'guard-siddharth', name: 'Siddharth Sen', contact: '+91 98877 66554', familyId: 'family-sen' },
    { id: 'guard-meera', name: 'Meera Joshi', contact: '+91 97766 55443', familyId: 'family-joshi' },
    { id: 'guard-kalyan', name: 'Kalyan Rao', contact: '+91 96655 44332', familyId: 'family-rao' },
    { id: 'guard-karan', name: 'Karan Kapoor', contact: '+91 95544 33221', familyId: 'family-kapoor' },
    { id: 'guard-rajesh', name: 'Rajesh Kumar', contact: '+91 94433 22110', familyId: 'family-kumar' },
    { id: 'guard-verma', name: 'Sunita Verma', contact: '+91 93322 11009', familyId: 'family-verma' },
    { id: 'guard-mehta', name: 'Sanjay Mehta', contact: '+91 92211 00998', familyId: 'family-mehta' },
    { id: 'guard-prakash', name: 'Prakash Jha', contact: '+91 91100 99887', familyId: 'family-jha' },
  ];
 
  // 3. User Profiles (Auth seeds for all schools and parent types)
  globalForMock.userProfiles = [
    { id: 'auth-admin-greenwood', email: 'admin@greenwood.edu', name: 'Principal Greenwood', role: 'ADMIN' },
    { id: 'auth-admin-dps', email: 'admin@dps.edu', name: 'DPS Principal Admin', role: 'ADMIN' },
    { id: 'auth-admin-dav', email: 'admin@dav.edu', name: 'DAV Principal Admin', role: 'ADMIN' },
    { id: 'auth-parent-ramesh', email: 'ramesh@sharma.com', name: 'Ramesh Sharma', role: 'PARENT', guardianId: 'guard-ramesh' },
    { id: 'auth-parent-sunita', email: 'sunita@patel.com', name: 'Sunita Patel', role: 'PARENT', guardianId: 'guard-sunita' },
    { id: 'auth-parent-anil', email: 'anil@gupta.com', name: 'Anil Gupta', role: 'PARENT', guardianId: 'guard-anil' },
    { id: 'auth-parent-vikram', email: 'vikram@malhotra.com', name: 'Vikram Malhotra', role: 'PARENT', guardianId: 'guard-vikram' },
    { id: 'auth-parent-siddharth', email: 'siddharth@sen.com', name: 'Siddharth Sen', role: 'PARENT', guardianId: 'guard-siddharth' },
    { id: 'auth-parent-meera', email: 'meera@joshi.com', name: 'Meera Joshi', role: 'PARENT', guardianId: 'guard-meera' },
    { id: 'auth-parent-kalyan', email: 'kalyan@rao.com', name: 'Kalyan Rao', role: 'PARENT', guardianId: 'guard-kalyan' },
    { id: 'auth-parent-karan', email: 'karan@kapoor.com', name: 'Karan Kapoor', role: 'PARENT', guardianId: 'guard-karan' },
    { id: 'auth-parent-rajesh', email: 'rajesh@kumar.com', name: 'Rajesh Kumar', role: 'PARENT', guardianId: 'guard-rajesh' },
    { id: 'auth-parent-verma', email: 'verma@sunita.com', name: 'Sunita Verma', role: 'PARENT', guardianId: 'guard-verma' },
    { id: 'auth-parent-mehta', email: 'mehta@sanjay.com', name: 'Sanjay Mehta', role: 'PARENT', guardianId: 'guard-mehta' },
    { id: 'auth-parent-prakash', email: 'prakash@jha.com', name: 'Prakash Jha', role: 'PARENT', guardianId: 'guard-prakash' },
  ];

  // 4. Students
  globalForMock.students = [
    // School A: Greenwood International School
    {
      id: 'stud-aarav',
      name: 'Aarav Sharma',
      guardianId: 'guard-ramesh',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-A',
      rollNumber: '12',
    },
    {
      id: 'stud-riya',
      name: 'Riya Sharma',
      guardianId: 'guard-ramesh',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 8-B',
      rollNumber: '05',
    },
    {
      id: 'stud-kabir',
      name: 'Kabir Patel',
      guardianId: 'guard-sunita',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-A',
      rollNumber: '22',
    },
    {
      id: 'stud-diya',
      name: 'Diya Gupta',
      guardianId: 'guard-anil',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-A',
      rollNumber: '14',
    },

    // School B: Delhi Public School, New Delhi
    {
      id: 'stud-aryan',
      name: 'Aryan Malhotra',
      guardianId: 'guard-vikram',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 11-A',
      rollNumber: '18',
    },
    {
      id: 'stud-ananya',
      name: 'Ananya Sen',
      guardianId: 'guard-siddharth',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-B',
      rollNumber: '09',
    },

    // School C: DAV Public School, Mumbai
    {
      id: 'stud-rohan',
      name: 'Rohan Joshi',
      guardianId: 'guard-meera',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2023', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 12-C',
      rollNumber: '31',
    },
    {
      id: 'stud-isha',
      name: 'Isha Rao',
      guardianId: 'guard-kalyan',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 11-B',
      rollNumber: '24',
    },
    
    // School A: Karan Kapoor's family (Poor but Academic Stars)
    {
      id: 'stud-aanya',
      name: 'Aanya Kapoor',
      guardianId: 'guard-karan',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-A',
      rollNumber: '08',
    },
    {
      id: 'stud-dev',
      name: 'Dev Kapoor',
      guardianId: 'guard-karan',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-B',
      rollNumber: '17',
    },
    // New Student Seeds
    // School A: Rajesh Kumar's family (3 children)
    {
      id: 'stud-neha',
      name: 'Neha Kumar',
      guardianId: 'guard-rajesh',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 7-A',
      rollNumber: '11',
    },
    {
      id: 'stud-amit',
      name: 'Amit Kumar',
      guardianId: 'guard-rajesh',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 5-B',
      rollNumber: '02',
    },
    {
      id: 'stud-rahul',
      name: 'Rahul Kumar',
      guardianId: 'guard-rajesh',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 3-A',
      rollNumber: '19',
    },
    // School B: Sunita Verma's family (1 child)
    {
      id: 'stud-karanv',
      name: 'Karan Verma',
      guardianId: 'guard-verma',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 11-B',
      rollNumber: '07',
    },
    // School B: Extra student
    {
      id: 'stud-sneha-dps',
      name: 'Sneha Rao',
      guardianId: 'guard-kalyan',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-B',
      rollNumber: '29',
    },
    // School C: Sanjay Mehta's family (3 children)
    {
      id: 'stud-aarushi',
      name: 'Aarushi Mehta',
      guardianId: 'guard-mehta',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2023', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 12-A',
      rollNumber: '03',
    },
    {
      id: 'stud-varun',
      name: 'Varun Mehta',
      guardianId: 'guard-mehta',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-C',
      rollNumber: '14',
    },
    {
      id: 'stud-aditi',
      name: 'Aditi Mehta',
      guardianId: 'guard-mehta',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 6-B',
      rollNumber: '22',
    },
    // School C: Extra student
    {
      id: 'stud-rohan-dav',
      name: 'Rohan Sharma',
      guardianId: 'guard-ramesh',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-A',
      rollNumber: '33',
    },
    // Prakash Jha (1 child) - School A
    {
      id: 'stud-ishita',
      name: 'Ishita Jha',
      guardianId: 'guard-prakash',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 8-A',
      rollNumber: '15',
    },
    // School A extra random students
    {
      id: 'stud-kavya',
      name: 'Kavya Nair',
      guardianId: 'guard-kalyan',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-A',
      rollNumber: '15',
    },
    {
      id: 'stud-aditya',
      name: 'Aditya Das',
      guardianId: 'guard-meera',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 8-A',
      rollNumber: '28',
    },
    {
      id: 'stud-simran',
      name: 'Simran Kaur',
      guardianId: 'guard-sunita',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-B',
      rollNumber: '31',
    },
    {
      id: 'stud-tanmay',
      name: 'Tanmay Shah',
      guardianId: 'guard-anil',
      currentSchoolId: 'school-a-uuid',
      enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 7-B',
      rollNumber: '09',
    },
    // School B extra random students
    {
      id: 'stud-mehul',
      name: 'Mehul Goel',
      guardianId: 'guard-vikram',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 12-A',
      rollNumber: '13',
    },
    {
      id: 'stud-sameer',
      name: 'Sameer Dixit',
      guardianId: 'guard-sunita',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-B',
      rollNumber: '20',
    },
    {
      id: 'stud-tanya',
      name: 'Tanya Roy',
      guardianId: 'guard-meera',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 8-A',
      rollNumber: '16',
    },
    {
      id: 'stud-pranav',
      name: 'Pranav Joshi',
      guardianId: 'guard-kalyan',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 11-A',
      rollNumber: '23',
    },
    {
      id: 'stud-anjali',
      name: 'Anjali Iyer',
      guardianId: 'guard-siddharth',
      currentSchoolId: 'school-b-uuid',
      enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-C',
      rollNumber: '04',
    },
    // School C extra random students
    {
      id: 'stud-vikram-dav',
      name: 'Vikram Rawat',
      guardianId: 'guard-anil',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 10-B',
      rollNumber: '19',
    },
    {
      id: 'stud-pooja',
      name: 'Pooja Hegde',
      guardianId: 'guard-sunita',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 12-A',
      rollNumber: '08',
    },
    {
      id: 'stud-nikhil',
      name: 'Nikhil Jain',
      guardianId: 'guard-meera',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 9-A',
      rollNumber: '25',
    },
    {
      id: 'stud-kriti',
      name: 'Kriti Sanon',
      guardianId: 'guard-kalyan',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 11-C',
      rollNumber: '15',
    },
    {
      id: 'stud-yash',
      name: 'Yash Birla',
      guardianId: 'guard-vikram',
      currentSchoolId: 'school-c-uuid',
      enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2024', endTerm: 'TERM_3_2026' }],
      studentClass: 'Grade 8-B',
      rollNumber: '36',
    },
  ];

  // 5. Invoices (Term 1 & 2 Paid, Term 3 Overdue/Paid, Term 4 PENDING/UPCOMING)
  globalForMock.invoices = [
    // Aarav Sharma (Ramesh - Fair) - School A
    { id: 'inv-aarav-t1', studentId: 'stud-aarav', termId: 'TERM_1_2025', amountDue: 45000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aarav-t2', studentId: 'stud-aarav', termId: 'TERM_2_2025', amountDue: 45000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aarav-t3', studentId: 'stud-aarav', termId: 'TERM_3_2026', amountDue: 45000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-aarav-t4', studentId: 'stud-aarav', termId: 'TERM_4_2026', amountDue: 45000, dueDate: '2026-10-15', status: 'PENDING' },

    // Riya Sharma (Ramesh - Fair) - School A
    { id: 'inv-riya-t1', studentId: 'stud-riya', termId: 'TERM_1_2025', amountDue: 40000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-riya-t2', studentId: 'stud-riya', termId: 'TERM_2_2025', amountDue: 40000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-riya-t3', studentId: 'stud-riya', termId: 'TERM_3_2026', amountDue: 40000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-riya-t4', studentId: 'stud-riya', termId: 'TERM_4_2026', amountDue: 40000, dueDate: '2026-10-15', status: 'PENDING' },

    // Kabir Patel (Sunita - Excellent) - School A
    { id: 'inv-kabir-t1', studentId: 'stud-kabir', termId: 'TERM_1_2025', amountDue: 50000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-kabir-t2', studentId: 'stud-kabir', termId: 'TERM_2_2025', amountDue: 50000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-kabir-t3', studentId: 'stud-kabir', termId: 'TERM_3_2026', amountDue: 50000, dueDate: '2026-06-15', status: 'PAID' },
    { id: 'inv-kabir-t4', studentId: 'stud-kabir', termId: 'TERM_4_2026', amountDue: 50000, dueDate: '2026-10-15', status: 'PENDING' },

    // Diya Gupta (Anil - Good) - School A
    { id: 'inv-diya-t1', studentId: 'stud-diya', termId: 'TERM_1_2025', amountDue: 48000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-diya-t2', studentId: 'stud-diya', termId: 'TERM_2_2025', amountDue: 48000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-diya-t3', studentId: 'stud-diya', termId: 'TERM_3_2026', amountDue: 48000, dueDate: '2026-06-15', status: 'PAID' },
    { id: 'inv-diya-t4', studentId: 'stud-diya', termId: 'TERM_4_2026', amountDue: 48000, dueDate: '2026-10-15', status: 'PENDING' },

    // Aryan Malhotra (Vikram - Good) - School B
    { id: 'inv-aryan-t1', studentId: 'stud-aryan', termId: 'TERM_1_2025', amountDue: 55000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aryan-t2', studentId: 'stud-aryan', termId: 'TERM_2_2025', amountDue: 55000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aryan-t3', studentId: 'stud-aryan', termId: 'TERM_3_2026', amountDue: 55000, dueDate: '2026-06-15', status: 'PAID' },
    { id: 'inv-aryan-t4', studentId: 'stud-aryan', termId: 'TERM_4_2026', amountDue: 55000, dueDate: '2026-10-15', status: 'PENDING' },

    // Ananya Sen (Siddharth - Excellent) - School B
    { id: 'inv-ananya-t1', studentId: 'stud-ananya', termId: 'TERM_1_2025', amountDue: 52000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-ananya-t2', studentId: 'stud-ananya', termId: 'TERM_2_2025', amountDue: 52000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-ananya-t3', studentId: 'stud-ananya', termId: 'TERM_3_2026', amountDue: 52000, dueDate: '2026-06-15', status: 'PAID' },
    { id: 'inv-ananya-t4', studentId: 'stud-ananya', termId: 'TERM_4_2026', amountDue: 52000, dueDate: '2026-10-15', status: 'PENDING' },

    // Rohan Joshi (Meera - Fair) - School C
    { id: 'inv-rohan-t1', studentId: 'stud-rohan', termId: 'TERM_1_2025', amountDue: 42000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-rohan-t2', studentId: 'stud-rohan', termId: 'TERM_2_2025', amountDue: 42000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-rohan-t3', studentId: 'stud-rohan', termId: 'TERM_3_2026', amountDue: 42000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-rohan-t4', studentId: 'stud-rohan', termId: 'TERM_4_2026', amountDue: 42000, dueDate: '2026-10-15', status: 'PENDING' },

    // Isha Rao (Kalyan - Good) - School C
    { id: 'inv-isha-t1', studentId: 'stud-isha', termId: 'TERM_1_2025', amountDue: 44000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-isha-t2', studentId: 'stud-isha', termId: 'TERM_2_2025', amountDue: 44000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-isha-t3', studentId: 'stud-isha', termId: 'TERM_3_2026', amountDue: 44000, dueDate: '2026-06-15', status: 'PAID' },
    { id: 'inv-isha-t4', studentId: 'stud-isha', termId: 'TERM_4_2026', amountDue: 44000, dueDate: '2026-10-15', status: 'PENDING' },
    
    // Aanya Kapoor (Karan - Poor) - School A
    { id: 'inv-aanya-t1', studentId: 'stud-aanya', termId: 'TERM_1_2025', amountDue: 45000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aanya-t2', studentId: 'stud-aanya', termId: 'TERM_2_2025', amountDue: 45000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aanya-t3', studentId: 'stud-aanya', termId: 'TERM_3_2026', amountDue: 45000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-aanya-t4', studentId: 'stud-aanya', termId: 'TERM_4_2026', amountDue: 45000, dueDate: '2026-10-15', status: 'PENDING' },

    // Dev Kapoor (Karan - Poor) - School A
    { id: 'inv-dev-t1', studentId: 'stud-dev', termId: 'TERM_1_2025', amountDue: 40000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-dev-t2', studentId: 'stud-dev', termId: 'TERM_2_2025', amountDue: 40000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-dev-t3', studentId: 'stud-dev', termId: 'TERM_3_2026', amountDue: 40000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-dev-t4', studentId: 'stud-dev', termId: 'TERM_4_2026', amountDue: 40000, dueDate: '2026-10-15', status: 'PENDING' },

    // Rajesh Kumar (3 children) - School A
    { id: 'inv-neha-t1', studentId: 'stud-neha', termId: 'TERM_1_2025', amountDue: 35000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-neha-t2', studentId: 'stud-neha', termId: 'TERM_2_2025', amountDue: 35000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-neha-t3', studentId: 'stud-neha', termId: 'TERM_3_2026', amountDue: 35000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-amit-t1', studentId: 'stud-amit', termId: 'TERM_1_2025', amountDue: 30000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-amit-t2', studentId: 'stud-amit', termId: 'TERM_2_2025', amountDue: 30000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-amit-t3', studentId: 'stud-amit', termId: 'TERM_3_2026', amountDue: 30000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-rahul-t1', studentId: 'stud-rahul', termId: 'TERM_1_2025', amountDue: 25000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-rahul-t2', studentId: 'stud-rahul', termId: 'TERM_2_2025', amountDue: 25000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-rahul-t3', studentId: 'stud-rahul', termId: 'TERM_3_2026', amountDue: 25000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // Sunita Verma (1 child) - School B
    { id: 'inv-karanv-t1', studentId: 'stud-karanv', termId: 'TERM_1_2025', amountDue: 50000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-karanv-t2', studentId: 'stud-karanv', termId: 'TERM_2_2025', amountDue: 50000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-karanv-t3', studentId: 'stud-karanv', termId: 'TERM_3_2026', amountDue: 50000, dueDate: '2026-06-15', status: 'PAID' },

    // Sneha Rao - School B
    { id: 'inv-snehad-t1', studentId: 'stud-sneha-dps', termId: 'TERM_1_2025', amountDue: 48000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-snehad-t2', studentId: 'stud-sneha-dps', termId: 'TERM_2_2025', amountDue: 48000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-snehad-t3', studentId: 'stud-sneha-dps', termId: 'TERM_3_2026', amountDue: 48000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // Sanjay Mehta (3 children) - School C
    { id: 'inv-aarushi-t1', studentId: 'stud-aarushi', termId: 'TERM_1_2025', amountDue: 40000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aarushi-t2', studentId: 'stud-aarushi', termId: 'TERM_2_2025', amountDue: 40000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aarushi-t3', studentId: 'stud-aarushi', termId: 'TERM_3_2026', amountDue: 40000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-varun-t1', studentId: 'stud-varun', termId: 'TERM_1_2025', amountDue: 38000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-varun-t2', studentId: 'stud-varun', termId: 'TERM_2_2025', amountDue: 38000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-varun-t3', studentId: 'stud-varun', termId: 'TERM_3_2026', amountDue: 38000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-aditi-t1', studentId: 'stud-aditi', termId: 'TERM_1_2025', amountDue: 35000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aditi-t2', studentId: 'stud-aditi', termId: 'TERM_2_2025', amountDue: 35000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aditi-t3', studentId: 'stud-aditi', termId: 'TERM_3_2026', amountDue: 35000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // Rohan Sharma - School C
    { id: 'inv-rohand-t1', studentId: 'stud-rohan-dav', termId: 'TERM_1_2025', amountDue: 40000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-rohand-t2', studentId: 'stud-rohan-dav', termId: 'TERM_2_2025', amountDue: 40000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-rohand-t3', studentId: 'stud-rohan-dav', termId: 'TERM_3_2026', amountDue: 40000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // Prakash Jha (1 child)
    { id: 'inv-ishita-t1', studentId: 'stud-ishita', termId: 'TERM_1_2025', amountDue: 42000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-ishita-t2', studentId: 'stud-ishita', termId: 'TERM_2_2025', amountDue: 42000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-ishita-t3', studentId: 'stud-ishita', termId: 'TERM_3_2026', amountDue: 42000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // School A extra random students
    { id: 'inv-kavya-t1', studentId: 'stud-kavya', termId: 'TERM_1_2025', amountDue: 45000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-kavya-t2', studentId: 'stud-kavya', termId: 'TERM_2_2025', amountDue: 45000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-kavya-t3', studentId: 'stud-kavya', termId: 'TERM_3_2026', amountDue: 45000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-aditya-t1', studentId: 'stud-aditya', termId: 'TERM_1_2025', amountDue: 42000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-aditya-t2', studentId: 'stud-aditya', termId: 'TERM_2_2025', amountDue: 42000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-aditya-t3', studentId: 'stud-aditya', termId: 'TERM_3_2026', amountDue: 42000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-simran-t1', studentId: 'stud-simran', termId: 'TERM_1_2025', amountDue: 44000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-simran-t2', studentId: 'stud-simran', termId: 'TERM_2_2025', amountDue: 44000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-simran-t3', studentId: 'stud-simran', termId: 'TERM_3_2026', amountDue: 44000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-tanmay-t1', studentId: 'stud-tanmay', termId: 'TERM_1_2025', amountDue: 38000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-tanmay-t2', studentId: 'stud-tanmay', termId: 'TERM_2_2025', amountDue: 38000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-tanmay-t3', studentId: 'stud-tanmay', termId: 'TERM_3_2026', amountDue: 38000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // School B extra random students
    { id: 'inv-mehul-t1', studentId: 'stud-mehul', termId: 'TERM_1_2025', amountDue: 50000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-mehul-t2', studentId: 'stud-mehul', termId: 'TERM_2_2025', amountDue: 50000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-mehul-t3', studentId: 'stud-mehul', termId: 'TERM_3_2026', amountDue: 50000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-sameer-t1', studentId: 'stud-sameer', termId: 'TERM_1_2025', amountDue: 48000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-sameer-t2', studentId: 'stud-sameer', termId: 'TERM_2_2025', amountDue: 48000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-sameer-t3', studentId: 'stud-sameer', termId: 'TERM_3_2026', amountDue: 48000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-tanya-t1', studentId: 'stud-tanya', termId: 'TERM_1_2025', amountDue: 45000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-tanya-t2', studentId: 'stud-tanya', termId: 'TERM_2_2025', amountDue: 45000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-tanya-t3', studentId: 'stud-tanya', termId: 'TERM_3_2026', amountDue: 45000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-pranav-t1', studentId: 'stud-pranav', termId: 'TERM_1_2025', amountDue: 50000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-pranav-t2', studentId: 'stud-pranav', termId: 'TERM_2_2025', amountDue: 50000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-pranav-t3', studentId: 'stud-pranav', termId: 'TERM_3_2026', amountDue: 50000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-anjali-t1', studentId: 'stud-anjali', termId: 'TERM_1_2025', amountDue: 48000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-anjali-t2', studentId: 'stud-anjali', termId: 'TERM_2_2025', amountDue: 48000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-anjali-t3', studentId: 'stud-anjali', termId: 'TERM_3_2026', amountDue: 48000, dueDate: '2026-06-15', status: 'OVERDUE' },

    // School C extra random students
    { id: 'inv-vikramd-t1', studentId: 'stud-vikram-dav', termId: 'TERM_1_2025', amountDue: 42000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-vikramd-t2', studentId: 'stud-vikram-dav', termId: 'TERM_2_2025', amountDue: 42000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-vikramd-t3', studentId: 'stud-vikram-dav', termId: 'TERM_3_2026', amountDue: 42000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-pooja-t1', studentId: 'stud-pooja', termId: 'TERM_1_2025', amountDue: 45000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-pooja-t2', studentId: 'stud-pooja', termId: 'TERM_2_2025', amountDue: 45000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-pooja-t3', studentId: 'stud-pooja', termId: 'TERM_3_2026', amountDue: 45000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-nikhil-t1', studentId: 'stud-nikhil', termId: 'TERM_1_2025', amountDue: 40000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-nikhil-t2', studentId: 'stud-nikhil', termId: 'TERM_2_2025', amountDue: 40000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-nikhil-t3', studentId: 'stud-nikhil', termId: 'TERM_3_2026', amountDue: 40000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-kriti-t1', studentId: 'stud-kriti', termId: 'TERM_1_2025', amountDue: 44000, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-kriti-t2', studentId: 'stud-kriti', termId: 'TERM_2_2025', amountDue: 44000, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-kriti-t3', studentId: 'stud-kriti', termId: 'TERM_3_2026', amountDue: 44000, dueDate: '2026-06-15', status: 'OVERDUE' },
    { id: 'inv-yash-t1', studentId: 'stud-yash', termId: 'TERM_1_2025', amountDue: 38050, dueDate: '2025-06-15', status: 'PAID' },
    { id: 'inv-yash-t2', studentId: 'stud-yash', termId: 'TERM_2_2025', amountDue: 38050, dueDate: '2025-10-15', status: 'PAID' },
    { id: 'inv-yash-t3', studentId: 'stud-yash', termId: 'TERM_3_2026', amountDue: 38050, dueDate: '2026-06-15', status: 'OVERDUE' },
  ];

  // 6. Payments
  globalForMock.payments = [
    // Prakash Jha payments
    { id: 'pay-ishita-t1', invoiceId: 'inv-ishita-t1', amount: 42000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-ishita-t2', invoiceId: 'inv-ishita-t2', amount: 42000, paidDate: '2025-10-15', method: 'UPI' },

    // School A extra random payments
    { id: 'pay-kavya-t1', invoiceId: 'inv-kavya-t1', amount: 45000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-kavya-t2', invoiceId: 'inv-kavya-t2', amount: 45000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-aditya-t1', invoiceId: 'inv-aditya-t1', amount: 42000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-aditya-t2', invoiceId: 'inv-aditya-t2', amount: 42000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-simran-t1', invoiceId: 'inv-simran-t1', amount: 44000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-simran-t2', invoiceId: 'inv-simran-t2', amount: 44000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-tanmay-t1', invoiceId: 'inv-tanmay-t1', amount: 38000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-tanmay-t2', invoiceId: 'inv-tanmay-t2', amount: 38000, paidDate: '2025-10-15', method: 'UPI' },

    // School B extra random payments
    { id: 'pay-mehul-t1', invoiceId: 'inv-mehul-t1', amount: 50000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-mehul-t2', invoiceId: 'inv-mehul-t2', amount: 50000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-sameer-t1', invoiceId: 'inv-sameer-t1', amount: 48000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-sameer-t2', invoiceId: 'inv-sameer-t2', amount: 48000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-tanya-t1', invoiceId: 'inv-tanya-t1', amount: 45000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-tanya-t2', invoiceId: 'inv-tanya-t2', amount: 45000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-pranav-t1', invoiceId: 'inv-pranav-t1', amount: 50000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-pranav-t2', invoiceId: 'inv-pranav-t2', amount: 50000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-anjali-t1', invoiceId: 'inv-anjali-t1', amount: 48000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-anjali-t2', invoiceId: 'inv-anjali-t2', amount: 48000, paidDate: '2025-10-15', method: 'UPI' },

    // School C extra random payments
    { id: 'pay-vikramd-t1', invoiceId: 'inv-vikramd-t1', amount: 42000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-vikramd-t2', invoiceId: 'inv-vikramd-t2', amount: 42000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-pooja-t1', invoiceId: 'inv-pooja-t1', amount: 45000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-pooja-t2', invoiceId: 'inv-pooja-t2', amount: 45000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-nikhil-t1', invoiceId: 'inv-nikhil-t1', amount: 40000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-nikhil-t2', invoiceId: 'inv-nikhil-t2', amount: 40000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-kriti-t1', invoiceId: 'inv-kriti-t1', amount: 44000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-kriti-t2', invoiceId: 'inv-kriti-t2', amount: 44000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-yash-t1', invoiceId: 'inv-yash-t1', amount: 38050, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-yash-t2', invoiceId: 'inv-yash-t2', amount: 38050, paidDate: '2025-10-15', method: 'UPI' },

    // Rajesh Kumar payments
    { id: 'pay-neha-t1', invoiceId: 'inv-neha-t1', amount: 35000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-neha-t2', invoiceId: 'inv-neha-t2', amount: 35000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-amit-t1', invoiceId: 'inv-amit-t1', amount: 30000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-amit-t2', invoiceId: 'inv-amit-t2', amount: 30000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-rahul-t1', invoiceId: 'inv-rahul-t1', amount: 25000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-rahul-t2', invoiceId: 'inv-rahul-t2', amount: 25000, paidDate: '2025-10-15', method: 'UPI' },

    // Sunita Verma payments
    { id: 'pay-karanv-t1', invoiceId: 'inv-karanv-t1', amount: 50000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-karanv-t2', invoiceId: 'inv-karanv-t2', amount: 50000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-karanv-t3', invoiceId: 'inv-karanv-t3', amount: 50000, paidDate: '2026-06-15', method: 'UPI' },

    // Sneha Rao payments
    { id: 'pay-sneha-t1', invoiceId: 'inv-snehad-t1', amount: 48000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-sneha-t2', invoiceId: 'inv-snehad-t2', amount: 48000, paidDate: '2025-10-15', method: 'UPI' },

    // Sanjay Mehta payments
    { id: 'pay-aarushi-t1', invoiceId: 'inv-aarushi-t1', amount: 40000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-aarushi-t2', invoiceId: 'inv-aarushi-t2', amount: 40000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-varun-t1', invoiceId: 'inv-varun-t1', amount: 38000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-varun-t2', invoiceId: 'inv-varun-t2', amount: 38000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-aditi-t1', invoiceId: 'inv-aditi-t1', amount: 35000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-aditi-t2', invoiceId: 'inv-aditi-t2', amount: 35000, paidDate: '2025-10-15', method: 'UPI' },

    // Rohan Sharma payments
    { id: 'pay-rohand-t1', invoiceId: 'inv-rohand-t1', amount: 40000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-rohand-t2', invoiceId: 'inv-rohand-t2', amount: 40000, paidDate: '2025-10-15', method: 'UPI' },

    // School A payments
    { id: 'pay-1', invoiceId: 'inv-aarav-t1', amount: 45000, paidDate: '2025-06-12', method: 'UPI' },
    { id: 'pay-2', invoiceId: 'inv-aarav-t2', amount: 45000, paidDate: '2025-11-02', method: 'CARD' },
    { id: 'pay-3', invoiceId: 'inv-riya-t1', amount: 40000, paidDate: '2025-06-14', method: 'UPI' },
    { id: 'pay-4', invoiceId: 'inv-riya-t2', amount: 40000, paidDate: '2025-10-28', method: 'NET_BANKING' },
    { id: 'pay-5', invoiceId: 'inv-kabir-t1', amount: 50000, paidDate: '2025-06-10', method: 'UPI' },
    { id: 'pay-6', invoiceId: 'inv-kabir-t2', amount: 50000, paidDate: '2025-10-12', method: 'UPI' },
    { id: 'pay-7', invoiceId: 'inv-kabir-t3', amount: 50000, paidDate: '2026-06-14', method: 'CARD' },
    { id: 'pay-8', invoiceId: 'inv-diya-t1', amount: 48000, paidDate: '2025-06-14', method: 'UPI' },
    { id: 'pay-9', invoiceId: 'inv-diya-t2', amount: 48000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-10', invoiceId: 'inv-diya-t3', amount: 48000, paidDate: '2026-06-18', method: 'UPI' },

    // School B payments
    { id: 'pay-11', invoiceId: 'inv-aryan-t1', amount: 55000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-12', invoiceId: 'inv-aryan-t2', amount: 55000, paidDate: '2025-10-12', method: 'CARD' },
    { id: 'pay-13', invoiceId: 'inv-aryan-t3', amount: 55000, paidDate: '2026-06-15', method: 'UPI' },
    { id: 'pay-14', invoiceId: 'inv-ananya-t1', amount: 52000, paidDate: '2025-06-11', method: 'UPI' },
    { id: 'pay-15', invoiceId: 'inv-ananya-t2', amount: 52000, paidDate: '2025-10-10', method: 'NET_BANKING' },
    { id: 'pay-16', invoiceId: 'inv-ananya-t3', amount: 52000, paidDate: '2026-06-14', method: 'CARD' },

    // School C payments
    { id: 'pay-17', invoiceId: 'inv-rohan-t1', amount: 42000, paidDate: '2025-06-25', method: 'CASH' }, // 10 days late
    { id: 'pay-18', invoiceId: 'inv-rohan-t2', amount: 42000, paidDate: '2025-10-30', method: 'CARD' }, // 15 days late
    { id: 'pay-19', invoiceId: 'inv-isha-t1', amount: 44000, paidDate: '2025-06-14', method: 'UPI' },
    { id: 'pay-20', invoiceId: 'inv-isha-t2', amount: 44000, paidDate: '2025-10-15', method: 'UPI' },
    { id: 'pay-21', invoiceId: 'inv-isha-t3', amount: 44000, paidDate: '2026-06-20', method: 'UPI' }, // 5 days late

    // Aanya & Dev Kapoor payments (Karan)
    { id: 'pay-aanya-t1', invoiceId: 'inv-aanya-t1', amount: 45000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-aanya-t2', invoiceId: 'inv-aanya-t2', amount: 45000, paidDate: '2025-10-18', method: 'UPI' }, // 3 days late
    { id: 'pay-dev-t1', invoiceId: 'inv-dev-t1', amount: 40000, paidDate: '2025-06-15', method: 'UPI' },
    { id: 'pay-dev-t2', invoiceId: 'inv-dev-t2', amount: 40000, paidDate: '2025-10-18', method: 'UPI' }, // 3 days late
  ];

  // 7. Academic Records (6 subjects per student)
  globalForMock.academicRecords = [
    // Aarav Sharma
    { id: 'acad-1', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 88, maxMarks: 100, attendancePercent: 92 },
    { id: 'acad-2', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'Science', marks: 84, maxMarks: 100, attendancePercent: 92 },
    { id: 'acad-3', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'English', marks: 78, maxMarks: 100, attendancePercent: 92 },
    { id: 'acad-10', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 82, maxMarks: 100, attendancePercent: 92 },
    { id: 'acad-11', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 95, maxMarks: 100, attendancePercent: 92 },
    { id: 'acad-12', studentId: 'stud-aarav', termId: 'TERM_2_2025', subject: 'Hindi', marks: 74, maxMarks: 100, attendancePercent: 92 },
    
    // Riya Sharma
    { id: 'acad-4', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 95, maxMarks: 100, attendancePercent: 96 },
    { id: 'acad-5', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'Science', marks: 91, maxMarks: 100, attendancePercent: 96 },
    { id: 'acad-6', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'English', marks: 89, maxMarks: 100, attendancePercent: 96 },
    { id: 'acad-13', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 92, maxMarks: 100, attendancePercent: 96 },
    { id: 'acad-14', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 98, maxMarks: 100, attendancePercent: 96 },
    { id: 'acad-15', studentId: 'stud-riya', termId: 'TERM_2_2025', subject: 'Hindi', marks: 94, maxMarks: 100, attendancePercent: 96 },
    
    // Kabir Patel
    { id: 'acad-7', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 72, maxMarks: 100, attendancePercent: 88 },
    { id: 'acad-8', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'Science', marks: 80, maxMarks: 100, attendancePercent: 88 },
    { id: 'acad-9', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'English', marks: 85, maxMarks: 100, attendancePercent: 88 },
    { id: 'acad-16', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 78, maxMarks: 100, attendancePercent: 88 },
    { id: 'acad-17', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 86, maxMarks: 100, attendancePercent: 88 },
    { id: 'acad-18', studentId: 'stud-kabir', termId: 'TERM_2_2025', subject: 'Hindi', marks: 80, maxMarks: 100, attendancePercent: 88 },

    // Diya Gupta
    { id: 'acad-19', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 85, maxMarks: 100, attendancePercent: 94 },
    { id: 'acad-20', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'Science', marks: 88, maxMarks: 100, attendancePercent: 94 },
    { id: 'acad-21', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'English', marks: 90, maxMarks: 100, attendancePercent: 94 },
    { id: 'acad-22', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 84, maxMarks: 100, attendancePercent: 94 },
    { id: 'acad-23', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 92, maxMarks: 100, attendancePercent: 94 },
    { id: 'acad-24', studentId: 'stud-diya', termId: 'TERM_2_2025', subject: 'Hindi', marks: 86, maxMarks: 100, attendancePercent: 94 },

    // Aryan Malhotra
    { id: 'acad-25', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 92, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-26', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'Science', marks: 90, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-27', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'English', marks: 85, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-28', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 88, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-29', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 96, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-30', studentId: 'stud-aryan', termId: 'TERM_2_2025', subject: 'Hindi', marks: 82, maxMarks: 100, attendancePercent: 95 },

    // Ananya Sen
    { id: 'acad-31', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 96, maxMarks: 100, attendancePercent: 98 },
    { id: 'acad-32', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'Science', marks: 94, maxMarks: 100, attendancePercent: 98 },
    { id: 'acad-33', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'English', marks: 92, maxMarks: 100, attendancePercent: 98 },
    { id: 'acad-34', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 95, maxMarks: 100, attendancePercent: 98 },
    { id: 'acad-35', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 99, maxMarks: 100, attendancePercent: 98 },
    { id: 'acad-36', studentId: 'stud-ananya', termId: 'TERM_2_2025', subject: 'Sanskrit', marks: 98, maxMarks: 100, attendancePercent: 98 },

    // Rohan Joshi
    { id: 'acad-37', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 64, maxMarks: 100, attendancePercent: 82 },
    { id: 'acad-38', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'Science', marks: 70, maxMarks: 100, attendancePercent: 82 },
    { id: 'acad-39', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'English', marks: 75, maxMarks: 100, attendancePercent: 82 },
    { id: 'acad-40', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 68, maxMarks: 100, attendancePercent: 82 },
    { id: 'acad-41', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 72, maxMarks: 100, attendancePercent: 82 },
    { id: 'acad-42', studentId: 'stud-rohan', termId: 'TERM_2_2025', subject: 'Hindi', marks: 66, maxMarks: 100, attendancePercent: 82 },

    // Isha Rao
    { id: 'acad-43', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 80, maxMarks: 100, attendancePercent: 90 },
    { id: 'acad-44', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'Science', marks: 84, maxMarks: 100, attendancePercent: 90 },
    { id: 'acad-45', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'English', marks: 88, maxMarks: 100, attendancePercent: 90 },
    { id: 'acad-46', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 82, maxMarks: 100, attendancePercent: 90 },
    { id: 'acad-47', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 90, maxMarks: 100, attendancePercent: 90 },
    { id: 'acad-48', studentId: 'stud-isha', termId: 'TERM_2_2025', subject: 'Hindi', marks: 84, maxMarks: 100, attendancePercent: 90 },

    // Aanya Kapoor (Excellent academics)
    { id: 'acad-aanya-1', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 95, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-aanya-2', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'Science', marks: 94, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-aanya-3', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'English', marks: 91, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-aanya-4', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 93, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-aanya-5', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 96, maxMarks: 100, attendancePercent: 95 },
    { id: 'acad-aanya-6', studentId: 'stud-aanya', termId: 'TERM_2_2025', subject: 'Hindi', marks: 88, maxMarks: 100, attendancePercent: 95 },

    // Dev Kapoor (Excellent academics)
    { id: 'acad-dev-1', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'Mathematics', marks: 94, maxMarks: 100, attendancePercent: 93 },
    { id: 'acad-dev-2', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'Science', marks: 89, maxMarks: 100, attendancePercent: 93 },
    { id: 'acad-dev-3', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'English', marks: 92, maxMarks: 100, attendancePercent: 93 },
    { id: 'acad-dev-4', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'Social Studies', marks: 90, maxMarks: 100, attendancePercent: 93 },
    { id: 'acad-dev-5', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'Computer Science', marks: 93, maxMarks: 100, attendancePercent: 93 },
    { id: 'acad-dev-6', studentId: 'stud-dev', termId: 'TERM_2_2025', subject: 'Hindi', marks: 87, maxMarks: 100, attendancePercent: 93 },
  ];

  // 8. Achievements
  globalForMock.achievements = [
    { id: 'ach-1', studentId: 'stud-aarav', title: 'Inter-School Football Tournament Gold', category: 'SPORTS', level: 'DISTRICT', date: '2025-11-20' },
    { id: 'ach-2', studentId: 'stud-riya', title: 'State Level Spelling Bee Runner Up', category: 'ACADEMICS', level: 'STATE', date: '2025-09-15' },
    { id: 'ach-3', studentId: 'stud-kabir', title: 'National Level Cyber Olympiad Rank 42', category: 'ACADEMICS', level: 'NATIONAL', date: '2026-01-10' },
    { id: 'ach-4', studentId: 'stud-diya', title: 'District Drawing Competition First Place', category: 'ARTS', level: 'DISTRICT', date: '2025-12-05' },
    { id: 'ach-5', studentId: 'stud-aryan', title: 'CBSE Regional Science Exhibition Winner', category: 'ACADEMICS', level: 'DISTRICT', date: '2025-11-12' },
    { id: 'ach-6', studentId: 'stud-ananya', title: 'National Badminton Championship Gold', category: 'SPORTS', level: 'NATIONAL', date: '2026-02-18' },
    { id: 'ach-7', studentId: 'stud-rohan', title: 'Inter-School Debate Runner-Up', category: 'ACADEMICS', level: 'SCHOOL', date: '2025-10-24' },
    { id: 'ach-8', studentId: 'stud-isha', title: 'State Level Classical Dance Winner', category: 'ARTS', level: 'STATE', date: '2025-12-14' },
    
    // Aanya & Dev Achievements
    { id: 'ach-aanya-1', studentId: 'stud-aanya', title: 'Regional Abacus Gold Medalist', category: 'ACADEMICS', level: 'DISTRICT', date: '2025-10-18' },
    { id: 'ach-aanya-2', studentId: 'stud-aanya', title: 'State Science Talent Search Merit Rank 1', category: 'ACADEMICS', level: 'STATE', date: '2026-02-05' },
    { id: 'ach-dev-1', studentId: 'stud-dev', title: 'National Cyber Olympiad Silver Medalist', category: 'ACADEMICS', level: 'NATIONAL', date: '2025-12-10' },
    { id: 'ach-dev-2', studentId: 'stud-dev', title: 'Inter-School Robotics League Winner', category: 'ACADEMICS', level: 'SCHOOL', date: '2026-03-01' },
  ];

  // 9. Risk Scores
  globalForMock.riskScores = [
    { id: 'risk-aarav', studentId: 'stud-aarav', termId: 'TERM_3_2026', score: 65, explanation: 'Risk elevated due to outstanding overdue Term 3 invoice.', computedAt: new Date().toISOString() },
    { id: 'risk-riya', studentId: 'stud-riya', termId: 'TERM_3_2026', score: 65, explanation: 'Risk elevated due to outstanding overdue Term 3 invoice.', computedAt: new Date().toISOString() },
    { id: 'risk-kabir', studentId: 'stud-kabir', termId: 'TERM_3_2026', score: 5, explanation: 'Very low risk. Paid all invoices on time.', computedAt: new Date().toISOString() },
    { id: 'risk-diya', studentId: 'stud-diya', termId: 'TERM_3_2026', score: 20, explanation: 'Low risk. Paid on time except for a minor delay in Term 3.', computedAt: new Date().toISOString() },
    { id: 'risk-aryan', studentId: 'stud-aryan', termId: 'TERM_3_2026', score: 15, explanation: 'Low risk. All dues paid on time.', computedAt: new Date().toISOString() },
    { id: 'risk-ananya', studentId: 'stud-ananya', termId: 'TERM_3_2026', score: 2, explanation: 'Negligible risk. Perfect payment standing.', computedAt: new Date().toISOString() },
    { id: 'risk-rohan', studentId: 'stud-rohan', termId: 'TERM_3_2026', score: 70, explanation: 'High risk. Outstanding overdue invoice for Term 3.', computedAt: new Date().toISOString() },
    { id: 'risk-isha', studentId: 'stud-isha', termId: 'TERM_3_2026', score: 18, explanation: 'Low risk. Minor late payment history in Term 3.', computedAt: new Date().toISOString() },
    { id: 'risk-aanya', studentId: 'stud-aanya', termId: 'TERM_3_2026', score: 78, explanation: 'High risk. Overdue school fees for Term 3.', computedAt: new Date().toISOString() },
    { id: 'risk-dev', studentId: 'stud-dev', termId: 'TERM_3_2026', score: 15, explanation: 'Low risk. All invoices for this student have been cleared on time.', computedAt: new Date().toISOString() },
  ];

  // 10. EduScores (Fair, Excellent, Good)
  globalForMock.eduScores = [
    {
      id: 'edu-aarav',
      studentId: 'stud-aarav',
      score: 600,
      band: 'FAIR',
      history: [
        { score: 750, date: '2025-06-15' },
        { score: 680, date: '2025-11-02' },
        { score: 600, date: '2026-06-30' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-riya',
      studentId: 'stud-riya',
      score: 600,
      band: 'FAIR',
      history: [
        { score: 750, date: '2025-06-15' },
        { score: 680, date: '2025-11-02' },
        { score: 600, date: '2026-06-30' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-patel',
      studentId: 'stud-kabir',
      score: 840,
      band: 'EXCELLENT',
      history: [
        { score: 810, date: '2025-06-15' },
        { score: 830, date: '2025-10-12' },
        { score: 840, date: '2026-06-15' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-gupta',
      studentId: 'stud-diya',
      score: 810,
      band: 'GOOD',
      history: [
        { score: 730, date: '2025-06-15' },
        { score: 720, date: '2025-10-15' },
        { score: 810, date: '2026-06-18' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-malhotra',
      studentId: 'stud-aryan',
      score: 900,
      band: 'EXCELLENT',
      history: [
        { score: 750, date: '2025-06-15' },
        { score: 900, date: '2026-06-15' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-sen',
      studentId: 'stud-ananya',
      score: 900,
      band: 'EXCELLENT',
      history: [
        { score: 870, date: '2025-06-15' },
        { score: 900, date: '2026-06-15' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-joshi',
      studentId: 'stud-rohan',
      score: 590,
      band: 'FAIR',
      history: [
        { score: 640, date: '2025-06-15' },
        { score: 590, date: '2026-06-30' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-rao',
      studentId: 'stud-isha',
      score: 810,
      band: 'GOOD',
      history: [
        { score: 740, date: '2025-06-15' },
        { score: 810, date: '2026-06-20' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-aanya',
      studentId: 'stud-aanya',
      score: 560,
      band: 'FAIR',
      history: [
        { score: 620, date: '2025-06-15' },
        { score: 560, date: '2026-06-25' },
      ],
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'edu-dev',
      studentId: 'stud-dev',
      score: 820,
      band: 'EXCELLENT',
      history: [
        { score: 780, date: '2025-06-15' },
        { score: 820, date: '2026-06-25' },
      ],
      lastUpdated: new Date().toISOString(),
    },
  ];

  // 11. Programmatically generate remaining students to have at least 10 in each school
  const schoolsList = ['school-a-uuid', 'school-b-uuid', 'school-c-uuid'];
  const indianFirstNames = [
    'Aarav', 'Kabir', 'Rohan', 'Aryan', 'Ishan', 'Vihaan', 'Arjun', 'Aditya', 'Dev', 'Sai', 
    'Reyansh', 'Krishna', 'Pranav', 'Siddharth', 'Yash', 'Rahul', 'Nikhil', 'Vijay', 'Amit',
    'Riya', 'Diya', 'Ananya', 'Isha', 'Advika', 'Kavya', 'Anvi', 'Kiara', 'Zara', 'Samaira', 
    'Navya', 'Ahana', 'Priya', 'Sneha', 'Pooja', 'Divya', 'Meera', 'Neha', 'Tanvi', 'Kiran'
  ];
  const indianLastNames = [
    'Sharma', 'Patel', 'Gupta', 'Malhotra', 'Sen', 'Joshi', 'Rao', 'Nair', 'Verma', 'Iyer', 
    'Reddy', 'Choudhury', 'Das', 'Saxena', 'Bhat', 'Pillai', 'Trivedi', 'Kapoor', 'Khanna', 'Verma'
  ];
  
  const subjects = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];
  const achievementTitles = [
    'Inter-School Debating Competition Winner',
    'State Level Cyber Olympiad Silver Medalist',
    'District Badminton Singles Under-15 Champion',
    'Creative Writing Contest First Prize',
    'All-India Mathematics Olympiad Top 100 Rank',
    'School Annual Day Drama Best Performance',
    'Regional Science Fair Innovation Special Mention',
    'District Chess Tournament Runner Up',
    'Inter-House Spell Bee First Place',
    'Classical Music Solo Performance Gold Medal',
    'State Painting Exhibition Runner Up'
  ];
  const achievementCategories = ['ACADEMICS', 'SPORTS', 'ARTS', 'MUSIC'];
  const achievementLevels = ['SCHOOL', 'DISTRICT', 'STATE', 'NATIONAL'];

  schoolsList.forEach(schoolId => {
    // Count current students in this school
    const currentStudentsCount = globalForMock.students.filter(s => s.currentSchoolId === schoolId).length;
    const studentsNeeded = 10 - currentStudentsCount;
    
    for (let index = 0; index < studentsNeeded; index++) {
      const idx = schoolId + '-gen-' + index;
      const fName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
      const lName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
      const fullName = `${fName} ${lName}`;
      
      const guardianId = 'guard-gen-' + idx;
      const familyId = 'family-gen-' + idx;
      const guardianName = `${fName} ${lName}'s Guardian`;
      
      // 1. Create Guardian
      globalForMock.guardians.push({
        id: guardianId,
        name: guardianName,
        contact: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
        familyId
      });
      
      // 2. Create UserProfile
      globalForMock.userProfiles.push({
        id: 'auth-gen-' + idx,
        email: `parent.${fName.toLowerCase()}.${lName.toLowerCase()}@vidya.com`,
        name: guardianName,
        role: 'PARENT',
        guardianId
      });
      
      // 3. Create Student (assign Grade 8-12 and Roll 1-40)
      const grades = ['Grade 8-A', 'Grade 8-B', 'Grade 9-A', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B', 'Grade 12-A'];
      const studentClass = grades[Math.floor(Math.random() * grades.length)];
      const rollNumber = String(Math.floor(1 + Math.random() * 39)).padStart(2, '0');
      
      globalForMock.students.push({
        id: 'stud-gen-' + idx,
        name: fullName,
        guardianId,
        currentSchoolId: schoolId,
        enrollmentHistory: [{ schoolId, startTerm: 'TERM_1_2024', endTerm: 'ONGOING' }],
        studentClass,
        rollNumber
      });
      
      // 4. Invoices
      const payerProfile = Math.random(); // 0-0.4: Excellent, 0.4-0.7: Good, 0.7-0.9: Fair, 0.9-1.0: Poor
      const termAmounts = [40000, 45000, 42000, 48000];
      const invStatuses: ('PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'PLAN_ACTIVE')[] = ['PAID', 'PAID', 'PAID', 'PENDING'];
      if (payerProfile > 0.9) {
        invStatuses[2] = 'OVERDUE';
      } else if (payerProfile > 0.7) {
        invStatuses[2] = 'OVERDUE';
      }
      
      invStatuses.forEach((status, termIdx) => {
        const invId = `inv-gen-${idx}-t${termIdx}`;
        const amt = termAmounts[termIdx];
        const dueDate = termIdx === 0 ? '2025-06-15' : termIdx === 1 ? '2025-10-15' : termIdx === 2 ? '2026-06-15' : '2026-10-15';
        
        globalForMock.invoices.push({
          id: invId,
          studentId: 'stud-gen-' + idx,
          termId: `TERM_${termIdx + 1}_2025`,
          amountDue: amt,
          dueDate,
          status
        });
        
        if (status === 'PAID') {
          let payOffsetDays = Math.floor(-10 + Math.random() * 5); // pay 5-10 days early
          if (payerProfile > 0.8) {
            payOffsetDays = Math.floor(2 + Math.random() * 15); // pay 2-17 days late
          }
          
          const dueObj = new Date(dueDate);
          const payDateObj = new Date(dueObj.getTime() + payOffsetDays * 24 * 60 * 60 * 1000);
          const paidDate = payDateObj.toISOString().split('T')[0];
          
          globalForMock.payments.push({
            id: `pay-gen-${idx}-t${termIdx}`,
            invoiceId: invId,
            amount: amt,
            paidDate,
            method: 'UPI'
          });
        }
      });
      
      // Simulate excellent prepayments for term 4
      if (payerProfile < 0.25) {
        const term4Inv = globalForMock.invoices.find(i => i.id === `inv-gen-${idx}-t3`);
        if (term4Inv) {
          term4Inv.status = 'PAID';
          const dueObj = new Date(term4Inv.dueDate);
          const payDateObj = new Date(dueObj.getTime() - 15 * 24 * 60 * 60 * 1000);
          const paidDate = payDateObj.toISOString().split('T')[0];
          
          globalForMock.payments.push({
            id: `pay-gen-${idx}-t3-prepaid`,
            invoiceId: term4Inv.id,
            amount: term4Inv.amountDue,
            paidDate,
            method: 'CARD'
          });
        }
      }
      
      // Inline dynamic score calculations to prevent circular dependencies
      let riskScore = 10;
      let eduScoreVal = 700;
      let band: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'BUILDING_HISTORY' = 'GOOD';
      
      const hasOverdue = invStatuses[2] === 'OVERDUE';
      if (hasOverdue) {
        riskScore = 70 + Math.floor(Math.random() * 15);
        eduScoreVal = 580 + Math.floor(Math.random() * 30);
        band = 'FAIR';
      } else {
        if (payerProfile < 0.25) {
          riskScore = 2 + Math.floor(Math.random() * 4);
          eduScoreVal = 850 + Math.floor(Math.random() * 45);
          band = 'EXCELLENT';
        } else if (payerProfile > 0.8) {
          riskScore = 30 + Math.floor(Math.random() * 15);
          eduScoreVal = 710 + Math.floor(Math.random() * 30);
          band = 'GOOD';
        } else {
          riskScore = 5 + Math.floor(Math.random() * 8);
          eduScoreVal = 810 + Math.floor(Math.random() * 35);
          band = 'EXCELLENT';
        }
      }
      
      globalForMock.riskScores.push({
        id: `risk-gen-${idx}`,
        studentId: 'stud-gen-' + idx,
        termId: 'TERM_3_2026',
        score: riskScore,
        explanation: hasOverdue ? 'Active unpaid overdue invoice.' : 'Excellent repayment record.',
        computedAt: new Date().toISOString()
      });
      
      globalForMock.eduScores.push({
        id: `edu-gen-${idx}`,
        studentId: 'stud-gen-' + idx,
        score: eduScoreVal,
        band,
        history: [
          { score: eduScoreVal - 20, date: '2025-06-15' },
          { score: eduScoreVal, date: '2026-06-15' }
        ],
        lastUpdated: new Date().toISOString()
      });
      
      // 5. Academic Records (6 subjects)
      subjects.forEach((sub, subIdx) => {
        let baseMarks = 70;
        if (payerProfile < 0.2) baseMarks = 88;
        else if (payerProfile > 0.8) baseMarks = 55;
        
        const marks = Math.min(100, Math.round(baseMarks + Math.random() * 12));
        
        globalForMock.academicRecords.push({
          id: `acad-gen-${idx}-${subIdx}`,
          studentId: 'stud-gen-' + idx,
          termId: 'TERM_2_2025',
          subject: sub,
          marks,
          maxMarks: 100,
          attendancePercent: Math.min(100, Math.round(85 + Math.random() * 15))
        });
      });
      
      // 6. Achievements (extracurriculars)
      // "each having a minimum of 1 co curricular activities and some having 2-3 in the year and 1 student with 5-6."
      let achievementsCount = 1;
      if (schoolId === 'school-a-uuid' && index === 0) {
        achievementsCount = 6; // 1 student with 6 achievements
      } else if (Math.random() > 0.7) {
        achievementsCount = Math.floor(2 + Math.random() * 2); // some 2-3 achievements
      }
      
      for (let aIdx = 0; aIdx < achievementsCount; aIdx++) {
        const titleIdx = Math.floor(Math.random() * achievementTitles.length);
        const catIdx = Math.floor(Math.random() * achievementCategories.length);
        const levIdx = Math.floor(Math.random() * achievementLevels.length);
        
        globalForMock.achievements.push({
          id: `ach-gen-${idx}-${aIdx}`,
          studentId: 'stud-gen-' + idx,
          title: achievementTitles[titleIdx],
          category: achievementCategories[catIdx] as any,
          level: achievementLevels[levIdx] as any,
          date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 27)).toISOString().split('T')[0]
        });
      }
    }
  });

  globalForMock.paymentPlans = [];
  globalForMock.passports = [];
  globalForMock.transferRequests = [];
  globalForMock.notifications = [
    {
      id: 'notif-1',
      guardianId: 'guard-ramesh',
      title: 'Welcome to Vidya360',
      message: 'Your parent trust scoring profile has been initialized. Clear dues early to maintain an Excellent standing.',
      sentAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      read: false,
      type: 'FEE_REMINDER'
    }
  ];
  globalForMock.chatMessages = [
    {
      id: 'chat-init-1',
      studentId: 'stud-aarav',
      sender: 'SCHOOL',
      message: 'Hello Mr. Sharma, this is Greenwood International office. We wanted to reach out regarding Aarav\'s academic progress and term dues.',
      sentAt: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];

  globalForMock.escrowFunds = [
    { id: 'fund-gw-1', schoolId: 'school-a-uuid', source: 'Greenwood Alumni Association (Batch 2015)', totalAmount: 68000, remainingAmount: 68452, createdAt: '2026-06-01', interestRate: 6.5, accruedInterest: 452 },
    { id: 'fund-dps-1', schoolId: 'school-b-uuid', source: 'Tata Trusts CSR Program', totalAmount: 74000, remainingAmount: 74586, createdAt: '2026-05-20', interestRate: 5.8, accruedInterest: 586 },
    { id: 'fund-dav-1', schoolId: 'school-c-uuid', source: 'HDFC CSR Foundation', totalAmount: 59000, remainingAmount: 59298, createdAt: '2026-06-10', interestRate: 6.2, accruedInterest: 298 },
  ];
  globalForMock.escrowDisbursements = [];

  globalForMock.mockStateInitialized = true;
}

const STATE_FILE_PATH = path.join(process.cwd(), 'src/lib/db_state.json');

// Attempt to load from JSON file to persist state across restarts
if (fs.existsSync(STATE_FILE_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf-8'));
    if (data.invoices) globalForMock.invoices = data.invoices;
    if (data.payments) globalForMock.payments = data.payments;
    if (data.riskScores) globalForMock.riskScores = data.riskScores;
    if (data.eduScores) globalForMock.eduScores = data.eduScores;
    if (data.paymentPlans) globalForMock.paymentPlans = data.paymentPlans;
    if (data.passports) globalForMock.passports = data.passports;
    if (data.transferRequests) globalForMock.transferRequests = data.transferRequests;
    if (data.notifications) globalForMock.notifications = data.notifications;
    if (data.chatMessages) globalForMock.chatMessages = data.chatMessages;
    if (data.escrowFunds) globalForMock.escrowFunds = data.escrowFunds;
    if (data.escrowDisbursements) globalForMock.escrowDisbursements = data.escrowDisbursements;
    globalForMock.mockStateInitialized = true;
  } catch (err) {
    console.error('Error loading mockDb state from file:', err);
  }
} else {
  // If no file exists, save the initial seeded state
  try {
    const data = {
      invoices: globalForMock.invoices || [],
      payments: globalForMock.payments || [],
      riskScores: globalForMock.riskScores || [],
      eduScores: globalForMock.eduScores || [],
      paymentPlans: globalForMock.paymentPlans || [],
      passports: globalForMock.passports || [],
      transferRequests: globalForMock.transferRequests || [],
      notifications: globalForMock.notifications || [],
      chatMessages: globalForMock.chatMessages || [],
      escrowFunds: globalForMock.escrowFunds || [],
      escrowDisbursements: globalForMock.escrowDisbursements || []
    };
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial state file:', err);
  }
}

export function saveMockDb() {
  try {
    const data = {
      invoices: globalForMock.invoices || [],
      payments: globalForMock.payments || [],
      riskScores: globalForMock.riskScores || [],
      eduScores: globalForMock.eduScores || [],
      paymentPlans: globalForMock.paymentPlans || [],
      passports: globalForMock.passports || [],
      transferRequests: globalForMock.transferRequests || [],
      notifications: globalForMock.notifications || [],
      chatMessages: globalForMock.chatMessages || [],
      escrowFunds: globalForMock.escrowFunds || [],
      escrowDisbursements: globalForMock.escrowDisbursements || []
    };
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving mockDb state to file:', err);
  }
}

// Guaranteed fallbacks to prevent undefined property errors on hot reload
globalForMock.transferRequests = globalForMock.transferRequests || [];
globalForMock.paymentPlans = globalForMock.paymentPlans || [];
globalForMock.passports = globalForMock.passports || [];
globalForMock.notifications = globalForMock.notifications || [];
globalForMock.chatMessages = globalForMock.chatMessages || [];
globalForMock.escrowFunds = globalForMock.escrowFunds || [];
globalForMock.escrowDisbursements = globalForMock.escrowDisbursements || [];

export const mockDb = globalForMock;
