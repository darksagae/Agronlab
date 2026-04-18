import { generateClient } from 'aws-amplify/data';

let client = null;
function getClient() {
  if (client) return client;
  try {
    client = generateClient();
    return client;
  } catch (err) {
    console.error('[subscriptionService] Failed to generate Amplify Data client:', err.message);
    return null;
  }
}

const PLAN_ID = 'annual_10usd';
const PLAN_PRICE_UGX = 37000; // ~$10 USD
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function getMySubscription(userSub) {
  if (!userSub) return null;
  try {
    const c = getClient();
    if (!c) return null;
    const { data } = await c.models.UserSubscription.list({
      filter: { userSub: { eq: userSub } },
    });
    if (!data?.length) return null;
    const active = data.find(
      (s) => s.status === 'ACTIVE' && new Date(s.expiresAt) > new Date()
    );
    return active ?? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  } catch (err) {
    console.warn('[subscriptionService] getMySubscription error:', err);
    return null;
  }
}

export async function isSubscribed(userSub) {
  const sub = await getMySubscription(userSub);
  return !!(sub && sub.status === 'ACTIVE' && new Date(sub.expiresAt) > new Date());
}

export async function activateSubscription({ userSub, paymentRef, network, amountPaid, currency = 'UGX' }) {
  try {
    const c = getClient();
    if (!c) throw new Error('Amplify Data client not initialized');
    const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    const existing = await getMySubscription(userSub);

    if (existing) {
      const { data, errors } = await c.models.UserSubscription.update({
        id: existing.id,
        status: 'ACTIVE',
        expiresAt,
        paymentRef: paymentRef ?? existing.paymentRef,
        network: network ?? existing.network,
        amountPaid: amountPaid ?? existing.amountPaid,
        currency,
      });
      if (errors?.length) throw new Error(errors[0].message);
      return { success: true, subscription: data };
    }

    const { data, errors } = await c.models.UserSubscription.create({
      userSub,
      planId: PLAN_ID,
      status: 'ACTIVE',
      expiresAt,
      paymentRef: paymentRef ?? '',
      network: network ?? '',
      amountPaid: amountPaid ?? PLAN_PRICE_UGX,
      currency,
    });
    if (errors?.length) throw new Error(errors[0].message);
    return { success: true, subscription: data };
  } catch (err) {
    console.error('[subscriptionService] activateSubscription error:', err);
    return { success: false, error: err.message };
  }
}

export async function cancelSubscription(userSub) {
  try {
    const c = getClient();
    if (!c) throw new Error('Amplify Data client not initialized');
    const existing = await getMySubscription(userSub);
    if (!existing) return { success: false, error: 'No subscription found' };
    const { data, errors } = await c.models.UserSubscription.update({
      id: existing.id,
      status: 'CANCELLED',
    });
    if (errors?.length) throw new Error(errors[0].message);
    return { success: true, subscription: data };
  } catch (err) {
    console.error('[subscriptionService] cancelSubscription error:', err);
    return { success: false, error: err.message };
  }
}

export { PLAN_PRICE_UGX, PLAN_ID };
