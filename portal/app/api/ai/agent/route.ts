/**
 * AGRON Master AI Agent — thin dispatcher.
 *
 * Skills live as self-documenting files in portal/agent-skills/. Each folder
 * holds SKILL.md (frontmatter + instructions) and one or more prompt templates.
 * This route only: loads the picked skill, renders its prompt, runs Gemini,
 * and shapes the response. No skill-specific logic below.
 *
 * Preserved response shape (mobile contract):
 *   diagnose     → { status, skill, tier, preview|result, upgradePrompt?, meta?, timestamp }
 *   plan         → { status, skill, crop, recommendation, timestamp }
 *   rotation     → { status, skill, crop, result, rawText?, timestamp }
 *   budget       → { status, skill, crop, result, rawText?, timestamp }
 *   product_search, market → { status, skill, result, rawText?, timestamp }
 *   list         → { status, skills: [{name, description, origin}] }  (new)
 */

import { NextRequest, NextResponse } from 'next/server';
import { COUNTRIES } from '@/lib/countryConfig';
import { getProductsForAgent, formatCatalogForAgent, getLiveStoreContext } from '@/lib/storeContext';
import { listSkills, loadSkill, renderTemplate, LoadedSkill } from '@/lib/skills/registry';
import { createConfirmation, consumeConfirmation } from '@/lib/skills/confirmations';
import { logSkillRun } from '@/lib/skills/log';
import { ensureUserDir } from '@/lib/skills/manifest';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const STORE_BACKEND_URL = process.env.STORE_BACKEND_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserContext {
  farmProfile?: {
    farmName?: string;
    totalAcres?: number;
    crops?: string[];
    location?: string;
    soilType?: string;
  };
  recentDiagnoses?: Array<{
    cropType: string;
    diseaseType: string;
    scannedAt: string;
    severity?: string;
  }>;
  cropPlans?: Array<{
    crop: string;
    area: string;
    startDate: string;
    endDate: string;
  }>;
  subscription?: 'free' | 'premium';
}

interface AgentRequest {
  // Alias: both `skill` and the legacy `skill_name` accepted
  skill?: string;
  country?: string;
  userContext?: UserContext;
  userSub?: string;
  image?: string;
  mimeType?: string;
  cropHint?: string;
  crop?: string;
  area?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  history?: string;
  query?: string;
  diseaseType?: string;
  crops?: string[];
  // Accept a raw pass-through bag too
  [k: string]: unknown;
}

// ─── Regional market prices (tool output) ─────────────────────────────────────

const MARKET_PRICES: Record<string, Record<string, string>> = {
  UG: {
    maize: 'UGX 700–1,200/kg', beans: 'UGX 2,500–4,000/kg',
    soybeans: 'UGX 1,800–2,800/kg', sorghum: 'UGX 800–1,200/kg',
    cassava: 'UGX 300–600/kg', sweetpotato: 'UGX 500–900/kg',
    coffee: 'UGX 8,000–14,000/kg (arabica)', banana: 'UGX 500–1,500/bunch',
    tomato: 'UGX 1,500–4,000/kg', onion: 'UGX 1,200–2,500/kg',
    cabbage: 'UGX 800–2,000/head', millet: 'UGX 1,000–1,800/kg',
  },
  KE: {
    maize: 'KES 35–55/kg', beans: 'KES 90–150/kg',
    soybeans: 'KES 60–100/kg', coffee: 'KES 180–350/kg (clean)',
    tea: 'KES 18–35/kg (green leaf)', tomato: 'KES 30–80/kg',
  },
  TZ: {
    maize: 'TZS 500–900/kg', beans: 'TZS 1,500–2,800/kg',
    rice: 'TZS 1,200–2,000/kg', cashew: 'TZS 2,500–4,500/kg',
  },
  RW: {
    maize: 'RWF 250–400/kg', beans: 'RWF 700–1,100/kg',
    sorghum: 'RWF 300–500/kg', potato: 'RWF 200–350/kg',
  },
};

function getMarketBlock(country: string): string {
  const prices = MARKET_PRICES[country] || MARKET_PRICES['UG'];
  const lines = [`=== TOOL OUTPUT: REGIONAL MARKET PRICES (${country}) ===`];
  Object.entries(prices).forEach(([crop, price]) => {
    lines.push(`  • ${crop.charAt(0).toUpperCase() + crop.slice(1)}: ${price}`);
  });
  lines.push('=== END MARKET PRICES ===');
  return lines.join('\n');
}

function buildUserContextBlock(ctx: UserContext | undefined): string {
  if (!ctx) return '';
  const lines: string[] = ['=== TOOL OUTPUT: USER FARM CONTEXT ==='];
  if (ctx.farmProfile) {
    const fp = ctx.farmProfile;
    if (fp.farmName) lines.push(`  Farm: ${fp.farmName}`);
    if (fp.totalAcres) lines.push(`  Size: ${fp.totalAcres} acres`);
    if (fp.location) lines.push(`  Location: ${fp.location}`);
    if (fp.soilType) lines.push(`  Soil: ${fp.soilType}`);
    if (fp.crops?.length) lines.push(`  Crops grown: ${fp.crops.join(', ')}`);
  }
  if (ctx.recentDiagnoses?.length) {
    lines.push('  Recent diagnoses:');
    ctx.recentDiagnoses.slice(0, 5).forEach(d => {
      lines.push(`    - ${d.cropType}: ${d.diseaseType} (${d.severity || 'unknown severity'}, ${d.scannedAt.split('T')[0]})`);
    });
  }
  if (ctx.cropPlans?.length) {
    lines.push('  Active crop plans:');
    ctx.cropPlans.slice(0, 3).forEach(p => {
      lines.push(`    - ${p.crop} (${p.area} acres, ${p.startDate} → ${p.endDate})`);
    });
  }
  lines.push('=== END USER CONTEXT ===');
  return lines.join('\n');
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  country: string,
  skill: LoadedSkill,
  catalogBlock: string,
  marketBlock: string,
  userBlock: string
): string {
  const countryInfo = COUNTRIES[country];
  const currency = countryInfo?.currency?.code || 'UGX';
  return `You are AGRON's master AI agricultural agent for ${countryInfo?.name || country}.
Currency: ${currency}.

Active skill: ${skill.meta.name}
${skill.instructions}

You have access to three real-time data sources pre-loaded below:

${userBlock ? userBlock + '\n' : ''}${catalogBlock}

${marketBlock}

AGENT REASONING PROTOCOL — apply before every response:
1. SITUATION — what is the farmer's specific context from the user data above?
2. RESOURCES — what inputs are available in the store? Cite exact names and prices.
3. ECONOMICS — what are the costs, revenues, and profit margins?
4. AGRONOMY — what does crop science recommend for this situation?
5. RISKS — what could go wrong and how to mitigate?
6. OUTPUT — produce clean, actionable output matching the exact schema from the skill.

Rules:
- Always reference specific product names and prices from the store inventory.
- Prioritize products available in the user's country (${country}).
- Return only valid JSON for JSON skills — no markdown fences, no commentary.
- For text skills, use clear section headers.
- Never invent prices; use store prices or market data provided.`;
}

// ─── Gemini callers ───────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGeminiWithImage(
  systemPrompt: string,
  textPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        parts: [
          { text: textPrompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.15, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── JSON parse helper ────────────────────────────────────────────────────────

function parseJSON(raw: string): unknown | null {
  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

// ─── Skill name aliasing (backward compat) ───────────────────────────────────

const SKILL_ALIASES: Record<string, string> = {
  diagnose: 'diagnose-crop',
  plan: 'plan-season',
  rotation: 'rotation-strategy',
  budget: 'budget-calculator',
  product_search: 'product-search',
  market: 'market-pricing',
};

function resolveSkillName(input: string): string {
  return SKILL_ALIASES[input] || input;
}

// Reverse — what the mobile contract expects in the response's `skill` field
const RESPONSE_SKILL_ALIAS: Record<string, string> = {
  'diagnose-crop': 'diagnose',
  'plan-season': 'plan',
  'rotation-strategy': 'rotation',
  'budget-calculator': 'budget',
  'product-search': 'product_search',
  'market-pricing': 'market',
};

// ─── Input validation ────────────────────────────────────────────────────────

function validateInputs(skill: LoadedSkill, body: AgentRequest): string | null {
  for (const field of skill.meta.inputs) {
    if (field === 'country') continue; // defaulted
    const v = body[field];
    const isEmpty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (isEmpty) return `${field} is required for skill '${skill.meta.name}'`;
  }
  if (skill.meta.needsImage && !body.image) {
    return `image (base64) is required for skill '${skill.meta.name}'`;
  }
  return null;
}

// ─── place-order (deterministic, two-phase) ──────────────────────────────────

interface OrderItemInput { productId: number; quantity: number; }

async function fetchProductById(id: number): Promise<{ id: number; name: string; selling_price: number; quantity_in_stock: number } | null> {
  try {
    const res = await fetch(`${STORE_BACKEND_URL}/api/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function handlePlaceOrder(body: AgentRequest): Promise<NextResponse> {
  const userSub = typeof body.userSub === 'string' ? body.userSub : undefined;
  const confirmToken = typeof body.confirmToken === 'string' ? body.confirmToken : '';
  const country = (body.country as string) || 'UG';
  const currency = (body.currency as string) || COUNTRIES[country]?.currency?.code || 'UGX';
  const startedAt = Date.now();

  // ── Phase 2: commit ───────────────────────────────────────────────────────
  if (confirmToken) {
    const action = consumeConfirmation(confirmToken, 'place-order', userSub);
    if (!action) {
      await logSkillRun({
        skill: 'place-order',
        userSub,
        country,
        inputs: { phase: 'commit' },
        success: false,
        errorMessage: 'Confirmation token expired or invalid',
        latencyMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { status: 'error', message: 'Confirmation token expired or invalid' },
        { status: 410 }
      );
    }

    const stashed = action.payload as {
      items: OrderItemInput[];
      shippingAddress?: unknown;
      notes?: string;
      currency: string;
    };

    try {
      const res = await fetch(`${STORE_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSub: action.userSub || null,
          items: stashed.items,
          shippingAddress: stashed.shippingAddress,
          notes: stashed.notes,
          currency: stashed.currency,
          source: 'agent',
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        await logSkillRun({
          skill: 'place-order',
          userSub,
          country,
          inputs: { phase: 'commit', itemCount: stashed.items.length },
          success: false,
          errorMessage: order.error || `store-backend ${res.status}`,
          latencyMs: Date.now() - startedAt,
        });
        return NextResponse.json(
          { status: 'error', phase: 'commit', message: order.error || 'Order commit failed', details: order },
          { status: res.status }
        );
      }
      const runId = await logSkillRun({
        skill: 'place-order',
        userSub,
        country,
        inputs: { phase: 'commit', itemCount: stashed.items.length },
        outcome: {
          orderNumber: order.orderNumber,
          orderId: order.id,
          subtotal: order.subtotal,
          currency: stashed.currency,
        },
        success: true,
        latencyMs: Date.now() - startedAt,
      });
      return NextResponse.json({
        status: 'success',
        skill: 'place-order',
        phase: 'committed',
        order,
        runId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      await logSkillRun({
        skill: 'place-order',
        userSub,
        country,
        inputs: { phase: 'commit' },
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Store backend unreachable',
        latencyMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { status: 'error', phase: 'commit', message: err instanceof Error ? err.message : 'Store backend unreachable' },
        { status: 502 }
      );
    }
  }

  // ── Phase 1: prepare ──────────────────────────────────────────────────────
  const rawItems = (body as { items?: unknown }).items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ status: 'error', message: 'items array is required' }, { status: 400 });
  }

  const items: OrderItemInput[] = [];
  for (const it of rawItems as Array<Record<string, unknown>>) {
    const productId = Number(it.productId);
    const quantity = Number(it.quantity);
    if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'each item needs productId and positive quantity' },
        { status: 400 }
      );
    }
    items.push({ productId, quantity });
  }

  // Price + stock-check against live store-backend
  const warnings: string[] = [];
  const lines: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    inStock: boolean;
  }> = [];
  let subtotal = 0;

  for (const it of items) {
    const p = await fetchProductById(it.productId);
    if (!p) {
      warnings.push(`Product ${it.productId} not found — skipped`);
      continue;
    }
    const unitPrice = Number(p.selling_price) || 0;
    const inStock = (p.quantity_in_stock || 0) >= it.quantity;
    if (!inStock) {
      warnings.push(`${p.name}: only ${p.quantity_in_stock} in stock, requested ${it.quantity}`);
    }
    const lineTotal = unitPrice * it.quantity;
    subtotal += lineTotal;
    lines.push({
      productId: p.id,
      productName: p.name,
      quantity: it.quantity,
      unitPrice,
      lineTotal,
      inStock,
    });
  }

  if (lines.length === 0) {
    return NextResponse.json(
      { status: 'error', message: 'No valid products in order', warnings },
      { status: 400 }
    );
  }

  const payload = {
    items: lines.filter(l => l.inStock).map(l => ({ productId: l.productId, quantity: l.quantity })),
    shippingAddress: (body as { shippingAddress?: unknown }).shippingAddress,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
    currency,
  };

  if (payload.items.length === 0) {
    return NextResponse.json(
      { status: 'error', message: 'No in-stock items to confirm', warnings, lines },
      { status: 409 }
    );
  }

  const { token, expiresAt } = createConfirmation('place-order', payload, userSub);

  const itemCount = lines.length;
  const summary = `${itemCount} item${itemCount === 1 ? '' : 's'}, total ${currency} ${subtotal.toLocaleString()}`;

  const runId = await logSkillRun({
    skill: 'place-order',
    userSub,
    country,
    inputs: { phase: 'prepare', requestedItems: items.length, validLines: lines.length },
    outcome: { subtotal, currency, warningsCount: warnings.length },
    success: true,
    latencyMs: Date.now() - startedAt,
  });

  return NextResponse.json({
    status: 'success',
    skill: 'place-order',
    phase: 'prepare',
    pendingAction: {
      type: 'order',
      items: lines,
      subtotal,
      currency,
      warnings,
    },
    confirmToken: token,
    expiresAt,
    summary,
    runId,
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'Gemini API key not configured' }, { status: 503 });
    }

    const body = await req.json() as AgentRequest;
    const rawSkillName = (body.skill as string | undefined) || '';

    // Scaffold user directory on first use (fire-and-forget)
    if (body.userSub) ensureUserDir(body.userSub).catch(() => undefined);

    // Discovery endpoint — list available skills (progressive disclosure)
    if (!rawSkillName || rawSkillName === 'list') {
      const skills = await listSkills(body.userSub);
      return NextResponse.json({ status: 'success', skills });
    }

    const skillName = resolveSkillName(rawSkillName);
    const skill = await loadSkill(skillName, body.userSub);
    if (!skill) {
      return NextResponse.json(
        { status: 'error', message: `Unknown skill: ${rawSkillName}` },
        { status: 400 }
      );
    }

    // place-order is deterministic — bypass Gemini, run the two-phase flow.
    if (skill.meta.name === 'place-order') {
      return handlePlaceOrder(body);
    }

    const validationError = validateInputs(skill, body);
    if (validationError) {
      await logSkillRun({
        skill: skill.meta.name,
        userSub: body.userSub,
        country: body.country || 'UG',
        success: false,
        errorMessage: validationError,
      });
      return NextResponse.json({ status: 'error', message: validationError }, { status: 400 });
    }

    const country = body.country || 'UG';
    const userContext = body.userContext;
    const isPremium = userContext?.subscription === 'premium';
    const currency = COUNTRIES[country]?.currency?.code || 'UGX';
    const runStartedAt = Date.now();

    // Pre-fetch context (store catalog + market + user)
    const [catalog, fallbackText] = await Promise.all([
      getProductsForAgent(),
      getLiveStoreContext(currency),
    ]);
    const catalogBlock = catalog
      ? formatCatalogForAgent(catalog, currency)
      : `=== STORE INVENTORY ===\n${fallbackText}\n=== END ===`;
    const marketBlock = getMarketBlock(country);
    const userBlock = buildUserContextBlock(userContext);

    const systemPrompt = buildSystemPrompt(country, skill, catalogBlock, marketBlock, userBlock);

    // Pick prompt template variant (tier-aware)
    let promptTemplate = skill.prompt;
    if (skill.meta.premium === 'tiered') {
      promptTemplate = isPremium
        ? (skill.promptPremium || skill.prompt)
        : (skill.promptFree || skill.prompt);
    }

    // Template vars — pass everything the skill might need
    const vars: Record<string, unknown> = {
      crop: body.crop || '',
      cropHint: body.cropHint || '',
      area: body.area || '1',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      notes: body.notes || '',
      history: body.history || (userContext?.recentDiagnoses?.map(d => `${d.cropType}: ${d.diseaseType}`).join('; ') || ''),
      query: body.query || (body.diseaseType && body.crop ? `${body.diseaseType} on ${body.crop}` : body.diseaseType || ''),
      diseaseType: body.diseaseType || '',
      country,
      cropsList: (body.crops && body.crops.length ? body.crops : [body.crop].filter(Boolean)).join(', '),
    };
    const userPrompt = renderTemplate(promptTemplate, vars);

    // Execute — image vs text
    const rawText = skill.meta.needsImage
      ? await callGeminiWithImage(systemPrompt, userPrompt, body.image!, body.mimeType || 'image/jpeg')
      : await callGemini(systemPrompt, userPrompt);

    const latencyMs = Date.now() - runStartedAt;

    // Shape response to preserve mobile contract
    const responseSkill = RESPONSE_SKILL_ALIAS[skill.meta.name] || skill.meta.name;
    const ts = new Date().toISOString();

    // Non-image inputs captured for evolution — never log raw images.
    const loggedInputs: Record<string, unknown> = {
      crop: body.crop,
      cropHint: body.cropHint,
      area: body.area,
      query: body.query,
      diseaseType: body.diseaseType,
      history: body.history,
      hasImage: !!body.image,
    };

    // diagnose-crop tier split
    if (skill.meta.name === 'diagnose-crop') {
      if (!isPremium) {
        const runId = await logSkillRun({
          skill: skill.meta.name,
          userSub: body.userSub,
          country,
          isPremium: false,
          inputs: loggedInputs,
          outcome: { tier: 'free' },
          rawOutput: rawText,
          success: true,
          latencyMs,
        });
        return NextResponse.json({
          status: 'success',
          skill: responseSkill,
          tier: 'free',
          preview: rawText,
          upgradePrompt: {
            title: 'Full AI diagnosis',
            body: 'AGRON Premium gives you exact disease identification, treatment plans, and store product recommendations.',
            price: 'UGX 37,000/year (~$10)',
          },
          runId,
          timestamp: ts,
        });
      }
      const parsed = parseJSON(rawText);
      const runId = await logSkillRun({
        skill: skill.meta.name,
        userSub: body.userSub,
        country,
        isPremium: true,
        inputs: loggedInputs,
        outcome: summariseDiagnosis(parsed),
        rawOutput: rawText,
        success: true,
        latencyMs,
      });
      return NextResponse.json({
        status: 'success',
        skill: responseSkill,
        tier: 'premium',
        result: parsed,
        rawText: parsed ? undefined : rawText,
        meta: { userSub: body.userSub || 'anonymous', country, catalogFetched: !!catalog },
        runId,
        timestamp: ts,
      });
    }

    // plan-season → text output
    if (skill.meta.output === 'text') {
      const runId = await logSkillRun({
        skill: skill.meta.name,
        userSub: body.userSub,
        country,
        isPremium,
        inputs: loggedInputs,
        rawOutput: rawText,
        success: true,
        latencyMs,
      });
      return NextResponse.json({
        status: 'success',
        skill: responseSkill,
        crop: body.crop,
        recommendation: rawText,
        runId,
        timestamp: ts,
      });
    }

    // default — JSON output
    const parsed = parseJSON(rawText);
    const runId = await logSkillRun({
      skill: skill.meta.name,
      userSub: body.userSub,
      country,
      isPremium,
      inputs: loggedInputs,
      outcome: parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined,
      rawOutput: parsed ? undefined : rawText,
      success: true,
      latencyMs,
    });
    const payload: Record<string, unknown> = {
      status: 'success',
      skill: responseSkill,
      result: parsed,
      runId,
      timestamp: ts,
    };
    if (body.crop) payload.crop = body.crop;
    if (!parsed) payload.rawText = rawText;
    return NextResponse.json(payload);

  } catch (err: unknown) {
    console.error('[AGRON Agent]', err);
    await logSkillRun({
      skill: 'unknown',
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Agent failed',
    });
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Agent failed' },
      { status: 500 }
    );
  }
}

/** Extract just the identifiable fields from a diagnosis JSON for the log. */
function summariseDiagnosis(parsed: unknown): Record<string, unknown> | undefined {
  if (!parsed || typeof parsed !== 'object') return undefined;
  const p = parsed as Record<string, unknown>;
  return {
    cropType: p.cropType,
    diseaseType: p.diseaseType,
    healthStatus: p.healthStatus,
    severity: p.severity ?? p.severityLevel,
    confidence: p.confidence ?? p.confidenceScore,
    productCount: Array.isArray(p.products) ? p.products.length : undefined,
  };
}

export async function GET() {
  try {
    const skills = await listSkills();
    return NextResponse.json({ status: 'success', skills });
  } catch (err: unknown) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'failed' },
      { status: 500 }
    );
  }
}
