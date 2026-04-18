import { generateClient } from 'aws-amplify/data';

let client = null;

function getClient() {
  if (client) return client;
  try {
    client = generateClient();
    return client;
  } catch (err) {
    console.error('[storeRegistryService] Failed to generate Amplify Data client:', err.message);
    return null;
  }
}

// Fetch all ACTIVE registered stores for the icon grid
export async function fetchRegisteredStores() {
  try {
    const c = getClient();
    if (!c) return [];
    const { data, errors } = await c.models.RegisteredStore.list({
      filter: { status: { eq: 'ACTIVE' } },
    });
    if (errors?.length) throw new Error(errors[0].message);
    return data ?? [];
  } catch (error) {
    console.error('storeRegistryService.fetchRegisteredStores error:', error);
    return [];
  }
}

// Fetch products for a specific registered store (when user taps its icon)
export async function fetchStoreProducts(storeId, opts = {}) {
  try {
    const c = getClient();
    const filter = { storeId: { eq: storeId } };
    if (opts.inStockOnly) filter.inStock = { eq: true };
    const { data, errors } = await c.models.StoreProduct.list({ filter });
    if (errors?.length) throw new Error(errors[0].message);
    return data ?? [];
  } catch (error) {
    console.error('storeRegistryService.fetchStoreProducts error:', error);
    return [];
  }
}

// Fetch all StoreProducts across every registered store (for AGRON aggregated view)
export async function fetchAllStoreProducts() {
  try {
    const c = getClient();
    const { data, errors } = await c.models.StoreProduct.list();
    if (errors?.length) throw new Error(errors[0].message);
    return data ?? [];
  } catch (error) {
    console.error('storeRegistryService.fetchAllStoreProducts error:', error);
    return [];
  }
}

// Normalise an AppSync StoreProduct into the same shape the store UI expects
export function normaliseStoreProduct(p) {
  return {
    id: `store_${p.id}`,
    name: p.name,
    price: p.priceLabel ?? (p.sellingPrice != null ? `UGX ${p.sellingPrice.toLocaleString()}` : '—'),
    category_name: p.category ?? 'other',
    category_display_name: p.category ?? 'Other',
    description: p.description ?? '',
    unit: p.unit ?? '',
    inStock: p.inStock ?? true,
    _source: 'appsync',
    _storeId: p.storeId,
  };
}

export default {
  fetchRegisteredStores,
  fetchStoreProducts,
  fetchAllStoreProducts,
  normaliseStoreProduct,
};
