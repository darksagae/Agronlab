---
name: market-pricing
description: Analyze market conditions for one or more crops — current price range, trend, best sell season, demand outlook, risk factors, 90-day prediction. Country-aware. Returns structured JSON for market dashboards.
inputs: country
optionalInputs: crops, crop, userContext
output: json
---

# Market Pricing

## When to use
- User opens the market insights tab.
- After a plan or rotation is created, to advise when to sell.
- User asks "is X profitable to sell right now?"

## Reasoning protocol
1. From REGIONAL MARKET PRICES, read the current band for each requested crop.
2. Apply seasonal reasoning: prices peak at the end of the dry season, fall during harvest glut.
3. If user context shows active crop plans, prioritize those crops in the output.
4. For the 90-day prediction, state one directional call (rising/stable/falling) with one reason.
5. Profitability rating combines price trend and regional demand — high/medium/low.

## Output contract
Strict JSON matching the schema in `prompt.md`. `currentPriceRange` must quote the country's currency code.
