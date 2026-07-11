const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data to avoid conflicts
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

  // 2. Create Schools
  console.log('Seeding Schools...');
  const schools = [
    { id: 'school-a-uuid', name: 'Greenwood International School, Bangalore' },
    { id: 'school-b-uuid', name: 'Delhi Public School, New Delhi' },
    { id: 'school-c-uuid', name: 'DAV Public School, Mumbai' },
  ];
  for (const s of schools) {
    await prisma.school.create({ data: s });
  }

  // 3. Create Guardians
  console.log('Seeding Guardians...');
  const guardians = [
    { id: 'guard-ramesh', name: 'Ramesh Sharma', contact: '+91 98765 43210', familyId: 'family-sharma' },
    { id: 'guard-sunita', name: 'Sunita Patel', contact: '+91 91234 56789', familyId: 'family-patel' },
    { id: 'guard-anil', name: 'Anil Gupta', contact: '+91 95432 10987', familyId: 'family-gupta' },
    { id: 'guard-vikram', name: 'Vikram Malhotra', contact: '+91 99887 76655', familyId: 'family-malhotra' },
    { id: 'guard-siddharth', name: 'Siddharth Sen', contact: '+91 98877 66554', familyId: 'family-sen' },
  ];
  for (const g of guardians) {
    await prisma.guardian.create({ data: g });
  }

  // 4. Create User Profiles
  console.log('Seeding User Profiles...');
  const userProfiles = [
    { id: 'auth-admin-greenwood', email: 'admin@greenwood.edu', name: 'Principal Greenwood', role: 'ADMIN' },
    { id: 'auth-admin-dps', email: 'admin@dps.edu', name: 'DPS Principal Admin', role: 'ADMIN' },
    { id: 'auth-admin-dav', email: 'admin@dav.edu', name: 'DAV Principal Admin', role: 'ADMIN' },
    { id: 'auth-parent-ramesh', email: 'ramesh@sharma.com', name: 'Ramesh Sharma', role: 'PARENT', guardianId: 'guard-ramesh' },
    { id: 'auth-parent-sunita', email: 'sunita@patel.com', name: 'Sunita Patel', role: 'PARENT', guardianId: 'guard-sunita' },
    { id: 'auth-parent-anil', email: 'anil@gupta.com', name: 'Anil Gupta', role: 'PARENT', guardianId: 'guard-anil' },
    { id: 'auth-parent-vikram', email: 'vikram@malhotra.com', name: 'Vikram Malhotra', role: 'PARENT', guardianId: 'guard-vikram' },
    { id: 'auth-parent-siddharth', email: 'siddharth@sen.com', name: 'Siddharth Sen', role: 'PARENT', guardianId: 'guard-siddharth' },
  ];
  for (const u of userProfiles) {
    await prisma.userProfile.create({ data: u });
  }

  // 5. Create Students
  console.log('Seeding Students...');
  const students = [
    { id: 'stud-kabir', name: 'Kabir Patel', guardianId: 'guard-sunita', currentSchoolId: 'school-a-uuid', enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025' }] },
    { id: 'stud-diya', name: 'Diya Gupta', guardianId: 'guard-anil', currentSchoolId: 'school-a-uuid', enrollmentHistory: [{ schoolId: 'school-a-uuid', startTerm: 'TERM_1_2025' }] },
    { id: 'stud-aarav', name: 'Aarav Sharma', guardianId: 'guard-ramesh', currentSchoolId: 'school-b-uuid', enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2025' }] },
    { id: 'stud-riya', name: 'Riya Sharma', guardianId: 'guard-ramesh', currentSchoolId: 'school-b-uuid', enrollmentHistory: [{ schoolId: 'school-b-uuid', startTerm: 'TERM_1_2025' }] },
    { id: 'stud-aryan', name: 'Aryan Malhotra', guardianId: 'guard-vikram', currentSchoolId: 'school-c-uuid', enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2025' }] },
    { id: 'stud-ananya', name: 'Ananya Sen', guardianId: 'guard-siddharth', currentSchoolId: 'school-c-uuid', enrollmentHistory: [{ schoolId: 'school-c-uuid', startTerm: 'TERM_1_2025' }] },
  ];
  for (const s of students) {
    await prisma.student.create({ data: s });
  }

  // 6. Create EduScores
  console.log('Seeding EduScores...');
  const eduScores = [
    { id: 'edu-sharma', familyId: 'family-sharma', score: 830, band: 'GOOD', history: [{ score: 830, date: new Date().toISOString() }] },
    { id: 'edu-patel', familyId: 'family-patel', score: 840, band: 'GOOD', history: [{ score: 840, date: new Date().toISOString() }] },
    { id: 'edu-gupta', familyId: 'family-gupta', score: 810, band: 'GOOD', history: [{ score: 810, date: new Date().toISOString() }] },
    { id: 'edu-malhotra', familyId: 'family-malhotra', score: 900, band: 'EXCELLENT', history: [{ score: 900, date: new Date().toISOString() }] },
    { id: 'edu-sen', familyId: 'family-sen', score: 900, band: 'EXCELLENT', history: [{ score: 900, date: new Date().toISOString() }] },
  ];
  for (const e of eduScores) {
    await prisma.eduScore.create({ data: e });
  }

  // 7. Create Fee Invoices
  console.log('Seeding Fee Invoices...');
  const invoices = [
    { id: 'inv-kabir-1', studentId: 'stud-kabir', termId: 'TERM_3_2026', amountDue: 50000, dueDate: new Date('2026-08-15'), status: 'OVERDUE' },
    { id: 'inv-diya-1', studentId: 'stud-diya', termId: 'TERM_3_2026', amountDue: 48000, dueDate: new Date('2026-08-15'), status: 'OVERDUE' },
    { id: 'inv-aarav-1', studentId: 'stud-aarav', termId: 'TERM_3_2026', amountDue: 45000, dueDate: new Date('2026-08-15'), status: 'PAID' },
    { id: 'inv-riya-1', studentId: 'stud-riya', termId: 'TERM_3_2026', amountDue: 80000, dueDate: new Date('2026-08-15'), status: 'OVERDUE' },
    { id: 'inv-aryan-1', studentId: 'stud-aryan', termId: 'TERM_3_2026', amountDue: 55000, dueDate: new Date('2026-08-15'), status: 'OVERDUE' },
    { id: 'inv-ananya-1', studentId: 'stud-ananya', termId: 'TERM_3_2026', amountDue: 52000, dueDate: new Date('2026-08-15'), status: 'OVERDUE' },
  ];
  for (const inv of invoices) {
    await prisma.feeInvoice.create({ data: inv });
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
