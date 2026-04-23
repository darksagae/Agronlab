/**
 * AGRON MCP Server — portal/app/api/mcp/route.ts
 *
 * Implements the Model Context Protocol (MCP) over Streamable HTTP.
 * Exposes four read-only tools for LLM agents and external integrations:
 *
 *   search_catalog           — full-text + category search of the store
 *   get_market_prices        — regional crop price ranges (aggregated)
 *   get_anonymized_diagnoses — aggregate disease frequency (no PII)
 *   get_crop_almanac         — planting/harvest calendar for a crop × country
 *
 * Transport: JSON-RPC 2.0 over HTTP POST.
 *   - POST with Accept: application/json  → single JSON-RPC response
 *   - GET                                 → returns server info (health check)
 *
 * Auth: optional bearer token via MCP_API_KEY env var. If unset, the endpoint
 * is public (suitable for read-only data). Set MCP_API_KEY in production.
 *
 * Privacy: get_anonymized_diagnoses only returns counts ≥ MIN_COHORT (5).
 * Any cell below that threshold is redacted to protect individual farmers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import outputs from '../../../amplify_outputs.json';

const MCP_API_KEY = process.env.MCP_API_KEY || '';
const STORE_BACKEND_URL = process.env.STORE_BACKEND_URL || 'http://localhost:3001';
const MIN_COHORT = 5;

// ─── AppSync client (for anonymized diagnoses) ────────────────────────────────

function hasApiKey(): boolean {
  const data = (outputs as { data?: { api_key?: string } }).data;
  return typeof data?.api_key === 'string' && data.api_key.length > 0;
}

let _amplifyClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getAmplifyClient(): ReturnType<typeof generateClient<Schema>> | null {
  if (!hasApiKey()) return null;
  if (!_amplifyClient) {
    Amplify.configure(outputs, { ssr: true });
    _amplifyClient = generateClient<Schema>({ authMode: 'apiKey' });
  }
  return _amplifyClient;
}

// ─── Store catalog helper ─────────────────────────────────────────────────────

interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  stock: number;
  inStock: boolean;
  description?: string;
}

let _catalogCache: { data: CatalogProduct[]; ts: number } | null = null;
const CATALOG_TTL = 10 * 60 * 1000;

async function fetchCatalog(): Promise<CatalogProduct[]> {
  if (_catalogCache && Date.now() - _catalogCache.ts < CATALOG_TTL) {
    return _catalogCache.data;
  }
  const res = await fetch(`${STORE_BACKEND_URL}/api/products?limit=1000`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`store-backend error: ${res.status}`);
  const raw: Array<{
    id: number;
    name: string;
    category_name?: string;
    selling_price?: number;
    quantity_in_stock?: number;
    description?: string;
  }> = await res.json();
  const data: CatalogProduct[] = raw.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category_name || 'Other',
    sellingPrice: Number(p.selling_price) || 0,
    stock: Number(p.quantity_in_stock) || 0,
    inStock: Number(p.quantity_in_stock) > 0,
    description: p.description,
  }));
  _catalogCache = { data, ts: Date.now() };
  return data;
}

// ─── Market prices data ───────────────────────────────────────────────────────

const MARKET_PRICES: Record<string, Record<string, { low: number; high: number; unit: string; currency: string }>> = {
  UG: {
    maize:      { low: 700,   high: 1200,  unit: 'kg',   currency: 'UGX' },
    beans:      { low: 2500,  high: 4000,  unit: 'kg',   currency: 'UGX' },
    soybeans:   { low: 1800,  high: 2800,  unit: 'kg',   currency: 'UGX' },
    sorghum:    { low: 800,   high: 1200,  unit: 'kg',   currency: 'UGX' },
    cassava:    { low: 300,   high: 600,   unit: 'kg',   currency: 'UGX' },
    sweetpotato:{ low: 500,   high: 900,   unit: 'kg',   currency: 'UGX' },
    coffee:     { low: 8000,  high: 14000, unit: 'kg',   currency: 'UGX' },
    banana:     { low: 500,   high: 1500,  unit: 'bunch',currency: 'UGX' },
    tomato:     { low: 1500,  high: 4000,  unit: 'kg',   currency: 'UGX' },
    onion:      { low: 1200,  high: 2500,  unit: 'kg',   currency: 'UGX' },
    millet:     { low: 1000,  high: 1800,  unit: 'kg',   currency: 'UGX' },
  },
  KE: {
    maize:      { low: 35,    high: 55,    unit: 'kg',   currency: 'KES' },
    beans:      { low: 90,    high: 150,   unit: 'kg',   currency: 'KES' },
    soybeans:   { low: 60,    high: 100,   unit: 'kg',   currency: 'KES' },
    coffee:     { low: 180,   high: 350,   unit: 'kg',   currency: 'KES' },
    tea:        { low: 18,    high: 35,    unit: 'kg',   currency: 'KES' },
    tomato:     { low: 30,    high: 80,    unit: 'kg',   currency: 'KES' },
    potato:     { low: 25,    high: 55,    unit: 'kg',   currency: 'KES' },
  },
  TZ: {
    maize:      { low: 500,   high: 900,   unit: 'kg',   currency: 'TZS' },
    beans:      { low: 1500,  high: 2800,  unit: 'kg',   currency: 'TZS' },
    rice:       { low: 1200,  high: 2000,  unit: 'kg',   currency: 'TZS' },
    cashew:     { low: 2500,  high: 4500,  unit: 'kg',   currency: 'TZS' },
    sisal:      { low: 400,   high: 700,   unit: 'kg',   currency: 'TZS' },
  },
  RW: {
    maize:      { low: 250,   high: 400,   unit: 'kg',   currency: 'RWF' },
    beans:      { low: 700,   high: 1100,  unit: 'kg',   currency: 'RWF' },
    sorghum:    { low: 300,   high: 500,   unit: 'kg',   currency: 'RWF' },
    potato:     { low: 200,   high: 350,   unit: 'kg',   currency: 'RWF' },
  },
  NG: {
    maize:      { low: 350,   high: 600,   unit: 'kg',   currency: 'NGN' },
    rice:       { low: 600,   high: 900,   unit: 'kg',   currency: 'NGN' },
    cassava:    { low: 120,   high: 250,   unit: 'kg',   currency: 'NGN' },
    yam:        { low: 400,   high: 800,   unit: 'kg',   currency: 'NGN' },
    sorghum:    { low: 280,   high: 480,   unit: 'kg',   currency: 'NGN' },
  },
  GH: {
    maize:      { low: 3,     high: 5.5,   unit: 'kg',   currency: 'GHS' },
    cocoa:      { low: 20,    high: 35,    unit: 'kg',   currency: 'GHS' },
    cassava:    { low: 1,     high: 2.5,   unit: 'kg',   currency: 'GHS' },
    yam:        { low: 4,     high: 8,     unit: 'kg',   currency: 'GHS' },
  },
  ZM: {
    maize:      { low: 3,     high: 5.5,   unit: 'kg',   currency: 'ZMW' },
    soybeans:   { low: 8,     high: 14,    unit: 'kg',   currency: 'ZMW' },
    groundnut:  { low: 9,     high: 16,    unit: 'kg',   currency: 'ZMW' },
    sunflower:  { low: 5,     high: 9,     unit: 'kg',   currency: 'ZMW' },
  },
};

// ─── Crop almanac ─────────────────────────────────────────────────────────────

const ALMANAC: Record<string, Record<string, {
  plantingMonths: number[];
  harvestMonths: number[];
  daysToMaturity: number;
  waterRequirement: 'low' | 'medium' | 'high';
  seasons: string[];
}>> = {
  maize: {
    UG: { plantingMonths: [3,4,9,10], harvestMonths: [7,8,12,1], daysToMaturity: 110, waterRequirement: 'medium', seasons: ['long rains', 'short rains'] },
    KE: { plantingMonths: [3,4,10,11], harvestMonths: [7,8,1,2], daysToMaturity: 110, waterRequirement: 'medium', seasons: ['long rains', 'short rains'] },
    TZ: { plantingMonths: [3,4,10,11], harvestMonths: [7,8,2,3], daysToMaturity: 115, waterRequirement: 'medium', seasons: ['masika', 'vuli'] },
    NG: { plantingMonths: [4,5,6], harvestMonths: [8,9,10], daysToMaturity: 120, waterRequirement: 'medium', seasons: ['rainy season'] },
    GH: { plantingMonths: [4,5,8,9], harvestMonths: [7,8,11,12], daysToMaturity: 105, waterRequirement: 'medium', seasons: ['major', 'minor'] },
  },
  beans: {
    UG: { plantingMonths: [3,4,9,10], harvestMonths: [6,7,12,1], daysToMaturity: 75, waterRequirement: 'medium', seasons: ['long rains', 'short rains'] },
    KE: { plantingMonths: [3,4,10,11], harvestMonths: [6,7,1,2], daysToMaturity: 80, waterRequirement: 'medium', seasons: ['long rains', 'short rains'] },
    RW: { plantingMonths: [2,3,9,10], harvestMonths: [5,6,12,1], daysToMaturity: 75, waterRequirement: 'medium', seasons: ['season A', 'season B'] },
  },
  cassava: {
    UG: { plantingMonths: [3,4,5,9,10,11], harvestMonths: [6,7,8,9,10,11,12], daysToMaturity: 270, waterRequirement: 'low', seasons: ['any'] },
    NG: { plantingMonths: [4,5,6,7], harvestMonths: [10,11,12,1], daysToMaturity: 270, waterRequirement: 'low', seasons: ['rainy season'] },
    GH: { plantingMonths: [4,5,9,10], harvestMonths: [1,2,3,4,5,6], daysToMaturity: 300, waterRequirement: 'low', seasons: ['major', 'minor'] },
    TZ: { plantingMonths: [3,4,5,10,11], harvestMonths: [11,12,1,2,3], daysToMaturity: 270, waterRequirement: 'low', seasons: ['masika'] },
  },
  coffee: {
    UG: { plantingMonths: [3,4,9,10], harvestMonths: [10,11,12,1,2], daysToMaturity: 365 * 3, waterRequirement: 'medium', seasons: ['perennial'] },
    KE: { plantingMonths: [3,4], harvestMonths: [10,11,12,1], daysToMaturity: 365 * 3, waterRequirement: 'medium', seasons: ['perennial'] },
    TZ: { plantingMonths: [3,4], harvestMonths: [6,7,8], daysToMaturity: 365 * 3, waterRequirement: 'medium', seasons: ['perennial'] },
  },
  rice: {
    TZ: { plantingMonths: [11,12,1], harvestMonths: [3,4,5], daysToMaturity: 130, waterRequirement: 'high', seasons: ['masika'] },
    NG: { plantingMonths: [5,6], harvestMonths: [9,10], daysToMaturity: 125, waterRequirement: 'high', seasons: ['rainy season'] },
  },
  tomato: {
    UG: { plantingMonths: [1,2,6,7], harvestMonths: [4,5,9,10], daysToMaturity: 80, waterRequirement: 'high', seasons: ['dry season with irrigation'] },
    KE: { plantingMonths: [1,2,6,7], harvestMonths: [4,5,9,10], daysToMaturity: 75, waterRequirement: 'high', seasons: ['dry season with irrigation'] },
  },
};

// ─── Tool implementations ─────────────────────────────────────────────────────

async function toolSearchCatalog(args: {
  query?: string;
  category?: string;
  inStockOnly?: boolean;
  limit?: number;
}): Promise<unknown> {
  const { query = '', category, inStockOnly = false, limit = 20 } = args;
  const products = await fetchCatalog();

  let results = products;

  if (inStockOnly) results = results.filter(p => p.inStock);
  if (category) {
    const cat = category.toLowerCase();
    results = results.filter(p => p.category.toLowerCase().includes(cat));
  }
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
    );
  }

  return {
    total: results.length,
    returned: Math.min(results.length, limit),
    products: results.slice(0, limit).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sellingPrice: p.sellingPrice,
      inStock: p.inStock,
      stockQty: p.stock,
    })),
  };
}

function toolGetMarketPrices(args: {
  country?: string;
  crop?: string;
}): unknown {
  const { country, crop } = args;

  if (country && crop) {
    const cc = country.toUpperCase();
    const cr = crop.toLowerCase();
    const countryData = MARKET_PRICES[cc];
    if (!countryData) return { error: `No price data for country: ${cc}` };
    const cropData = countryData[cr];
    if (!cropData) return { error: `No price data for ${cr} in ${cc}` };
    return { country: cc, crop: cr, ...cropData, note: 'Indicative farm-gate prices; updated quarterly.' };
  }

  if (country) {
    const cc = country.toUpperCase();
    const countryData = MARKET_PRICES[cc];
    if (!countryData) return { error: `No price data for country: ${cc}` };
    return {
      country: cc,
      prices: Object.entries(countryData).map(([c, v]) => ({ crop: c, ...v })),
      note: 'Indicative farm-gate prices; updated quarterly.',
    };
  }

  return {
    availableCountries: Object.keys(MARKET_PRICES),
    summary: Object.fromEntries(
      Object.entries(MARKET_PRICES).map(([cc, crops]) => [cc, Object.keys(crops)]),
    ),
  };
}

async function toolGetAnonymizedDiagnoses(args: {
  country?: string;
  crop?: string;
  skill?: string;
  limit?: number;
}): Promise<unknown> {
  const client = getAmplifyClient();
  if (!client) {
    return {
      error: 'AppSync API key not configured — anonymized data unavailable until npx ampx sandbox is run.',
    };
  }

  const { country, crop, limit = 50 } = args;
  const skill = args.skill || 'diagnose-crop';

  const baseFilter = { skill: { eq: skill }, success: { eq: true } };
  const countryFilter = country
    ? { skill: { eq: skill }, success: { eq: true }, country: { eq: country.toUpperCase() } }
    : baseFilter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: runs, errors } = await client.models.AgentSkillRun.list({
    filter: countryFilter as never,
    limit: Math.min(limit * 10, 500),
    authMode: 'apiKey',
  });

  if (errors?.length) return { error: 'Failed to fetch diagnosis data', details: errors };
  if (!runs?.length) return { totalDiagnoses: 0, patterns: [] };

  // Aggregate by disease × crop × country — never return individual rows
  const counts: Record<string, { country: string; crop: string; disease: string; count: number }> = {};

  for (const run of runs) {
    let outcome: Record<string, unknown> = {};
    let inputs: Record<string, unknown> = {};
    try { if (run.outcomeJson) outcome = JSON.parse(run.outcomeJson); } catch { /* skip */ }
    try { if (run.inputsJson) inputs = JSON.parse(run.inputsJson); } catch { /* skip */ }

    const runCrop = ((inputs.crop || inputs.cropHint || outcome.crop) as string | undefined)?.toLowerCase();
    const runDisease = ((outcome.disease || outcome.causalAgent || outcome.diseaseType) as string | undefined);
    const runCountry = run.country?.toUpperCase();

    if (!runCrop || !runDisease || !runCountry) continue;
    if (crop && runCrop !== crop.toLowerCase()) continue;

    const key = `${runCountry}::${runCrop}::${runDisease}`;
    if (counts[key]) {
      counts[key].count++;
    } else {
      counts[key] = { country: runCountry, crop: runCrop, disease: runDisease, count: 1 };
    }
  }

  // Privacy filter: suppress any cell with fewer than MIN_COHORT observations
  const patterns = Object.values(counts)
    .filter(c => c.count >= MIN_COHORT)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const suppressed = Object.values(counts).filter(c => c.count < MIN_COHORT).length;

  return {
    totalDiagnoses: runs.length,
    skill,
    patterns,
    suppressedCells: suppressed,
    privacyNote: `Cells with fewer than ${MIN_COHORT} observations are suppressed. Individual farmer data is never returned.`,
  };
}

function toolGetCropAlmanac(args: {
  crop: string;
  country?: string;
}): unknown {
  const { crop, country } = args;
  const cr = crop.toLowerCase();
  const cropData = ALMANAC[cr];

  if (!cropData) {
    return {
      error: `No almanac data for crop: ${cr}`,
      availableCrops: Object.keys(ALMANAC),
    };
  }

  if (country) {
    const cc = country.toUpperCase();
    const entry = cropData[cc];
    if (!entry) {
      return {
        error: `No almanac data for ${cr} in ${cc}`,
        availableCountries: Object.keys(cropData),
      };
    }
    return {
      crop: cr,
      country: cc,
      ...entry,
      plantingMonthNames: entry.plantingMonths.map(m =>
        new Date(2000, m - 1).toLocaleString('en', { month: 'long' }),
      ),
      harvestMonthNames: entry.harvestMonths.map(m =>
        new Date(2000, m - 1).toLocaleString('en', { month: 'long' }),
      ),
    };
  }

  return {
    crop: cr,
    countries: Object.fromEntries(
      Object.entries(cropData).map(([cc, entry]) => [cc, {
        ...entry,
        plantingMonthNames: entry.plantingMonths.map(m =>
          new Date(2000, m - 1).toLocaleString('en', { month: 'long' }),
        ),
      }]),
    ),
  };
}

// ─── MCP tool definitions ─────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_catalog',
    description:
      'Search the AGRON store product catalog by keyword, category, or availability. Returns product names, prices, stock status, and IDs that can be used in recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text search — matches product name, category, description.' },
        category: { type: 'string', description: 'Filter by category name (e.g. "fungicide", "seed", "fertilizer").' },
        inStockOnly: { type: 'boolean', description: 'If true, only return products currently in stock.' },
        limit: { type: 'integer', description: 'Max results to return (default 20, max 100).', default: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_market_prices',
    description:
      'Get indicative farm-gate price ranges for crops in a specific African country. Returns low/high price per unit and the local currency. Use to populate rotation ROI estimates or market-pricing skill context.',
    inputSchema: {
      type: 'object',
      properties: {
        country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code (e.g. "UG", "KE", "TZ", "NG").' },
        crop: { type: 'string', description: 'Crop name in English, lowercase (e.g. "maize", "beans", "coffee").' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_anonymized_diagnoses',
    description:
      'Retrieve aggregated (privacy-preserving) disease frequency patterns from AGRON diagnoses. Returns crop × disease × country counts ≥ 5 observations — individual farmer data is never exposed. Useful for understanding prevalent diseases in a region.',
    inputSchema: {
      type: 'object',
      properties: {
        country: { type: 'string', description: 'Filter by country code (e.g. "UG").' },
        crop: { type: 'string', description: 'Filter by crop name.' },
        limit: { type: 'integer', description: 'Max patterns to return (default 50).', default: 50 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_crop_almanac',
    description:
      'Get planting and harvest calendar data for a crop in a specific country, including recommended planting months, harvest months, days to maturity, water requirements, and growing seasons. Use to verify timing in seasonal plans.',
    inputSchema: {
      type: 'object',
      required: ['crop'],
      properties: {
        crop: { type: 'string', description: 'Crop name in English, lowercase (e.g. "maize", "beans", "cassava", "tomato").' },
        country: { type: 'string', description: 'ISO 3166-1 alpha-2 code — omit to get data for all available countries.' },
      },
      additionalProperties: false,
    },
  },
];

// ─── JSON-RPC dispatch ────────────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: unknown;
};

async function dispatch(rpc: JsonRpcRequest): Promise<unknown> {
  const { method, params, id } = rpc;

  const ok = (result: unknown) => ({ jsonrpc: '2.0', id, result });
  const err = (code: number, message: string, data?: unknown) => ({
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data ? { data } : {}) },
  });

  switch (method) {
    case 'initialize':
      return ok({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'agron-mcp', version: '1.0.0' },
      });

    case 'tools/list':
      return ok({ tools: TOOLS });

    case 'tools/call': {
      const p = params as { name?: string; arguments?: Record<string, unknown> };
      if (!p?.name) return err(-32602, 'Missing tool name');
      const args = p.arguments || {};

      try {
        let result: unknown;
        switch (p.name) {
          case 'search_catalog':
            result = await toolSearchCatalog(args as Parameters<typeof toolSearchCatalog>[0]);
            break;
          case 'get_market_prices':
            result = toolGetMarketPrices(args as Parameters<typeof toolGetMarketPrices>[0]);
            break;
          case 'get_anonymized_diagnoses':
            result = await toolGetAnonymizedDiagnoses(args as Parameters<typeof toolGetAnonymizedDiagnoses>[0]);
            break;
          case 'get_crop_almanac':
            result = toolGetCropAlmanac(args as Parameters<typeof toolGetCropAlmanac>[0]);
            break;
          default:
            return err(-32601, `Unknown tool: ${p.name}`);
        }
        return ok({ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        return err(-32603, 'Tool execution error', e instanceof Error ? e.message : String(e));
      }
    }

    case 'notifications/initialized':
      // Client acknowledges the connection — no response needed for notifications
      return null;

    default:
      return err(-32601, `Method not found: ${method}`);
  }
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function checkAuth(req: NextRequest): boolean {
  if (!MCP_API_KEY) return true;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${MCP_API_KEY}`;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    server: 'agron-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    transport: 'streamable-http',
    endpoint: '/api/mcp',
  });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    );
  }

  // Batch requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map(async (rpc: JsonRpcRequest) => {
        if (rpc?.jsonrpc !== '2.0' || !rpc.method) {
          return { jsonrpc: '2.0', id: rpc?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
        }
        return dispatch(rpc);
      }),
    );
    // Filter nulls (notifications don't get responses)
    const filtered = responses.filter(r => r !== null);
    return NextResponse.json(filtered);
  }

  // Single request
  const rpc = body as JsonRpcRequest;
  if (rpc?.jsonrpc !== '2.0' || !rpc.method) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: rpc?.id ?? null, error: { code: -32600, message: 'Invalid Request' } },
      { status: 400 },
    );
  }

  const response = await dispatch(rpc);
  if (response === null) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(response);
}
