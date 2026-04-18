import { generateClient } from 'aws-amplify/data';
import authService from './authService';

let client = null;
function getClient() {
  if (client) return client;
  try {
    client = generateClient();
    return client;
  } catch (err) {
    console.error('[roleRequestService] Failed to generate Amplify Data client:', err.message);
    return null;
  }
}

function getCurrentUserId() {
  return authService.getCachedUserId();
}

async function getMyProfile() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  try {
    const c = getClient();
    if (!c) return null;
    const { data } = await c.models.MerchantProfile.list();
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function submitSellerRequest(requestData) {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'User not authenticated' };

  try {
    const c = getClient();
    if (!c) throw new Error('Amplify Data client not initialized');
    const profile = await getMyProfile();
    const sellerRequestJson = JSON.stringify({
      ...requestData,
      submittedAt: new Date().toISOString(),
    });

    if (profile) {
      const { errors } = await c.models.MerchantProfile.update({
        id: profile.id,
        sellerRequestJson,
        approvalStatus: 'PENDING_REVIEW',
        businessName: requestData.businessName || profile.businessName,
      });
      if (errors?.length) throw new Error(errors[0].message);
    } else {
      const { errors } = await c.models.MerchantProfile.create({
        userSub: userId,
        displayName: requestData.businessName || 'Farmer',
        businessName: requestData.businessName || '',
        role: 'SELLER',
        sellerRequestJson,
        approvalStatus: 'PENDING_REVIEW',
      });
      if (errors?.length) throw new Error(errors[0].message);
    }

    return { success: true, request: { status: 'PENDING_REVIEW' } };
  } catch (err) {
    console.error('[roleRequestService] submitSellerRequest error:', err);
    return { success: false, error: err.message };
  }
}

async function getMyApprovalStatus() {
  const profile = await getMyProfile();
  return profile?.approvalStatus ?? null;
}

async function canRequestSellerRole() {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, canRequest: false };
  const status = await getMyApprovalStatus();
  return {
    success: true,
    canRequest: status !== 'PENDING_REVIEW',
    approvalStatus: status,
  };
}

// Admin-only: these are called from the portal, not the mobile app
async function getPendingRequests() {
  return { success: true, requests: [] };
}

async function approveRequest() {
  return { success: false, error: 'Use the admin portal at /dashboard/admin/sellers' };
}

async function rejectRequest() {
  return { success: false, error: 'Use the admin portal at /dashboard/admin/sellers' };
}

export default {
  submitSellerRequest,
  getMyApprovalStatus,
  canRequestSellerRole,
  getPendingRequests,
  approveRequest,
  rejectRequest,
};
