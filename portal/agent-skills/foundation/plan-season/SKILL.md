---
name: plan-season
description: Produce an 8-section seasonal farming plan for one crop on a specific acreage and planting window. Plain-text markdown output with headers — use when a farmer asks "what should I do this season" or sets up a new crop plan.
inputs: crop, area, startDate, endDate, country
optionalInputs: notes, userContext
output: text
---

# Seasonal Plan

## When to use
- User creates or edits a crop plan in AI Plan.
- User asks "how should I farm X this season" with a planting/harvest window.
- Not for rotation strategy (use `rotation-strategy`) and not for cost projection only (use `budget-calculator`).

## Reasoning protocol
1. From the USER FARM CONTEXT block, read location and soil type if present and adapt the plan.
2. From the STORE INVENTORY block, pick specific fertilizers, fungicides, and seed products — cite exact names and current prices.
3. Anchor the schedule to the planting and harvest dates provided.
4. Reference the regional pest and disease list from the pre-loaded context for the Pest & Disease Watch section.

## Output contract
Plain-text markdown (NOT JSON). Use numbered section headers exactly:
1. Soil Preparation
2. Planting Tips
3. Fertilizer Schedule (list specific store products + prices)
4. Irrigation & Water Management
5. Pest & Disease Watch
6. Key Growth Milestones
7. Harvest Indicators
8. Budget Summary (using store prices)

## Evolution hooks
- Each plan with positive farmer feedback strengthens the crop-specific fertilizer/product choices for that country.
- Repeated failures for a crop in a region downgrade the product's weight in future prompts.
