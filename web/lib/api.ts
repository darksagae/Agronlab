import { APPSYNC_URL, APPSYNC_API_KEY } from './amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// ─── AppSync helper ────────────────────────────────────────────────────────

async function appsync<T>(
  query: string,
  variables?: Record<string, unknown>,
  useAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useAuth) {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        headers['Authorization'] = token;
      } else {
        headers['x-api-key'] = APPSYNC_API_KEY;
      }
    } catch {
      headers['x-api-key'] = APPSYNC_API_KEY;
    }
  } else {
    headers['x-api-key'] = APPSYNC_API_KEY;
  }

  const res = await fetch(APPSYNC_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Market listings ───────────────────────────────────────────────────────

export interface MarketListing {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priceLabel?: string;
  unit?: string;
  sellerSub: string;
  sellerName?: string;
  status: 'ACTIVE' | 'SOLD' | 'PAUSED';
  country?: string;
  isInternational?: boolean;
  createdAt?: string;
}

const LIST_LISTINGS = `
  query ListActiveListings($filter: ModelMarketListingFilterInput, $limit: Int) {
    listMarketListings(filter: $filter, limit: $limit) {
      items {
        id title description category priceLabel unit
        sellerSub sellerName status country isInternational createdAt
      }
    }
  }
`;

const CREATE_LISTING = `
  mutation CreateListing($input: CreateMarketListingInput!) {
    createMarketListing(input: $input) {
      id title category priceLabel status createdAt
    }
  }
`;

export async function listActiveListings(category?: string): Promise<MarketListing[]> {
  const filter: Record<string, unknown> = { status: { eq: 'ACTIVE' } };
  if (category) filter.category = { eq: category };
  try {
    const data = await appsync<{ listMarketListings: { items: MarketListing[] } }>(
      LIST_LISTINGS,
      { filter, limit: 50 },
      true,
    );
    return data.listMarketListings?.items ?? [];
  } catch {
    return [];
  }
}

export async function createListing(input: {
  title: string;
  description?: string;
  category?: string;
  priceLabel?: string;
  unit?: string;
  sellerSub: string;
  sellerName?: string;
  country?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await appsync(CREATE_LISTING, { input: { ...input, status: 'ACTIVE' } }, true);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create listing' };
  }
}

// ─── Store products ────────────────────────────────────────────────────────

export interface StoreProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  unit?: string;
}

export interface StoreCategory {
  id: number;
  name: string;
  productCount?: number;
}

export async function getStoreProducts(params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<StoreProduct[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.limit) qs.set('limit', String(params.limit));

  const url = `/api/store/products${qs.toString() ? '?' + qs.toString() : ''}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = Array.isArray(data) ? data : data.products ?? [];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.selling_price ?? r.price,
    category: r.category_name ?? r.category_display_name ?? r.category,
    stock: r.quantity_in_stock ?? r.stock,
    imageUrl: r.image_url ?? r.imageUrl,
    unit: r.unit_of_measure ?? r.unit,
  }));
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  const res = await fetch('/api/store/categories', { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.categories ?? [];
}

// ─── AI Disease Detection ──────────────────────────────────────────────────

export interface DiagnosisResult {
  health_status: string;
  disease_type: string;
  crop_type: string;
  causal_agent?: string;
  severity_level: string;
  confidence: number;
  symptoms: string[];
  recommendations: string[];
  products_to_use?: string[];
  application_method?: string;
  prevention?: string;
  urgency?: string;
  detection_method?: string;
  ai_preview?: string;
  upgrade_prompt?: {
    title: string;
    body: string;
    price: string;
  };
}

export interface AnalyzeResponse {
  status: 'success' | 'error';
  source?: string;
  message?: string;
  analysis?: DiagnosisResult;
  timestamp?: string;
}

export async function analyzeDisease(
  imageFile: File,
  opts: { isPremium?: boolean; cropType?: string; userSub?: string; country?: string },
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append('image', imageFile);
  form.append('is_premium', opts.isPremium ? 'true' : 'false');
  if (opts.cropType) form.append('crop_type', opts.cropType);
  if (opts.userSub) form.append('user_sub', opts.userSub);
  if (opts.country) form.append('country', opts.country ?? 'UG');

  const res = await fetch('/api/ai/analyze', { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { status: 'error', message: err.message ?? 'Analysis failed' };
  }
  return res.json();
}

// ─── AI Plan ──────────────────────────────────────────────────────────────

export async function planCrop(opts: {
  task: 'rotation' | 'budget' | 'recommendation';
  crop: string;
  area?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  country?: string;
}): Promise<{ status: string; task: string; crop: string; result: unknown; rawText?: string }> {
  const res = await fetch('/api/ai/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...opts, area: opts.area ?? '1', country: opts.country ?? 'UG' }),
  });
  if (!res.ok) throw new Error('Plan service unavailable');
  return res.json();
}

// ─── Registered Stores ────────────────────────────────────────────────────

export interface RegisteredStore {
  id: string;
  storeName: string;
  tagline?: string;
  ownerSub: string;
  country?: string;
  logoUrl?: string;
  approvalStatus?: string;
  createdAt?: string;
}

const LIST_STORES = `
  query ListRegisteredStores {
    listRegisteredStores(filter: { approvalStatus: { eq: "APPROVED" } }, limit: 50) {
      items { id storeName tagline ownerSub country logoUrl approvalStatus createdAt }
    }
  }
`;

export async function fetchRegisteredStores(): Promise<RegisteredStore[]> {
  try {
    type R = { listRegisteredStores: { items: RegisteredStore[] } };
    const data = await appsync<R>(LIST_STORES);
    return data.listRegisteredStores?.items ?? [];
  } catch {
    return [];
  }
}

// ─── AI Chat ───────────────────────────────────────────────────────────────

export async function aiChat(
  message: string,
  opts?: { country?: string; context?: string },
): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, country: opts?.country ?? 'UG', context: opts?.context }),
  });
  if (!res.ok) throw new Error('Chat failed');
  const data = await res.json();
  return data.message ?? '';
}
