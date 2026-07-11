import { PrismaClient } from '@prisma/client';
import { mockDb } from '../src/lib/mockDb';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding from mockDb and db_state.json...');

  // 1. Clear existing database records
  console.log('Cleaning up existing database records...');
  await prisma.feePassportRecord.deleteMany({});
  await prisma.eduScore.deleteMany({});
  await prisma.riskScore.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.paymentPlan.deleteMany({});
  await prisma.feeInvoice.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.school.deleteMany({});

  // 2. Seed Schools
  console.log('Seeding Schools...');
  for (const s of mockDb.schools) {
    await prisma.school.create({
      data: { id: s.id, name: s.name },
    });
  }

  // 3. Seed Guardians
  console.log('Seeding Guardians...');
  for (const g of mockDb.guardians) {
    await prisma.guardian.create({
      data: { id: g.id, name: g.name, contact: g.contact, familyId: g.familyId },
    });
  }

  // 4. Seed User Profiles
  console.log('Seeding User Profiles...');
  for (const u of mockDb.userProfiles) {
    await prisma.userProfile.create({
      data: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        guardianId: u.guardianId || null,
      },
    });
  }

  // 5. Seed Students
  console.log('Seeding Students...');
  for (const s of mockDb.students) {
    await prisma.student.create({
      data: {
        id: s.id,
        name: s.name,
        guardianId: s.guardianId,
        currentSchoolId: s.currentSchoolId,
        enrollmentHistory: s.enrollmentHistory as any,
      },
    });
  }

  // Load db_state.json
  const dbStatePath = path.join(__dirname, '../src/lib/db_state.json');
  if (!fs.existsSync(dbStatePath)) {
    console.error('❌ db_state.json not found. Seeding aborted.');
    return;
  }

  const dbState = JSON.parse(fs.readFileSync(dbStatePath, 'utf8'));

  // 6. Seed Invoices
  console.log('Seeding Invoices...');
  for (const inv of dbState.invoices || []) {
    // Check if student exists
    const studExists = mockDb.students.some(s => s.id === inv.studentId);
    if (!studExists) continue;

    await prisma.feeInvoice.create({
      data: {
        id: inv.id,
        studentId: inv.studentId,
        termId: inv.termId,
        amountDue: Number(inv.amountDue),
        dueDate: new Date(inv.dueDate),
        status: inv.status,
      },
    });
  }

  // 7. Seed Payments
  console.log('Seeding Payments...');
  for (const p of dbState.payments || []) {
    // Check if invoice exists
    const invExists = (dbState.invoices || []).some((i: any) => i.id === p.invoiceId);
    if (!invExists) continue;

    await prisma.payment.create({
      data: {
        id: p.id,
        invoiceId: p.invoiceId,
        amount: Number(p.amount),
        paidDate: new Date(p.paidDate),
        method: p.method,
      },
    });
  }

  // 8. Seed Risk Scores
  console.log('Seeding Risk Scores...');
  for (const r of dbState.riskScores || []) {
    const student = mockDb.students.find(s => s.id === r.studentId);
    if (!student) continue;

    const guardian = mockDb.guardians.find(g => g.id === student.guardianId);
    if (!guardian) continue;

    await prisma.riskScore.create({
      data: {
        id: r.id,
        familyId: guardian.familyId,
        termId: r.termId,
        score: Number(r.score),
        explanation: r.explanation,
        computedAt: new Date(r.computedAt),
      },
    });
  }

  // 9. Seed EduScores
  console.log('Seeding EduScores...');
  const seededFamilyIds = new Set<string>();
  for (const e of dbState.eduScores || []) {
    const student = mockDb.students.find(s => s.id === e.studentId);
    if (!student) continue;

    const guardian = mockDb.guardians.find(g => g.id === student.guardianId);
    if (!guardian) continue;

    // EduScore familyId must be unique in DB schema
    if (seededFamilyIds.has(guardian.familyId)) continue;
    seededFamilyIds.add(guardian.familyId);

    await prisma.eduScore.create({
      data: {
        id: e.id,
        familyId: guardian.familyId,
        score: Number(e.score),
        band: e.band,
        history: e.history as any,
      },
    });
  }

  // 10. Seed Escrow Funds
  console.log('Seeding Escrow Funds...');
  for (const f of dbState.escrowFunds || []) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "EscrowFund" ("id", "schoolId", "source", "totalAmount", "remainingAmount", "createdAt") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
      f.id,
      f.schoolId,
      f.source,
      Number(f.totalAmount),
      Number(f.remainingAmount),
      new Date(f.createdAt)
    );
  }

  // 11. Seed Academic Records
  console.log('Seeding Academic Records...');
  for (const acad of mockDb.academicRecords || []) {
    const studentExists = mockDb.students.some(s => s.id === acad.studentId);
    if (!studentExists) continue;

    await prisma.academicRecord.create({
      data: {
        id: acad.id,
        studentId: acad.studentId,
        termId: acad.termId,
        subject: acad.subject,
        marks: Number(acad.marks),
        maxMarks: Number(acad.maxMarks),
        attendancePercent: Number(acad.attendancePercent),
      },
    });
  }

  // 12. Seed Achievements
  console.log('Seeding Achievements...');
  for (const ach of mockDb.achievements || []) {
    const studentExists = mockDb.students.some(s => s.id === ach.studentId);
    if (!studentExists) continue;

    await prisma.achievement.create({
      data: {
        id: ach.id,
        studentId: ach.studentId,
        title: ach.title,
        category: ach.category,
        level: ach.level,
        date: new Date(ach.date),
        certificateUrl: ach.certificateUrl || null,
      },
    });
  }

  console.log('🎉 Supabase comprehensive seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
