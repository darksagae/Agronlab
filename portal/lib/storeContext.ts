/**
 * Fetches live product data from the store-backend and structures it for
 * injection into Gemini agent prompts.
 *
 * Two exports:
 *  - getLiveStoreContext(currency) → plain text for system prompts
 *  - getProductsForAgent()         → rich structured object for the plan agent
 */

const STORE_BACKEND_URL = process.env.STORE_BACKEND_URL || 'http://localhost:3001';

export interface StoreProduct {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice?: number;
  stock: number;
  inStock: boolean;
}

export interface StoreCatalog {
  byCategory: Record<string, StoreProduct[]>;
  allProducts: StoreProduct[];
  fetchedAt: string;
}

let _catalogCache: { data: StoreCatalog; ts: number } | null = null;
let _textCache: { text: string; ts: number } | null = null;
const TTL = 10 * 60 * 1000; // 10 min

// ─── Internal fetch ───────────────────────────────────────────────────────────

async function fetchCatalog(): Promise<StoreCatalog> {
  if (_catalogCache && Date.now() - _catalogCache.ts < TTL) return _catalogCache.data;

  const [catRes, prodRes] = await Promise.all([
    fetch(`${STORE_BACKEND_URL}/api/categories`, { cache: 'no-store' }),
    fetch(`${STORE_BACKEND_URL}/api/products?limit=500`, { cache: 'no-store' }),
  ]);

  if (!catRes.ok || !prodRes.ok) throw new Error('store-backend unreachable');

  const categories: Array<{ id: number; name: string }> = await catRes.json();
  const rawProducts: Array<{
    id: number;
    name: string;
    category_name?: string;
    selling_price?: number;
    cost_price?: number;
    quantity_in_stock?: number;
  }> = await prodRes.json();

  const allProducts: StoreProduct[] = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category_name || 'Other',
    sellingPrice: Number(p.selling_price) || 0,
    costPrice: Number(p.cost_price) || undefined,
    stock: Number(p.quantity_in_stock) || 0,
    inStock: (Number(p.quantity_in_stock) || 0) > 0,
  }));

  const byCategory: Record<string, StoreProduct[]> = {};
  for (const cat of categories) {
    byCategory[cat.name] = allProducts.filter(p => p.category === cat.name);
  }

  const data: StoreCatalog = { byCategory, allProducts, fetchedAt: new Date().toISOString() };
  _catalogCache = { data, ts: Date.now() };
  return data;
}

// ─── Public exports ───────────────────────────────────────────────────────────

/** Returns the catalog or null if the store is unreachable. */
export async function getProductsForAgent(): Promise<StoreCatalog | null> {
  try {
    return await fetchCatalog();
  } catch {
    return null;
  }
}

/**
 * Returns a plain-text block injected into Gemini system prompts.
 * Shows top products per category with live prices and stock status.
 */
export async function getLiveStoreContext(currency = 'UGX'): Promise<string> {
  if (_textCache && Date.now() - _textCache.ts < TTL) return _textCache.text;

  try {
    const catalog = await fetchCatalog();
    const lines: string[] = [`AGRON STORE — LIVE CATALOG (as of ${new Date().toLocaleTimeString()}):`];

    for (const [catName, products] of Object.entries(catalog.byCategory)) {
      if (!products.length) continue;
      const inStock = products.filter(p => p.inStock);
      const sample = inStock.slice(0, 5).map(p =>
        `${p.name} (${currency} ${p.sellingPrice.toLocaleString()}${p.stock < 10 ? ' — low stock' : ''})`
      );
      if (!sample.length) continue;
      lines.push(`- ${catName}: ${sample.join('; ')}`);
    }
    lines.push(`Total products: ${catalog.allProducts.length}`);

    const text = lines.join('\n');
    _textCache = { text, ts: Date.now() };
    return text;
  } catch {
    return [
      'AGRON STORE CATALOG (general — store temporarily unreachable):',
      '- Seeds: maize, beans, soybeans, sorghum, millet, vegetables',
      '- Fertilizers: CAN, DAP, NPK 17-17-17, Urea, Optimizer foliar',
      '- Fungicides: Mancozeb, Ridomil Gold, Amistar Top, Score 250 EC, Dithane M45',
      '- Herbicides: Roundup, Weedmaster, Stomp, Galex',
      '- Nursery items, pesticides, irrigation supplies',
    ].join('\n');
  }
}

/** Formats the full catalog as an agent "tool output" block for deep reasoning. */
export function formatCatalogForAgent(catalog: StoreCatalog, currency = 'UGX'): string {
  const lines: string[] = ['=== TOOL OUTPUT: AGRON STORE LIVE INVENTORY ==='];

  for (const [catName, products] of Object.entries(catalog.byCategory)) {
    const inStock = products.filter(p => p.inStock && p.sellingPrice > 0);
    if (!inStock.length) continue;
    lines.push(`\n[${catName.toUpperCase()}]`);
    inStock.slice(0, 12).forEach(p => {
      lines.push(`  • ${p.name}: ${currency} ${p.sellingPrice.toLocaleString()} (stock: ${p.stock} units)`);
    });
    if (inStock.length > 12) lines.push(`  ... and ${inStock.length - 12} more ${catName} products`);
  }

  lines.push('\n=== END STORE INVENTORY ===');
  return lines.join('\n');
}
