---
name: rotation-strategy
description: Design a 3-crop rotation strategy after the farmer's current/last crop. Breaks disease cycles, improves soil, projects economics using live store prices and regional market data. Returns structured JSON.
inputs: crop, area, country
optionalInputs: history, userContext
output: json
---

# Rotation Strategy

## When to use
- Farmer asks what to plant next after finishing a crop.
- AI Plan rotation tab is opened.
- A recurring disease appears in the diagnosis history — rotation can break the cycle.

## Reasoning protocol
1. From the USER FARM CONTEXT, prefer `recentDiagnoses` — rotation must specifically break observed diseases.
2. For each of the three rotation slots, pick a crop from a different family than `{{crop}}`.
3. Use regional disease data to confirm the rotation actually breaks the cycle.
4. Estimate inputs from STORE INVENTORY (exact product, qty per acre, price), yield from agronomic norms, revenue from REGIONAL MARKET PRICES.
5. Output ROI = (revenue - input cost) / input cost.

## Output contract
Strict JSON matching the schema in `prompt.md`. No markdown fences, no extra commentary. `keyInputs` must reference products that appear in the STORE INVENTORY block.
