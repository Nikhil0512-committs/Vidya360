'use strict';
'use server';

import { 
  signIn, 
  signOut, 
  getSession 
} from '@/lib/auth';
import { 
  payInvoice, 
  requestPaymentPlan, 
  generateFeePassportToken, 
  verifyFeePassportToken, 
  importFeePassport,
  getStudentDetails,
  getStudentsBySchool,
  getGuardianByUserId,
  getSchoolCashFlowForecast,
  getSchools,
  submitTransferRequest,
  getTransferRequestsBySchool,
  processTransferRequest,
  pushFeeReminder,
  getNotifications,
  markNotificationsAsRead,
  getChatMessages,
  sendChatMessage,
  claimSponsorEscrow,
  triggerCounselorIntervention,
  getEscrowFunds,
  getEscrowDisbursements,
  disburseEscrowFund
} from '@/lib/services';
import { revalidatePath } from 'next/cache';

export async function handleSignIn(email: string) {
  try {
    const res = await signIn(email);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Authentication failed', user: undefined };
  }
}

export async function handleSignOut() {
  const res = await signOut();
  return res;
}

export async function handlePayInvoice(invoiceId: string, amount: number, method: string) {
  try {
    await payInvoice(invoiceId, amount, method);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment failed' };
  }
}

export async function handleRequestPaymentPlan(invoiceId: string) {
  try {
    const plan = await requestPaymentPlan(invoiceId);
    revalidatePath('/');
    return { success: true, plan };
  } catch (err: any) {
    return { success: false, error: err.message || 'Plan generation failed' };
  }
}

export async function handleGenerateFeePassport(studentId: string) {
  try {
    const token = await generateFeePassportToken(studentId);
    return { success: true, token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Passport generation failed' };
  }
}

export async function handleVerifyFeePassport(token: string) {
  try {
    const payload = verifyFeePassportToken(token);
    return { success: true, payload };
  } catch (err: any) {
    return { success: false, error: err.message || 'Passport verification failed' };
  }
}

export async function handleImportFeePassport(token: string, targetSchoolId: string) {
  try {
    const result = await importFeePassport(token, targetSchoolId);
    revalidatePath('/');
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Import failed' };
  }
}

export async function handleGetSession() {
  return await getSession();
}

export async function handleGetStudentDetails(studentId: string) {
  return await getStudentDetails(studentId);
}

export async function handleGetStudentsBySchool(schoolId: string) {
  return await getStudentsBySchool(schoolId);
}

export async function handleGetGuardianByUserId(userId: string) {
  return await getGuardianByUserId(userId);
}

export async function handleGetSchoolCashFlowForecast(schoolId: string, termId?: string) {
  return await getSchoolCashFlowForecast(schoolId, termId);
}

export async function handleGetSchools() {
  return await getSchools();
}

export async function handleSubmitTransferRequest(studentId: string, targetSchoolId: string) {
  try {
    const res = await submitTransferRequest(studentId, targetSchoolId);
    revalidatePath('/');
    return { ...res, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit transfer request' };
  }
}

export async function handleGetTransferRequestsBySchool(schoolId: string) {
  return await getTransferRequestsBySchool(schoolId);
}

export async function handleProcessTransferRequest(requestId: string, status: 'APPROVED' | 'REJECTED') {
  try {
    const res = await processTransferRequest(requestId, status);
    revalidatePath('/');
    return { ...res, error: undefined };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to process request' };
  }
}

export async function handlePushFeeReminder(invoiceId: string) {
  try {
    const res = await pushFeeReminder(invoiceId);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send reminder' };
  }
}

export async function handleGetNotifications(guardianId: string) {
  return await getNotifications(guardianId);
}

export async function handleMarkNotificationsAsRead(guardianId: string) {
  try {
    const res = await markNotificationsAsRead(guardianId);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed' };
  }
}

export async function handleGetChatMessages(studentId: string) {
  return await getChatMessages(studentId);
}

export async function handleSendChatMessage(studentId: string, sender: 'SCHOOL' | 'PARENT', message: string) {
  try {
    const res = await sendChatMessage(studentId, sender, message);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send message' };
  }
}

export async function handleClaimSponsorEscrow(studentId: string, invoiceId: string) {
  try {
    const res = await claimSponsorEscrow(studentId, invoiceId);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Escrow claim failed' };
  }
}

export async function handleTriggerCounselorIntervention(studentId: string) {
  try {
    const res = await triggerCounselorIntervention(studentId);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Intervention trigger failed' };
  }
}

export async function handleGetEscrowFunds(schoolId: string) {
  return await getEscrowFunds(schoolId);
}

export async function handleGetEscrowDisbursements(schoolId: string) {
  return await getEscrowDisbursements(schoolId);
}

export async function handleDisburseEscrowFund(fundId: string, studentId: string, amount: number, reason: string) {
  try {
    const res = await disburseEscrowFund(fundId, studentId, amount, reason);
    revalidatePath('/');
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Disbursement failed' };
  }
}
