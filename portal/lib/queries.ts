'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

// Typed AppSync client — shared across the portal
export const client = generateClient<Schema>();

// Fetch the merchant profile for a given owner (uses Cognito sub auto-filter via owner auth)
export async function getMyProfile() {
  const { data, errors } = await client.models.MerchantProfile.list();
  if (errors?.length) throw new Error(errors[0].message);
  return data[0] ?? null;
}

// Create or update the current user's merchant profile
export async function upsertProfile(input: {
  displayName?: string;
  businessName?: string;
  role?: 'BUYER' | 'SELLER' | 'BOTH';
  publicKey?: string;
}) {
  const existing = await getMyProfile();
  if (existing) {
    const { data, errors } = await client.models.MerchantProfile.update({
      id: existing.id,
      ...input,
    });
    if (errors?.length) throw new Error(errors[0].message);
    return data;
  }
  const { data, errors } = await client.models.MerchantProfile.create(input);
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

// List active market listings
export async function listMarketListings(filter?: { category?: string }) {
  const { data, errors } = await client.models.MarketListing.list({
    filter: {
      status: { eq: 'ACTIVE' },
      ...(filter?.category ? { category: { eq: filter.category } } : {}),
    },
  });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

// Fetch messages for a chat thread, newest first
export async function listMessages(chatId: string) {
  const { data, errors } = await client.models.ChatMessage.list({
    filter: { chatId: { eq: chatId } },
  });
  if (errors?.length) throw new Error(errors[0].message);
  return data.sort((a, b) => (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1);
}

// Fetch all chat threads the current user is part of (by fromSub or toSub)
export async function listMyChats(mySub: string) {
  const [sent, received] = await Promise.all([
    client.models.ChatMessage.list({ filter: { fromSub: { eq: mySub } } }),
    client.models.ChatMessage.list({ filter: { toSub: { eq: mySub } } }),
  ]);
  const allMessages = [...(sent.data ?? []), ...(received.data ?? [])];
  // Unique chat IDs
  return [...new Set(allMessages.map((m) => m.chatId))];
}

// Fetch a merchant's public key (needed before sending an encrypted message)
export async function getMerchantPublicKey(ownerSub: string): Promise<string | null> {
  const { data } = await client.models.MerchantProfile.list({
    filter: { owner: { eq: ownerSub } } as Parameters<typeof client.models.MerchantProfile.list>[0]['filter'],
  });
  return data[0]?.publicKey ?? null;
}

// ── Store Registry ──────────────────────────────────────────────────────────

// Fetch the current owner's RegisteredStore
export async function getMyStore() {
  const { data, errors } = await client.models.RegisteredStore.list();
  if (errors?.length) throw new Error(errors[0].message);
  return data[0] ?? null;
}

// Create or update the current user's RegisteredStore
export async function upsertStore(input: {
  name?: string;
  logoKey?: string;
  tagline?: string;
  status?: 'ACTIVE' | 'PENDING';
}) {
  const existing = await getMyStore();
  if (existing) {
    const { data, errors } = await client.models.RegisteredStore.update({ id: existing.id, ...input });
    if (errors?.length) throw new Error(errors[0].message);
    return data;
  }
  const { data, errors } = await client.models.RegisteredStore.create({
    name: input.name ?? '',
    status: 'PENDING',
    ...input,
  });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

// List all ACTIVE registered stores (for the mobile app icon grid)
export async function listRegisteredStores() {
  const { data, errors } = await client.models.RegisteredStore.list({
    filter: { status: { eq: 'ACTIVE' } },
  });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

// ── Store Products ──────────────────────────────────────────────────────────

// Fetch products for a specific store
export async function listStoreProducts(storeId: string) {
  const { data, errors } = await client.models.StoreProduct.list({
    filter: { storeId: { eq: storeId } },
  });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

// Fetch ALL store products across all stores (for AGRON aggregated view)
export async function listAllStoreProducts() {
  const { data, errors } = await client.models.StoreProduct.list();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

export async function createStoreProduct(input: {
  storeId: string;
  name: string;
  description?: string;
  category?: string;
  priceLabel?: string;
  sellingPrice?: number;
  unit?: string;
  imageKeysJson?: string;
  inStock?: boolean;
  quantity?: number;
}) {
  const { data, errors } = await client.models.StoreProduct.create({ inStock: true, quantity: 0, ...input });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

export async function updateStoreProduct(id: string, input: Partial<{
  name: string; description: string; category: string; priceLabel: string;
  sellingPrice: number; unit: string; imageKeysJson: string; inStock: boolean; quantity: number;
}>) {
  const { data, errors } = await client.models.StoreProduct.update({ id, ...input });
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

export async function deleteStoreProduct(id: string) {
  const { errors } = await client.models.StoreProduct.delete({ id });
  if (errors?.length) throw new Error(errors[0].message);
}
