import { prisma } from './prisma';
import { mockDb, MockFeeInvoice, MockPayment, saveMockDb } from './mockDb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vidya360-hackathon-super-secret-key-2026';

// Helper to determine if we are in Mock Mode
export function isMockMode() {
  return !process.env.DATABASE_URL;
}

// ----------------------------------------------------
// 1. UTILITY ALGORITHMS (Risk Scoring & EduScore & EMI)
// ----------------------------------------------------

/**
 * Calculates a defaulter risk score (0-100) for a family based on their payment history.
 * A higher score means a higher probability of default.
 */
export function calculateRiskScoreLogic(
  invoices: { dueDate: Date | string; status: string; amountDue: number; payments: { paidDate: Date | string }[] }[],
  siblingCount: number
): { score: number; explanation: string } {
  let score = 20; // Base score
  const reasons: string[] = [];

  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID');

  // Penalty 1: Overdue Invoices
  if (overdueInvoices.length > 0) {
    const penalty = overdueInvoices.length * 25;
    score += penalty;
    reasons.push(`${overdueInvoices.length} currently overdue invoice(s) (+${penalty} risk)`);
  }

  // Penalty 2: Sibling Multiplier (fee burden increases default risk)
  if (siblingCount > 1) {
    score += 10;
    reasons.push(`Multiple siblings enrolled (${siblingCount}) increasing combined fee load (+10 risk)`);
  }

  // Penalty 3: Days Past Due (DPD) on past invoices
  let totalDpd = 0;
  let latePaymentsCount = 0;

  paidInvoices.forEach(inv => {
    const due = new Date(inv.dueDate);
    inv.payments.forEach(pay => {
      const paid = new Date(pay.paidDate);
      const diffTime = paid.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        totalDpd += diffDays;
        latePaymentsCount++;
      }
    });
  });

  if (latePaymentsCount > 0) {
    const avgDpd = totalDpd / latePaymentsCount;
    const dpdPenalty = Math.min(Math.round(avgDpd * 1.5), 30);
    score += dpdPenalty;
    reasons.push(`Average past late payment of ${Math.round(avgDpd)} days (+${dpdPenalty} risk)`);
  }

  // On-time Ratio adjustments
  const totalCompleted = paidInvoices.length;
  if (totalCompleted > 0) {
    const onTimeCount = totalCompleted - latePaymentsCount;
    const onTimeRatio = onTimeCount / totalCompleted;

    if (onTimeRatio >= 0.9) {
      score -= 15;
      reasons.push(`Excellent on-time ratio of ${Math.round(onTimeRatio * 100)}% (-15 credit)`);
    } else if (onTimeRatio < 0.5) {
      score += 20;
      reasons.push(`Poor payment punctuality: only ${Math.round(onTimeRatio * 100)}% on time (+20 risk)`);
    }
  }

  // Bound the score
  const finalScore = Math.max(0, Math.min(100, score));
  const explanation = reasons.length > 0 
    ? reasons.join(', ') + '.' 
    : 'No risk indicators detected. Excellent standing.';

  return { score: finalScore, explanation };
}

/**
 * Calculates a family credit standing score (300 to 900) based on payment consistency and history.
 */
export function calculateEduScoreLogic(
  invoices: { dueDate: Date | string; status: string; payments: { paidDate: Date | string; method?: string }[] }[],
  siblingCount: number
): { score: number; band: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'BUILDING_HISTORY' } {
  // Start with a strong baseline of 700 (Good standing)
  let score = 700;

  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
  const activePlanInvoices = invoices.filter(inv => inv.status === 'PLAN_ACTIVE');
  const totalInvoices = invoices.length;

  if (totalInvoices === 0) {
    return { score: 750, band: 'GOOD' };
  }

  // 1. Payment History (Max +150 points boost or up to -150 penalty)
  let latePayments = 0;
  paidInvoices.forEach(inv => {
    const due = new Date(inv.dueDate);
    inv.payments.forEach(pay => {
      const paid = new Date(pay.paidDate);
      const isFunded = pay.method === 'SCHOLARSHIP' || pay.method === 'ESCROW';
      if (paid > due && !isFunded) {
        latePayments++;
      }
    });
  });

  const paidCount = paidInvoices.length;
  if (paidCount > 0) {
    const onTimeRatio = (paidCount - latePayments) / paidCount;
    if (onTimeRatio >= 0.95) {
      score += 150; // Perfect history boost
    } else if (onTimeRatio >= 0.8) {
      score += 100;
    } else if (onTimeRatio >= 0.6) {
      score += 50;
    } else if (onTimeRatio >= 0.4) {
      score += 10;
    } else {
      score -= 30; // Mild penalty for late payments, since they still cleared the debt
    }
  }

  // 2. Active Default / Debt Burden (Max +50 points boost or up to -150 penalty)
  if (overdueInvoices.length === 0) {
    score += 50; // Clean sheet boost
  } else if (overdueInvoices.length === 1) {
    score -= 60;
  } else if (overdueInvoices.length === 2) {
    score -= 100;
  } else {
    score -= 150; // Critical default
  }

  // 3. Sibling consistency (Max +30 points boost, no negative penalty)
  if (siblingCount > 1 && overdueInvoices.length === 0) {
    score += 30; // Boost for paying for multiple siblings on time
  }

  // 4. Data Depth / Tenure (Max +20 points boost, no negative penalty)
  if (totalInvoices >= 6) {
    score += 20;
  } else if (totalInvoices >= 3) {
    score += 10;
  }

  // 5. Proactive engagement (Max +30 points boost or up to -30 penalty)
  if (activePlanInvoices.length > 0) {
    score += 30; // Boost for proactive EMI planning
  } else if (overdueInvoices.length > 0) {
    score -= 30; // Penalty for default without EMI split
  }

  // 6. Prepayment / Early Payment bonus (Max +100 points, no penalty)
  let prepaymentsCount = 0;
  invoices.forEach(inv => {
    const due = new Date(inv.dueDate);
    const invoicePaidEarly = inv.payments.some(pay => {
      const paid = new Date(pay.paidDate);
      const diffTime = due.getTime() - paid.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 5; // Paid at least 5 days early
    });
    if (invoicePaidEarly) {
      prepaymentsCount++;
    }
  });
  if (prepaymentsCount > 0) {
    score += Math.min(100, prepaymentsCount * 30);
  }

  // Clamp the score between 300 and 900
  const finalScore = Math.max(300, Math.min(900, score));

  // Bands definition
  let band: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'BUILDING_HISTORY';
  if (finalScore >= 800) band = 'EXCELLENT';
  else if (finalScore >= 700) band = 'GOOD';
  else if (finalScore >= 600) band = 'FAIR';
  else band = 'BUILDING_HISTORY';

  return { score: finalScore, band };
}

/**
 * Generates an EMI installment plan based on risk band
 */
export function generateInstallmentPlanLogic(
  amountDue: number,
  riskScore: number
): { installments: { dueDate: string; amount: number; status: 'PAID' | 'PENDING' }[]; riskBand: 'LOW' | 'MEDIUM' | 'HIGH' } {
  let riskBand: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let installmentsCount = 1;

  if (riskScore >= 70) {
    riskBand = 'HIGH';
    installmentsCount = 5; // 5 monthly micro-installments for high risk
  } else if (riskScore >= 30) {
    riskBand = 'MEDIUM';
    installmentsCount = 3; // 3 installments for medium risk
  }

  const installments: { dueDate: string; amount: number; status: 'PAID' | 'PENDING' }[] = [];
  const baseAmount = Math.floor(amountDue / installmentsCount);
  const remainder = amountDue - baseAmount * installmentsCount;

  const today = new Date();
  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(today.getMonth() + i - 1); // first installment due today/soon, subsequent monthly
    dueDate.setDate(15); // set to 15th of the month

    installments.push({
      dueDate: dueDate.toISOString().split('T')[0],
      amount: i === installmentsCount ? baseAmount + remainder : baseAmount,
      status: 'PENDING',
    });
  }

  return { installments, riskBand };
}

// ----------------------------------------------------
// 2. DATA ACCESS IMPLEMENTATIONS (Prisma vs MockDB)
// ----------------------------------------------------

export async function getSchools() {
  if (isMockMode()) {
    return mockDb.schools;
  }
  return await prisma.school.findMany({ orderBy: { name: 'asc' } });
}

export async function getUserProfile(userId: string) {
  if (isMockMode()) {
    return mockDb.userProfiles.find(u => u.id === userId) || null;
  }
  return await prisma.userProfile.findUnique({
    where: { id: userId },
    include: { guardian: true },
  });
}

export async function createUserProfile(id: string, email: string, name: string, role: 'ADMIN' | 'PARENT', guardianId?: string) {
  if (isMockMode()) {
    const newProfile = { id, email, name, role, guardianId };
    mockDb.userProfiles.push(newProfile);
    return newProfile;
  }
  return await prisma.userProfile.create({
    data: { id, email, name, role, guardianId },
  });
}

export async function getStudentsBySchool(schoolId: string) {
  if (isMockMode()) {
    return mockDb.students
      .filter(s => s.currentSchoolId === schoolId)
      .map(s => {
        const guardian = mockDb.guardians.find(g => g.id === s.guardianId);
        const edu = mockDb.eduScores.find(e => e.studentId === s.id);
        const risk = mockDb.riskScores.find(r => r.studentId === s.id);
        const invoices = mockDb.invoices.filter(i => i.studentId === s.id);
        return { 
          ...s, 
          guardian: guardian ? { ...guardian, eduScore: edu } : null, 
          eduScore: edu, 
          riskScore: risk,
          invoices 
        };
      });
  }
  const dbStudents = await prisma.student.findMany({
    where: { currentSchoolId: schoolId },
    include: {
      guardian: true,
      invoices: true,
    },
  });

  const familyIds = dbStudents.map(s => s.guardian.familyId);

  const [eduScores, riskScores] = await Promise.all([
    prisma.eduScore.findMany({
      where: { familyId: { in: familyIds } },
    }),
    prisma.riskScore.findMany({
      where: { familyId: { in: familyIds } },
    })
  ]);

  return dbStudents.map(s => {
    const eduScore = eduScores.find(e => e.familyId === s.guardian.familyId) || null;
    const riskScore = riskScores.find(r => r.familyId === s.guardian.familyId) || null;
    return {
      ...s,
      guardian: {
        ...s.guardian,
        eduScore,
      },
      eduScore,
      riskScore,
    };
  });
}

export async function getStudentDetails(studentId: string) {
  if (isMockMode()) {
    const student = mockDb.students.find(s => s.id === studentId);
    if (!student) return null;

    const guardian = mockDb.guardians.find(g => g.id === student.guardianId);
    const invoices = mockDb.invoices.filter(i => i.studentId === studentId);
    
    // Attach payments and payment plans
    const invoicesWithDetails = invoices.map(inv => {
      const payments = mockDb.payments.filter(p => p.invoiceId === inv.id);
      const paymentPlan = mockDb.paymentPlans.find(p => p.invoiceId === inv.id) || null;
      return { ...inv, payments, paymentPlan };
    });

    const academicRecords = mockDb.academicRecords.filter(a => a.studentId === studentId);
    const achievements = mockDb.achievements.filter(a => a.studentId === studentId);
    const eduScore = mockDb.eduScores.find(e => e.studentId === studentId) || null;
    const riskScore = mockDb.riskScores.find(r => r.studentId === studentId) || null;

    return {
      ...student,
      guardian,
      invoices: invoicesWithDetails,
      academicRecords,
      achievements,
      eduScore,
      riskScore,
    };
  }

  // Prisma implementation
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      guardian: true,
      invoices: {
        include: {
          payments: true,
          paymentPlan: true,
        },
      },
      academicRecords: true,
      achievements: true,
    },
  });
  if (!student) return null;

  const eduScore = await prisma.eduScore.findUnique({
    where: { familyId: student.guardian.familyId },
  });
  const riskScore = await prisma.riskScore.findFirst({
    where: { familyId: student.guardian.familyId },
    orderBy: { computedAt: 'desc' },
  });

  return {
    ...student,
    eduScore,
    riskScore,
  };
}

export async function getGuardianByUserId(userId: string) {
  if (isMockMode()) {
    const user = mockDb.userProfiles.find(u => u.id === userId);
    if (!user || !user.guardianId) return null;

    const guardian = mockDb.guardians.find(g => g.id === user.guardianId);
    if (!guardian) return null;

    const students = mockDb.students.filter(s => s.guardianId === guardian.id);
    const firstStudentId = students[0]?.id;
    const eduScore = firstStudentId ? mockDb.eduScores.find(e => e.studentId === firstStudentId) || null : null;
    const riskScore = firstStudentId ? mockDb.riskScores.find(r => r.studentId === firstStudentId) || null : null;

    return {
      ...guardian,
      students,
      eduScore,
      riskScore,
    };
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    include: {
      guardian: {
        include: {
          students: true,
        },
      },
    },
  });

  if (!profile || !profile.guardian) return null;

  const eduScore = await prisma.eduScore.findUnique({
    where: { familyId: profile.guardian.familyId },
  });
  const riskScore = await prisma.riskScore.findFirst({
    where: { familyId: profile.guardian.familyId },
    orderBy: { computedAt: 'desc' },
  });

  return {
    ...profile.guardian,
    eduScore,
    riskScore,
  };
}

// ----------------------------------------------------
// 3. CORE HACKATHON LOGIC (EMI Request & Payments)
// ----------------------------------------------------

/**
 * Triggers re-calculation of Defaulter Risk and EduScore for a family
 */
export async function recomputeStudentScores(studentId: string) {
  let invoicesList: { dueDate: Date | string; status: string; amountDue: number; payments: { paidDate: Date | string; method?: string }[] }[] = [];
  let siblingCount = 0;

  if (isMockMode()) {
    const student = mockDb.students.find(s => s.id === studentId);
    const guardian = mockDb.guardians.find(g => g.id === student?.guardianId);
    const familyStudents = mockDb.students.filter(s => s.guardianId === guardian?.id);
    siblingCount = familyStudents.length;

    const invoices = mockDb.invoices.filter(i => i.studentId === studentId);

    invoicesList = invoices.map(inv => {
      const payments = mockDb.payments.filter(p => p.invoiceId === inv.id);
      return {
        dueDate: inv.dueDate,
        status: inv.status,
        amountDue: inv.amountDue,
        payments: payments.map(p => ({ paidDate: p.paidDate, method: p.method })),
      };
    });

    // 1. Calculate new Risk Score
    const riskResult = calculateRiskScoreLogic(invoicesList, siblingCount);
    // Update or Insert in MockDB
    const existingRisk = mockDb.riskScores.find(r => r.studentId === studentId);
    if (existingRisk) {
      existingRisk.score = riskResult.score;
      existingRisk.explanation = riskResult.explanation;
      existingRisk.computedAt = new Date().toISOString();
    } else {
      mockDb.riskScores.push({
        id: 'mock-risk-' + Math.random().toString(36).substr(2, 9),
        studentId,
        termId: 'TERM_3_2026',
        score: riskResult.score,
        explanation: riskResult.explanation,
        computedAt: new Date().toISOString(),
      } as any);
    }

    // 2. Calculate new EduScore
    const eduResult = calculateEduScoreLogic(invoicesList, siblingCount);
    const existingEdu = mockDb.eduScores.find(e => e.studentId === studentId);
    if (existingEdu) {
      existingEdu.score = eduResult.score;
      existingEdu.band = eduResult.band;
      existingEdu.history.push({ score: eduResult.score, date: new Date().toISOString().split('T')[0] });
      existingEdu.lastUpdated = new Date().toISOString();
    } else {
      mockDb.eduScores.push({
        id: 'mock-edu-' + Math.random().toString(36).substr(2, 9),
        studentId,
        score: eduResult.score,
        band: eduResult.band,
        history: [{ score: eduResult.score, date: new Date().toISOString().split('T')[0] }],
        lastUpdated: new Date().toISOString(),
      } as any);
    }

    saveMockDb();
    return { risk: riskResult, edu: eduResult };
  }

  // Prisma database implementation
  const targetStudent = await prisma.student.findUnique({
    where: { id: studentId },
    include: { guardian: true }
  });
  if (!targetStudent) throw new Error('Student not found');
  const familyId = targetStudent.guardian.familyId;

  const students = await prisma.student.findMany({
    where: { guardian: { familyId } },
    include: {
      invoices: {
        include: { payments: true },
      },
    },
  });

  siblingCount = students.length;
  students.forEach(stud => {
    stud.invoices.forEach(inv => {
      invoicesList.push({
        dueDate: inv.dueDate,
        status: inv.status,
        amountDue: inv.amountDue,
        payments: inv.payments.map(p => ({ paidDate: p.paidDate, method: p.method })),
      });
    });
  });

  // Risk Score calculation
  const riskResult = calculateRiskScoreLogic(invoicesList, siblingCount);
  await prisma.riskScore.create({
    data: {
      familyId,
      termId: 'TERM_3_2026',
      score: riskResult.score,
      explanation: riskResult.explanation,
    },
  });

  // EduScore calculation
  const eduResult = calculateEduScoreLogic(invoicesList, siblingCount);
  const existingEdu = await prisma.eduScore.findUnique({ where: { familyId } });

  if (existingEdu) {
    const historyList = existingEdu.history as Array<{ score: number; date: string }>;
    historyList.push({ score: eduResult.score, date: new Date().toISOString().split('T')[0] });
    await prisma.eduScore.update({
      where: { familyId },
      data: {
        score: eduResult.score,
        band: eduResult.band,
        history: historyList,
      },
    });
  } else {
    await prisma.eduScore.create({
      data: {
        familyId,
        score: eduResult.score,
        band: eduResult.band,
        history: [{ score: eduResult.score, date: new Date().toISOString().split('T')[0] }],
      },
    });
  }

  return { risk: riskResult, edu: eduResult };
}

/**
 * Record a payment, recalculate scores
 */
export async function payInvoice(invoiceId: string, amount: number, method: string) {
  let guardianFamilyId = '';

  if (isMockMode()) {
    const invoice = mockDb.invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const paymentId = 'pay-' + Math.random().toString(36).substr(2, 9);
    mockDb.payments.push({
      id: paymentId,
      invoiceId,
      amount,
      paidDate: new Date().toISOString().split('T')[0],
      method,
    });

    // Check if fully paid
    const totalPaid = mockDb.payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= invoice.amountDue) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIAL';
    }

    // Also update installment plan if exists
    const plan = mockDb.paymentPlans.find(p => p.invoiceId === invoiceId);
    if (plan) {
      const installments = plan.installments;
      // Mark first unpaid installment as paid
      const unpaid = installments.find(inst => inst.status === 'PENDING');
      if (unpaid) {
        unpaid.status = 'PAID';
      }
      
      // If all installments are paid, mark invoice as paid
      const allPaid = installments.every(inst => inst.status === 'PAID');
      if (allPaid) {
        invoice.status = 'PAID';
      }
    }

    const student = mockDb.students.find(s => s.id === invoice.studentId);
    const guardian = mockDb.guardians.find(g => g.id === student?.guardianId);
    guardianFamilyId = guardian?.familyId || '';
  } else {
    // Prisma Implementation
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { include: { guardian: true } },
        payments: true,
      },
    });
    if (!invoice) throw new Error('Invoice not found');

    await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        paidDate: new Date(),
        method,
      },
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
    let newStatus = 'PARTIAL';
    if (totalPaid >= invoice.amountDue) {
      newStatus = 'PAID';
    }

    await prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    // Update payment plan installments if applicable
    const plan = await prisma.paymentPlan.findUnique({ where: { invoiceId } });
    if (plan) {
      const installments = plan.installments as Array<{ dueDate: string; amount: number; status: 'PAID' | 'PENDING' }>;
      const unpaid = installments.find(inst => inst.status === 'PENDING');
      if (unpaid) {
        unpaid.status = 'PAID';
      }
      
      const allPaid = installments.every(inst => inst.status === 'PAID');
      if (allPaid) {
        await prisma.feeInvoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' },
        });
      }

      await prisma.paymentPlan.update({
        where: { invoiceId },
        data: { installments },
      });
    }

    guardianFamilyId = invoice.student.guardian.familyId;
  }

  // Recalculate scores
  if (isMockMode()) {
    const invoice = mockDb.invoices.find(i => i.id === invoiceId);
    if (invoice?.studentId) {
      await recomputeStudentScores(invoice.studentId);
    }
  } else {
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { student: true }
    });
    if (invoice?.studentId) {
      await recomputeStudentScores(invoice.studentId);
    }
  }
}

/**
 * Request an EMI payment plan for an overdue invoice.
 * Plan is sized based on the family's Risk Score.
 */
export async function requestPaymentPlan(invoiceId: string) {
  let riskScoreValue = 50; // default medium

  if (isMockMode()) {
    const invoice = mockDb.invoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const risk = mockDb.riskScores.find(r => r.studentId === invoice.studentId);
    if (risk) riskScoreValue = risk.score;

    const plan = generateInstallmentPlanLogic(invoice.amountDue, riskScoreValue);
    
    // Save to MockDB
    const existingPlan = mockDb.paymentPlans.find(p => p.invoiceId === invoiceId);
    if (existingPlan) {
      existingPlan.installments = plan.installments;
      existingPlan.riskBand = plan.riskBand;
    } else {
      mockDb.paymentPlans.push({
        id: 'plan-' + Math.random().toString(36).substr(2, 9),
        invoiceId,
        installments: plan.installments,
        riskBand: plan.riskBand,
      });
    }

    invoice.status = 'PLAN_ACTIVE';
    saveMockDb();
    return plan;
  }

  // Prisma Implementation
  const invoice = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: { student: { include: { guardian: true } } },
  });
  if (!invoice) throw new Error('Invoice not found');

  const risk = await prisma.riskScore.findFirst({
    where: { familyId: invoice.student.guardian.familyId },
    orderBy: { computedAt: 'desc' },
  });

  if (risk) riskScoreValue = risk.score;

  const plan = generateInstallmentPlanLogic(invoice.amountDue, riskScoreValue);

  await prisma.paymentPlan.upsert({
    where: { invoiceId },
    update: {
      installments: plan.installments,
      riskBand: plan.riskBand,
    },
    create: {
      invoiceId,
      installments: plan.installments,
      riskBand: plan.riskBand,
    },
  });

  await prisma.feeInvoice.update({
    where: { id: invoiceId },
    data: { status: 'PLAN_ACTIVE' },
  });

  return plan;
}

// ----------------------------------------------------
// 4. PORTABILITY LOGIC (FeePassport Generation/JWT)
// ----------------------------------------------------

/**
 * Creates a signed JWT of the student's complete academic and fee payment records.
 */
export async function generateFeePassportToken(studentId: string): Promise<string> {
  const details = await getStudentDetails(studentId);
  if (!details) throw new Error('Student details not found');

  // Construct payload with only necessary portability attributes (GPDR compliant, verifiable)
  const payload = {
    studentId: details.id,
    studentName: details.name,
    guardianName: details.guardian?.name,
    guardianContact: details.guardian?.contact,
    familyId: details.guardian?.familyId,
    issuingSchoolId: details.currentSchoolId,
    timestamp: new Date().toISOString(),
    eduScore: details.eduScore ? {
      score: details.eduScore.score,
      band: details.eduScore.band,
      lastUpdated: details.eduScore.lastUpdated,
    } : null,
    academicRecord: details.academicRecords.map(a => ({
      termId: a.termId,
      subject: a.subject,
      marks: a.marks,
      maxMarks: a.maxMarks,
      attendancePercent: a.attendancePercent,
    })),
    achievements: details.achievements.map(ach => ({
      title: ach.title,
      category: ach.category,
      level: ach.level,
      date: ach.date,
    })),
    paymentHistorySummary: details.invoices.map(inv => ({
      termId: inv.termId,
      amountDue: inv.amountDue,
      status: inv.status,
      dueDate: inv.dueDate,
      paymentsCount: inv.payments.length,
      paidOnTime: inv.status === 'PAID' && inv.payments.every(p => new Date(p.paidDate) <= new Date(inv.dueDate)),
    })),
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

  // Record creation
  if (isMockMode()) {
    mockDb.passports.push({
      id: 'passport-' + Math.random().toString(36).substr(2, 9),
      studentId,
      issuingSchoolId: details.currentSchoolId,
      payload: token,
      issuedAt: new Date().toISOString(),
    });
  } else {
    await prisma.feePassportRecord.create({
      data: {
        studentId,
        issuingSchoolId: details.currentSchoolId,
        payload: token,
      },
    });
  }

  return token;
}

/**
 * Verifies a signed FeePassport token without modifying database.
 * Returns decrypted contents for review.
 */
export function verifyFeePassportToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Verification failed. Invalid or expired token signature.');
  }
}

/**
 * Imports a verified student record from another school.
 */
export async function importFeePassport(token: string, targetSchoolId: string) {
  const payload = verifyFeePassportToken(token);

  if (isMockMode()) {
    // 1. Ensure school exists
    const school = mockDb.schools.find(s => s.id === targetSchoolId);
    if (!school) throw new Error('Target school not found');

    // Real Transfer check: check if student exists in the database
    let existingStudent = mockDb.students.find(s => s.id === payload.studentId);
    if (existingStudent) {
      existingStudent.currentSchoolId = targetSchoolId;
      existingStudent.enrollmentHistory.push({
        schoolId: targetSchoolId,
        startTerm: 'TERM_4_2026',
        endTerm: 'ONGOING'
      });

      // Log Verification passport record
      mockDb.passports.push({
        id: 'passport-verify-' + Math.random().toString(36).substr(2, 9),
        studentId: existingStudent.id,
        issuingSchoolId: payload.issuingSchoolId,
        verifyingSchoolId: targetSchoolId,
        payload: token,
        issuedAt: new Date().toISOString(),
      });

      return { studentId: existingStudent.id, guardianId: existingStudent.guardianId };
    }

    // 2. Upsert Guardian/Family (Fallback for offline token imports)
    let guardian = mockDb.guardians.find(g => g.familyId === payload.familyId);
    if (!guardian) {
      guardian = {
        id: 'guard-' + Math.random().toString(36).substr(2, 9),
        name: payload.guardianName,
        contact: payload.guardianContact,
        familyId: payload.familyId,
      };
      mockDb.guardians.push(guardian);
    }

    // 3. Create Student in new school
    const studentId = payload.studentId || ('stud-' + Math.random().toString(36).substr(2, 9));
    const newStudent = {
      id: studentId,
      name: payload.studentName,
      guardianId: guardian.id,
      currentSchoolId: targetSchoolId,
      enrollmentHistory: [
        { schoolId: payload.issuingSchoolId, startTerm: 'TRANSFER_OUT', endTerm: 'TRANSFER_OUT' },
        { schoolId: targetSchoolId, startTerm: 'TERM_3_2026', endTerm: 'ONGOING' },
      ],
      studentClass: 'Grade 10-A',
      rollNumber: '01',
    };
    mockDb.students.push(newStudent);

    // 4. Import Invoices as reference
    payload.paymentHistorySummary.forEach((inv: any, idx: number) => {
      const invId = `inv-imported-${studentId}-${idx}`;
      mockDb.invoices.push({
        id: invId,
        studentId,
        termId: inv.termId,
        amountDue: inv.amountDue,
        dueDate: inv.dueDate,
        status: inv.status,
      });

      if (inv.status === 'PAID') {
        mockDb.payments.push({
          id: `pay-imported-${invId}`,
          invoiceId: invId,
          amount: inv.amountDue,
          paidDate: inv.dueDate, // seed on-time paid date for calculations
          method: 'IMPORTED',
        });
      }
    });

    // 5. Import Academics
    payload.academicRecord.forEach((rec: any, idx: number) => {
      mockDb.academicRecords.push({
        id: `acad-imported-${studentId}-${idx}`,
        studentId,
        termId: rec.termId,
        subject: rec.subject,
        marks: rec.marks,
        maxMarks: rec.maxMarks,
        attendancePercent: rec.attendancePercent,
      });
    });

    // 6. Import Achievements
    payload.achievements.forEach((ach: any, idx: number) => {
      mockDb.achievements.push({
        id: `ach-imported-${studentId}-${idx}`,
        studentId,
        title: ach.title,
        category: ach.category,
        level: ach.level,
        date: ach.date,
      });
    });

    // 7. Seed EduScore
    if (payload.eduScore) {
      mockDb.eduScores.push({
        id: 'edu-imported-' + Math.random().toString(36).substr(2, 9),
        studentId,
        score: payload.eduScore.score,
        band: payload.eduScore.band,
        history: [{ score: payload.eduScore.score, date: payload.eduScore.lastUpdated }],
        lastUpdated: new Date().toISOString(),
      } as any);
    }

    // 8. Log Verification record
    mockDb.passports.push({
      id: 'passport-verify-' + Math.random().toString(36).substr(2, 9),
      studentId,
      issuingSchoolId: payload.issuingSchoolId,
      verifyingSchoolId: targetSchoolId,
      payload: token,
      issuedAt: new Date().toISOString(),
    });

    saveMockDb();
    return { studentId, guardianId: guardian.id };
  }

  // Prisma Implementation
  // Check if student exists (Real Transfer)
  const existingStudent = await prisma.student.findUnique({
    where: { id: payload.studentId },
  });

  if (existingStudent) {
    const history = typeof existingStudent.enrollmentHistory === 'string'
      ? JSON.parse(existingStudent.enrollmentHistory)
      : existingStudent.enrollmentHistory as any[];
      
    history.push({
      schoolId: targetSchoolId,
      startTerm: 'TERM_4_2026',
      endTerm: 'ONGOING'
    });

    const updatedStudent = await prisma.student.update({
      where: { id: existingStudent.id },
      data: {
        currentSchoolId: targetSchoolId,
        enrollmentHistory: history,
      },
    });

    await prisma.feePassportRecord.create({
      data: {
        studentId: updatedStudent.id,
        issuingSchoolId: payload.issuingSchoolId,
        verifyingSchoolId: targetSchoolId,
        payload: token,
      },
    });

    return { studentId: updatedStudent.id, guardianId: updatedStudent.guardianId };
  }

  // Fallback for new imports in Prisma
  // 1. Create/Retrieve Guardian
  let guardian = await prisma.guardian.findFirst({
    where: { familyId: payload.familyId },
  });

  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: {
        name: payload.guardianName,
        contact: payload.guardianContact,
        familyId: payload.familyId,
      },
    });
  }

  // 2. Create student
  const student = await prisma.student.create({
    data: {
      name: payload.studentName,
      guardianId: guardian.id,
      currentSchoolId: targetSchoolId,
      enrollmentHistory: [
        { schoolId: payload.issuingSchoolId, startTerm: 'TRANSFER_OUT', endTerm: 'TRANSFER_OUT' },
        { schoolId: targetSchoolId, startTerm: 'TERM_3_2026', endTerm: 'ONGOING' },
      ],
    },
  });

  // 3. Create invoices and reference payments
  for (const inv of payload.paymentHistorySummary) {
    const newInv = await prisma.feeInvoice.create({
      data: {
        studentId: student.id,
        termId: inv.termId,
        amountDue: inv.amountDue,
        dueDate: new Date(inv.dueDate),
        status: inv.status,
      },
    });

    if (inv.status === 'PAID') {
      await prisma.payment.create({
        data: {
          invoiceId: newInv.id,
          amount: inv.amountDue,
          paidDate: new Date(inv.dueDate),
          method: 'IMPORTED',
        },
      });
    }
  }

  // 4. Import Academic
  for (const rec of payload.academicRecord) {
    await prisma.academicRecord.create({
      data: {
        studentId: student.id,
        termId: rec.termId,
        subject: rec.subject,
        marks: rec.marks,
        maxMarks: rec.maxMarks,
        attendancePercent: rec.attendancePercent,
      },
    });
  }

  // 5. Import Achievements
  for (const ach of payload.achievements) {
    await prisma.achievement.create({
      data: {
        studentId: student.id,
        title: ach.title,
        category: ach.category,
        level: ach.level,
        date: new Date(ach.date),
      },
    });
  }

  // 6. Seed EduScore
  if (payload.eduScore) {
    await prisma.eduScore.upsert({
      where: { familyId: payload.familyId },
      update: {
        score: payload.eduScore.score,
        band: payload.eduScore.band,
      },
      create: {
        familyId: payload.familyId,
        score: payload.eduScore.score,
        band: payload.eduScore.band,
        history: [{ score: payload.eduScore.score, date: payload.eduScore.lastUpdated }],
      },
    });
  }

  // 7. Record verification log
  await prisma.feePassportRecord.create({
    data: {
      studentId: student.id,
      issuingSchoolId: payload.issuingSchoolId,
      verifyingSchoolId: targetSchoolId,
      payload: token,
    },
  });

  return { studentId: student.id, guardianId: guardian.id };
}

// ----------------------------------------------------
// 5. INSTITUTION CASH FLOW FORECASTING
// ----------------------------------------------------

export async function getSchoolCashFlowForecast(schoolId: string, termId: string = 'TERM_3_2026') {
  let invoices: { amountDue: number; status: string; studentId: string }[] = [];
  const studentMap: Record<string, { familyId: string }> = {};

  if (isMockMode()) {
    const schoolStudents = mockDb.students.filter(s => s.currentSchoolId === schoolId);
    const schoolStudentIds = schoolStudents.map(s => s.id);
    schoolStudents.forEach(s => {
      const g = mockDb.guardians.find(guard => guard.id === s.guardianId);
      studentMap[s.id] = { familyId: g?.familyId || '' };
    });

    invoices = mockDb.invoices
      .filter(i => schoolStudentIds.includes(i.studentId) && i.termId === termId)
      .map(i => ({ amountDue: i.amountDue, status: i.status, studentId: i.studentId }));
  } else {
    // Prisma Implementation
    const [dbStudents, dbInvoices] = await Promise.all([
      prisma.student.findMany({
        where: { currentSchoolId: schoolId },
        include: { guardian: true },
      }),
      prisma.feeInvoice.findMany({
        where: {
          student: { currentSchoolId: schoolId },
          termId: termId,
        },
      })
    ]);

    dbStudents.forEach(s => {
      studentMap[s.id] = { familyId: s.guardian.familyId };
    });

    invoices = dbInvoices.map(i => ({
      amountDue: i.amountDue,
      status: i.status,
      studentId: i.studentId,
    }));
  }

  let totalBilling = 0;
  let expectedCollection = 0;
  let expectedShortfall = 0;

  // Batch query risk scores in production to prevent N+1 query loops
  const latestRiskMap: Record<string, number> = {};
  if (!isMockMode()) {
    const familyIds = Object.values(studentMap).map(m => m.familyId).filter(Boolean);
    const dbRiskScores = await prisma.riskScore.findMany({
      where: { familyId: { in: familyIds } },
      orderBy: { computedAt: 'desc' },
    });
    for (const r of dbRiskScores) {
      if (latestRiskMap[r.familyId] === undefined) {
        latestRiskMap[r.familyId] = r.score;
      }
    }
  }

  for (const inv of invoices) {
    totalBilling += inv.amountDue;

    if (inv.status === 'PAID') {
      expectedCollection += inv.amountDue;
      continue;
    }

    // Unpaid invoices: weight collection based on family's risk score
    const familyId = studentMap[inv.studentId]?.familyId;
    let riskScore = 0;

    if (familyId) {
      if (isMockMode()) {
        const risk = mockDb.riskScores.find(r => r.studentId === inv.studentId);
        if (risk) riskScore = risk.score;
      } else {
        riskScore = latestRiskMap[familyId] || 0;
      }
    }

    // Probability of payment = 1 - (riskScore / 100)
    const probPayment = 1 - (riskScore / 100);
    const weightedVal = inv.amountDue * probPayment;
    expectedCollection += weightedVal;
    expectedShortfall += (inv.amountDue - weightedVal);
  }

  // Calculate monthly operational cost (simulated for forecasting runway)
  const monthlyBurn = 40000; // simulated operational burn rate for demo
  const runwayMonths = expectedCollection / monthlyBurn;

  return {
    termId,
    totalBilling,
    expectedCollection: Math.round(expectedCollection),
    expectedShortfall: Math.round(expectedShortfall),
    runwayMonths: Number(runwayMonths.toFixed(1)),
    monthlyBurn,
  };
}

// 6. IN-PORTAL STUDENT TRANSFERS (DUMMY-SCHOOL TO DUMMY-SCHOOL)
// ----------------------------------------------------

export async function submitTransferRequest(studentId: string, targetSchoolId: string) {
  // Rate Limit: Once every 2 minutes per student
  const lastRequest = mockDb.transferRequests
    .filter(r => r.studentId === studentId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];
    
  if (lastRequest) {
    const elapsedMs = new Date().getTime() - new Date(lastRequest.requestedAt).getTime();
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedSeconds < 120) {
      const waitSeconds = Math.ceil(120 - elapsedSeconds);
      throw new Error(`You can only initiate a transfer request once every 2 minutes. Please wait ${waitSeconds} more seconds.`);
    }
  }

  // 1. Generate signed token
  const token = await generateFeePassportToken(studentId);
  if (!token) {
    throw new Error('Failed to generate FeePassport');
  }

  // 2. Create the request
  const newRequest = {
    id: 'req-' + Math.random().toString(36).substr(2, 9),
    studentId,
    targetSchoolId,
    status: 'PENDING' as const,
    requestedAt: new Date().toISOString(),
    passportToken: token,
  };

  mockDb.transferRequests.push(newRequest);
  saveMockDb();
  return { success: true, requestId: newRequest.id };
}

export async function getTransferRequestsBySchool(schoolId: string) {
  const reqs = mockDb.transferRequests.filter(r => r.targetSchoolId === schoolId);
  return reqs.map(r => {
    let verifiedPayload = null;
    try {
      verifiedPayload = verifyFeePassportToken(r.passportToken);
    } catch (e) {
      console.error('Failed to verify token inside request', e);
    }

    const student = mockDb.students.find(s => s.id === r.studentId);

    return {
      id: r.id,
      studentId: r.studentId,
      studentName: student?.name || 'Unknown Student',
      targetSchoolId: r.targetSchoolId,
      status: r.status,
      requestedAt: r.requestedAt,
      passportToken: r.passportToken,
      verifiedPayload,
    };
  });
}

export async function processTransferRequest(requestId: string, status: 'APPROVED' | 'REJECTED') {
  const req = mockDb.transferRequests.find(r => r.id === requestId);
  if (!req) throw new Error('Transfer request not found');

  req.status = status;

  if (status === 'APPROVED') {
    // Perform the actual import
    const importRes = await importFeePassport(req.passportToken, req.targetSchoolId);
    
    // Also, update the student's current school ID and history in the main list
    const student = mockDb.students.find(s => s.id === req.studentId);
    if (student) {
      student.currentSchoolId = req.targetSchoolId;
      student.enrollmentHistory.push({
        schoolId: req.targetSchoolId,
        startTerm: 'TERM_4_2026',
        endTerm: 'ONGOING'
      });
    }
  }

  saveMockDb();
  return { success: true };
}

/**
 * Push a fee due gentle reminder to the parent's notifications list
 */
export async function pushFeeReminder(invoiceId: string) {
  const invoice = mockDb.invoices.find(i => i.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const student = mockDb.students.find(s => s.id === invoice.studentId);
  if (!student) throw new Error('Student not found');

  const guardian = mockDb.guardians.find(g => g.id === student.guardianId);
  if (!guardian) throw new Error('Guardian not found');

  const school = mockDb.schools.find(sc => sc.id === student.currentSchoolId);
  const schoolName = school ? school.name.split(',')[0] : 'School';

  // Check for recent reminder to prevent spamming (2-minute window)
  const invoiceReminders = mockDb.notifications.filter(
    n => n.guardianId === guardian.id && n.referenceId === invoiceId && n.type === 'FEE_REMINDER'
  );
  if (invoiceReminders.length > 0) {
    const lastReminder = invoiceReminders[invoiceReminders.length - 1];
    const elapsed = Date.now() - new Date(lastReminder.sentAt).getTime();
    if (elapsed < 2 * 60 * 1000) {
      const waitSeconds = Math.ceil((2 * 60 * 1000 - elapsed) / 1000);
      return { 
        success: false, 
        error: `Spam block: Please wait ${waitSeconds}s before pushing another fee reminder for this child.` 
      };
    }
  }

  const reminderMsg = `Gentle reminder from ${schoolName}: ${student.name} has an outstanding fee invoice of ₹${invoice.amountDue.toLocaleString()} for ${invoice.termId} due on ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}. Please clear it as soon as possible.`;

  const newNotification = {
    id: 'notif-reminder-' + Math.random().toString(36).substr(2, 9),
    guardianId: guardian.id,
    title: '⚠️ Fee Due Gentle Reminder',
    message: reminderMsg,
    sentAt: new Date().toISOString(),
    read: false,
    type: 'FEE_REMINDER' as const,
    referenceId: invoiceId
  };

  mockDb.notifications.push(newNotification);
  saveMockDb();
  return { success: true };
}

/**
 * Fetch all notifications for a parent
 */
export async function getNotifications(guardianId: string) {
  return mockDb.notifications.filter(n => n.guardianId === guardianId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

/**
 * Mark all notifications as read
 */
export async function markNotificationsAsRead(guardianId: string) {
  mockDb.notifications.forEach(n => {
    if (n.guardianId === guardianId) {
      n.read = true;
    }
  });
  saveMockDb();
  return { success: true };
}

/**
 * Fetch chat history for a student between school and parent
 */
export async function getChatMessages(studentId: string) {
  return mockDb.chatMessages.filter(c => c.studentId === studentId)
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

/**
 * Send a chat message between school and parent
 */
export async function sendChatMessage(studentId: string, sender: 'SCHOOL' | 'PARENT', message: string) {
  const student = mockDb.students.find(s => s.id === studentId);
  if (!student) throw new Error('Student not found');

  const chatMessage = {
    id: 'chat-' + Math.random().toString(36).substr(2, 9),
    studentId,
    sender,
    message,
    sentAt: new Date().toISOString()
  };

  mockDb.chatMessages.push(chatMessage);

  // If school sent the message, push a notification to parent
  if (sender === 'SCHOOL') {
    const school = mockDb.schools.find(sc => sc.id === student.currentSchoolId);
    const schoolName = school ? school.name.split(',')[0] : 'School';

    mockDb.notifications.push({
      id: 'notif-chat-' + Math.random().toString(36).substr(2, 9),
      guardianId: student.guardianId,
      title: `💬 Message from ${schoolName}`,
      message: message.length > 60 ? `${message.substring(0, 57)}...` : message,
      sentAt: new Date().toISOString(),
      read: false,
      type: 'CHAT_MESSAGE',
      referenceId: chatMessage.id
    });
  }

  saveMockDb();
  return { success: true, chatMessage };
}

/**
 * Claim the Crowdfunded Sponsor Escrow for a student's overdue invoice
 */
export async function claimSponsorEscrow(studentId: string, invoiceId: string) {
  const invoice = mockDb.invoices.find(i => i.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const student = mockDb.students.find(s => s.id === studentId);
  if (!student) throw new Error('Student not found');

  const amountToRelease = Math.min(invoice.amountDue, 35000);
  
  // Record escrow payment
  const paymentId = 'pay-escrow-' + Math.random().toString(36).substr(2, 9);
  mockDb.payments.push({
    id: paymentId,
    invoiceId,
    amount: amountToRelease,
    paidDate: new Date().toISOString().split('T')[0],
    method: 'ESCROW',
  });

  // Reduce amount due
  invoice.amountDue -= amountToRelease;
  if (invoice.amountDue <= 0) {
    invoice.status = 'PAID';
    invoice.amountDue = 0;
  } else {
    invoice.status = 'PARTIAL';
  }

  // Recalculate scores
  await recomputeStudentScores(studentId);

  // Push notification to parent
  mockDb.notifications.push({
    id: 'notif-escrow-' + Math.random().toString(36).substr(2, 9),
    guardianId: student.guardianId,
    title: '🎉 Sponsor Escrow Disbursed',
    message: `Tata Trusts Sponsor Escrow has released ₹${amountToRelease.toLocaleString()} to clear fees for ${student.name}. Your child's payment standing has been successfully boosted!`,
    sentAt: new Date().toISOString(),
    read: false,
    type: 'CHAT_MESSAGE',
    referenceId: invoiceId
  });

  return { success: true };
}

/**
 * Dispatch counselor intervention for a student showing dropout warning indicators
 */
export async function triggerCounselorIntervention(studentId: string) {
  const student = mockDb.students.find(s => s.id === studentId);
  if (!student) throw new Error('Student not found');

  // Push notification to parent
  mockDb.notifications.push({
    id: 'notif-counselor-' + Math.random().toString(36).substr(2, 9),
    guardianId: student.guardianId,
    title: '🤝 School Counselor Dispatched',
    message: `A counselor has been assigned to support your family regarding flexible installment setups and split-pay plans for ${student.name}.`,
    sentAt: new Date().toISOString(),
    read: false,
    type: 'CHAT_MESSAGE',
    referenceId: studentId
  });

  saveMockDb();
  return { success: true };
}

/**
 * Get all escrow funds for a school
 */
export async function getEscrowFunds(schoolId: string) {
  return mockDb.escrowFunds.filter(f => f.schoolId === schoolId);
}

/**
 * Get all escrow disbursements for a school
 */
export async function getEscrowDisbursements(schoolId: string) {
  const funds = mockDb.escrowFunds.filter(f => f.schoolId === schoolId);
  const fundIds = funds.map(f => f.id);
  return mockDb.escrowDisbursements.filter(d => fundIds.includes(d.fundId));
}

/**
 * Disburse escrow funds from a school's scholarship pool to a student's overdue invoice.
 * The school selects the student and amount; the system clears the invoice, recalculates scores, and notifies the parent.
 */
export async function disburseEscrowFund(fundId: string, studentId: string, amount: number, reason: string) {
  const fund = mockDb.escrowFunds.find(f => f.id === fundId);
  if (!fund) throw new Error('Escrow fund not found');
  if (fund.remainingAmount < amount) throw new Error('Insufficient escrow balance. Only ₹' + fund.remainingAmount.toLocaleString() + ' remaining.');

  const student = mockDb.students.find(s => s.id === studentId);
  if (!student) throw new Error('Student not found');

  // Find the student's most urgent overdue invoice
  const overdueInvoice = mockDb.invoices.find(i => i.studentId === studentId && i.status === 'OVERDUE');
  if (!overdueInvoice) throw new Error('No overdue invoices found for this student.');

  const disbursementAmount = Math.min(amount, overdueInvoice.amountDue);

  // Deduct from fund
  fund.remainingAmount -= disbursementAmount;

  // Record payment on the invoice
  mockDb.payments.push({
    id: 'pay-escrow-' + Math.random().toString(36).substr(2, 9),
    invoiceId: overdueInvoice.id,
    amount: disbursementAmount,
    paidDate: new Date().toISOString().split('T')[0],
    method: 'ESCROW_SCHOLARSHIP',
  });

  // Update invoice status
  overdueInvoice.amountDue -= disbursementAmount;
  if (overdueInvoice.amountDue <= 0) {
    overdueInvoice.status = 'PAID';
    overdueInvoice.amountDue = 0;
  } else {
    overdueInvoice.status = 'PARTIAL';
  }

  // Record disbursement
  const disbursement: any = {
    id: 'disb-' + Math.random().toString(36).substr(2, 9),
    fundId,
    studentId,
    invoiceId: overdueInvoice.id,
    amount: disbursementAmount,
    reason,
    disbursedAt: new Date().toISOString(),
    disbursedBy: 'School Admin'
  };
  mockDb.escrowDisbursements.push(disbursement);

  // Recalculate student scores
  await recomputeStudentScores(studentId);

  // Notify parent
  const school = mockDb.schools.find(sc => sc.id === student.currentSchoolId);
  const schoolName = school ? school.name.split(',')[0] : 'School';
  mockDb.notifications.push({
    id: 'notif-escrow-' + Math.random().toString(36).substr(2, 9),
    guardianId: student.guardianId,
    title: '🎉 Scholarship Fund Disbursed!',
    message: `Great news! ${schoolName} has released ₹${disbursementAmount.toLocaleString()} from the "${fund.source}" scholarship fund to cover ${student.name}'s pending fees. Your child's credit standing has been updated.`,
    sentAt: new Date().toISOString(),
    read: false,
    type: 'CHAT_MESSAGE',
    referenceId: overdueInvoice.id
  });

  return { success: true, disbursement, remainingBalance: fund.remainingAmount };
}
