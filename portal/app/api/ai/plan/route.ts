/**
 * AGRON AI Plan Agent
 *
 * Three task modes — all powered by Gemini 2.5 Flash with live store data:
 *
 *  recommendation — detailed 8-section seasonal plan for a specific crop
 *  rotation       — multi-crop rotation strategy with market economics
 *  budget         — line-item budget using real AGRON store prices + profit projection
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAISystemPrompt } from '@/lib/countryConfig';
import { getProductsForAgent, formatCatalogForAgent, getLiveStoreContext } from '@/lib/storeContext';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Regional market price estimates ─────────────────────────────────────────

const MARKET_PRICES: Record<string, Record<string, string>> = {
  UG: {
    maize:     'UGX 700–1,200/kg (farm gate)',
    beans:     'UGX 2,500–4,000/kg',
    soybeans:  'UGX 1,800–2,800/kg',
    sorghum:   'UGX 800–1,200/kg',
    cassava:   'UGX 300–600/kg',
    sweetpotato: 'UGX 500–900/kg',
    coffee:    'UGX 8,000–14,000/kg (arabica)',
    banana:    'UGX 500–1,500/bunch',
    tomato:    'UGX 1,500–4,000/kg (seasonal)',
    onion:     'UGX 1,200–2,500/kg',
    cabbage:   'UGX 800–2,000/head',
  },
  KE: {
    maize:     'KES 35–55/kg',
    beans:     'KES 90–150/kg',
    soybeans:  'KES 60–100/kg',
    coffee:    'KES 180–350/kg (clean)',
    tea:       'KES 18–35/kg (green leaf)',
  },
};

function getMarketContext(country: string): string {
  const prices = MARKET_PRICES[country] || MARKET_PRICES['UG'];
  const lines = ['=== TOOL OUTPUT: REGIONAL MARKET PRICES ==='];
  Object.entries(prices).forEach(([crop, price]) => {
    lines.push(`  • ${crop.charAt(0).toUpperCase() + crop.slice(1)}: ${price}`);
  });
  lines.push('=== END MARKET PRICES ===');
  return lines.join('\n');
}

// ─── Gemini call ─────────────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildAgentSystemPrompt(
  country: string,
  catalogBlock: string,
  marketBlock: string,
  userContext: string
): string {
  const base = buildAISystemPrompt(country, 'chat');
  return `${base}

You are operating as an AUTONOMOUS AGRICULTURAL PLANNING AGENT.
You have been pre-loaded with real-time data from three sources:

${userContext ? userContext + '\n' : ''}
${catalogBlock}

${marketBlock}

AGENT REASONING PROTOCOL:
Before generating your final answer, reason through these steps internally:
1. SITUATION — What is this farmer's specific context (crops, farm size, history, season)?
2. RESOURCES — What inputs are available in the AGRON store and at what exact prices?
3. ECONOMICS — What are the projected costs, revenues, and profit margins?
4. AGRONOMY — What does crop science say about the optimal approach?
5. RISKS — What could go wrong and how to mitigate it?
6. RECOMMENDATION — What is the clearest, most actionable plan?

Always reference specific product names and prices from the store inventory above.
Return only valid JSON — no markdown fences, no extra commentary.`;
}

// ─── Task: ROTATION ───────────────────────────────────────────────────────────

function rotationUserPrompt(crop: string, area: string, history: string): string {
  return `TASK: CROP ROTATION STRATEGY

Current/last crop: ${crop}
Farm area: ${area} acres
${history ? 'Crop and disease history:\n' + history : ''}

Generate a 3-crop rotation strategy. For each rotation crop give:
- Why this crop follows ${crop} (soil science + disease break)
- Estimated input cost using EXACT product names and prices from the store inventory
- Expected yield and revenue using market prices above
- Timing within the crop calendar

Return ONLY this JSON (no markdown):
{
  "currentCrop": "${crop}",
  "situationAnalysis": "2-3 sentence assessment of the farmer's current situation",
  "rotations": [
    {
      "order": 1,
      "crop": "string",
      "season": "string (e.g. short_rains_2026)",
      "months": "e.g. Aug–Nov",
      "agronomicReason": "why this crop follows ${crop}",
      "diseasesBroken": ["disease1", "disease2"],
      "soilBenefit": "what it does to the soil",
      "keyInputs": [
        { "product": "exact product name from store", "qty": "e.g. 4 kg/acre", "pricePerUnit": 45000, "totalEstimate": 90000 }
      ],
      "estimatedInputCostPerAcre": 0,
      "estimatedTotalInputCost": 0,
      "expectedYieldKgPerAcre": 0,
      "farmGatePrice": "e.g. UGX 2,800/kg",
      "expectedRevenueTotal": 0,
      "expectedProfitTotal": 0,
      "roi": 0
    }
  ],
  "threeYearStrategy": "one-sentence long-term rotation plan",
  "soilHealthOutlook": "what this rotation does for soil over 3 years",
  "marketOutlook": "price trend or demand note for these crops"
}`;
}

// ─── Task: BUDGET ─────────────────────────────────────────────────────────────

function budgetUserPrompt(crop: string, area: string, startDate: string, endDate: string, notes: string): string {
  return `TASK: DETAILED FARM BUDGET

Crop: ${crop}
Area: ${area} acres
Season: ${startDate} → ${endDate}
${notes ? 'Notes: ' + notes : ''}

Using the EXACT product names and prices from the AGRON store inventory above,
generate a complete line-item farm budget. For each input, choose the most suitable
product actually listed in the store.

Calculate:
- Input costs (seeds, fertilizers, fungicides, herbicides, other) — reference store prices
- Labor costs (land prep, planting, weeding, harvesting) — use local daily rates
- Total cost per acre AND total for the full farm
- Expected yield using realistic figures for this region and season
- Revenue using market prices from the market data above
- Net profit and ROI

Return ONLY this JSON:
{
  "summary": "one-line summary",
  "crop": "${crop}",
  "area": ${parseFloat(area) || 1},
  "season": "season label",
  "inputItems": [
    {
      "category": "Seeds|Fertilizers|Fungicides|Herbicides|Other",
      "product": "exact product name from store inventory",
      "specification": "e.g. 2 kg/acre × 2 acres = 4 kg total",
      "unitPrice": 0,
      "quantity": 0,
      "unit": "kg|litre|packet",
      "totalPrice": 0,
      "storeAvailable": true,
      "applicationTiming": "e.g. at planting, week 4"
    }
  ],
  "laborItems": [
    {
      "activity": "e.g. Land preparation",
      "personDays": 0,
      "dailyRate": 15000,
      "total": 0
    }
  ],
  "totalInputCost": 0,
  "totalLaborCost": 0,
  "grandTotalCost": 0,
  "costPerAcre": 0,
  "expectedYieldKgPerAcre": 0,
  "totalExpectedYieldKg": 0,
  "farmGatePricePerKg": 0,
  "expectedRevenue": 0,
  "expectedProfit": 0,
  "roi": 0,
  "breakEvenYieldKg": 0,
  "riskFactors": ["string"],
  "savingsNote": "any bulk-buy or store discount advice",
  "profitabilityVerdict": "PROFITABLE|MARGINAL|RISKY — one sentence explanation"
}`;
}

// ─── Task: RECOMMENDATION (existing, improved) ────────────────────────────────

function recommendationUserPrompt(crop: string, area: string, startDate: string, endDate: string, notes: string): string {
  return `TASK: DETAILED SEASONAL FARMING PLAN

Crop: ${crop}
Area: ${area} acres
Planting: ${startDate}
Harvest: ${endDate}
${notes ? 'Notes: ' + notes : ''}

Provide a practical 8-section plan. Reference specific product names and prices from the
store inventory. Write in plain language a smallholder farmer can act on immediately.

Return a well-structured plain-text response (NOT JSON) with clear section headers:
1. Soil Preparation
2. Planting Tips
3. Fertilizer Schedule (with specific store products and prices)
4. Irrigation & Water Management
5. Pest & Disease Watch
6. Key Growth Milestones
7. Harvest Indicators
8. Budget Summary (using store prices)`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'Gemini API key not configured' }, { status: 503 });
    }

    const body = await req.json();
    const {
      task = 'recommendation',
      crop,
      area = '1',
      startDate = '',
      endDate = '',
      notes = '',
      country = 'UG',
      userContext = '',
    } = body;

    if (!crop) {
      return NextResponse.json({ status: 'error', message: 'crop is required' }, { status: 400 });
    }

    // Fetch live store data and market context in parallel
    const [catalog, fallbackText] = await Promise.all([
      getProductsForAgent(),
      getLiveStoreContext(country === 'UG' ? 'UGX' : 'USD'),
    ]);

    const catalogBlock = catalog
      ? formatCatalogForAgent(catalog, country === 'UG' ? 'UGX' : 'USD')
      : `=== STORE INVENTORY ===\n${fallbackText}\n=== END ===`;

    const marketBlock = getMarketContext(country);

    const systemPrompt = buildAgentSystemPrompt(country, catalogBlock, marketBlock, userContext);

    let userPrompt: string;
    if (task === 'rotation') {
      userPrompt = rotationUserPrompt(crop, area, userContext);
    } else if (task === 'budget') {
      userPrompt = budgetUserPrompt(crop, area, startDate, endDate, notes);
    } else {
      userPrompt = recommendationUserPrompt(crop, area, startDate, endDate, notes);
    }

    const rawText = await callGemini(systemPrompt, userPrompt);

    // For rotation and budget tasks, parse JSON; for recommendation keep as text
    if (task === 'rotation' || task === 'budget') {
      try {
        const cleaned = rawText
          .replace(/```(?:json)?\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({
          status: 'success',
          task,
          crop,
          result: parsed,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // JSON parse failed — return as text so the app still shows something
        return NextResponse.json({
          status: 'success',
          task,
          crop,
          result: null,
          rawText,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // recommendation — plain text
    return NextResponse.json({
      status: 'success',
      task,
      crop,
      recommendation: rawText,
      timestamp: new Date().toISOString(),
    });

  } catch (err: unknown) {
    console.error('[AI plan agent]', err);
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Agent failed' },
      { status: 500 }
    );
  }
}
