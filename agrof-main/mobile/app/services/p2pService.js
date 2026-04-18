import { generateClient } from 'aws-amplify/data';

let client = null;

function getClient() {
  if (client) return client;
  try {
    client = generateClient();
    return client;
  } catch (err) {
    console.error('[p2pService] Failed to generate Amplify Data client:', err.message);
    return null;
  }
}

// All ACTIVE listings — browse view
export async function listActiveListings() {
  try {
    const c = getClient();
    if (!c) return [];
    const { data, errors } = await c.models.MarketListing.list({
      filter: { status: { eq: 'ACTIVE' } },
    });
    if (errors?.length) throw new Error(errors[0].message);
    return data ?? [];
  } catch (err) {
    console.error('p2pService.listActiveListings:', err);
    return [];
  }
}

// Own listings — seller dashboard (filter by stored sellerSub)
export async function listMyListings(sellerSub) {
  try {
    const c = getClient();
    const { data, errors } = await c.models.MarketListing.list({
      filter: { sellerSub: { eq: sellerSub } },
    });
    if (errors?.length) throw new Error(errors[0].message);
    return data ?? [];
  } catch (err) {
    console.error('p2pService.listMyListings:', err);
    return [];
  }
}

// Create a new listing
export async function createListing({ title, description, category, priceLabel, unit, sellerSub, sellerName }) {
  try {
    const c = getClient();
    const { data, errors } = await c.models.MarketListing.create({
      title,
      description: description ?? '',
      category: category ?? '',
      priceLabel,
      unit: unit ?? '',
      sellerSub,
      sellerName: sellerName ?? '',
      status: 'ACTIVE',
    });
    if (errors?.length) throw new Error(errors[0].message);
    return { success: true, data };
  } catch (err) {
    console.error('p2pService.createListing:', err);
    return { success: false, error: err.message };
  }
}

// Toggle ACTIVE ↔ PAUSED
export async function updateListingStatus(id, status) {
  try {
    const c = getClient();
    const { data, errors } = await c.models.MarketListing.update({ id, status });
    if (errors?.length) throw new Error(errors[0].message);
    return { success: true, data };
  } catch (err) {
    console.error('p2pService.updateListingStatus:', err);
    return { success: false, error: err.message };
  }
}

// Hard delete
export async function deleteListing(id) {
  try {
    const c = getClient();
    const { errors } = await c.models.MarketListing.delete({ id });
    if (errors?.length) throw new Error(errors[0].message);
    return { success: true };
  } catch (err) {
    console.error('p2pService.deleteListing:', err);
    return { success: false, error: err.message };
  }
}
