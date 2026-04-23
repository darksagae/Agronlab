---
name: product-search
description: Rank AGRON store products by relevance to a disease, pest, or farmer query. Country-aware. Returns a scored list with dosage and application method. Used by disease detection to populate the "recommended products" cards.
inputs: country
optionalInputs: query, diseaseType, crop, userContext
output: json
---

# Product Search

## When to use
- After diagnose-crop returns a disease — this skill converts "disease name" → "ranked list of store products that actually treat it".
- User searches the store with a free-text query.
- Do NOT use for general browsing (use the store-backend directly).

## Reasoning protocol
1. Filter STORE INVENTORY to the product categories that treat the causal agent type:
   - fungus → Fungicides
   - insect/pest → Pesticides / Insecticides
   - nutrient → Fertilizers
   - weeds → Herbicides
2. Score by: (a) active ingredient match against the disease, (b) in-stock status, (c) country availability.
3. Provide dosage in metric units (ml/L or kg/acre).
4. Return up to 6 products — only real products that appear in STORE INVENTORY.

## Output contract
Strict JSON matching the schema in `prompt.md`. `name` must match the exact store product name for the mobile app to look it up by name afterwards.
