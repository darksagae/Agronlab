---
name: budget-calculator
description: Produce a line-item farm budget for one crop over a specific season and acreage. Inputs and labor line items, cost per acre, expected yield and revenue, net profit, ROI, break-even, risks. Uses live store prices. Returns structured JSON.
inputs: crop, area, startDate, endDate, country
optionalInputs: notes, userContext
output: json
---

# Budget Calculator

## When to use
- Farmer opens the budget tab in AI Plan.
- Farmer asks "how much will X acres of Y cost me?"
- Always uses live store prices — do not use cached catalog.

## Reasoning protocol
1. From STORE INVENTORY, pick the most suitable product for each input category (seeds, fertilizers, fungicides, herbicides, other). Cite exact names and current prices.
2. Use realistic regional yield figures — reference the country and season in your context.
3. Use REGIONAL MARKET PRICES for revenue projection.
4. Labor: use local daily rates (defaults in prompt template). Estimate person-days by activity.
5. Compute net profit = revenue - (inputs + labor). ROI = net profit / (inputs + labor).
6. Break-even yield = total cost / price per kg.

## Output contract
Strict JSON matching the schema in `prompt.md`. No markdown fences. `product` in each inputItem must be a real product from the STORE INVENTORY block.
