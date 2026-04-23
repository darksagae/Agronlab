---
name: soil-analysis
description: Interpret a farmer's soil description or pH reading to recommend amendments, lime/gypsum rates, and fertilizer pre-treatments before planting. Returns a JSON prescription keyed to the target crop and country. Load this skill when the user mentions soil pH, acidity, compaction, waterlogging, or asks "what should I do to my soil before planting".
inputs: crop, country
optionalInputs: soilType, phReading, soilDescription, area, userContext
output: json
premium: none
---

# Soil Analysis

## When to use
- Farmer mentions soil pH, acidity, "my soil is hard", waterlogging, or salinity.
- User asks "what fertilizer base should I apply before planting X".
- Diagnose-crop or plan-season returns a nutrient-deficiency result — soil-analysis gives the corrective prescription.

## Reasoning protocol
1. From `soilType` or `soilDescription`, classify: clay / loam / sandy / peaty / saline / waterlogged.
2. From `phReading` (if provided), determine: acidic (<6.0), optimal (6.0–7.0), alkaline (>7.0).
3. Cross with target `crop` requirements — maize prefers pH 5.8–6.8; beans 6.0–7.0; cassava tolerates 4.5–6.5; etc.
4. Pick specific amendments from STORE INVENTORY that treat the identified deficiency: lime (acid soils), gypsum (sodic/saline), bone meal, DAP, etc. Cite exact product name and application rate per acre.
5. Give a before/during/after-planting timeline.

## Output contract
Strict JSON, no markdown fences:
```json
{
  "soilClass": "clay-loam",
  "phStatus": "acidic",
  "targetPhForCrop": "6.0–6.5",
  "amendments": [
    {
      "product": "Agricultural Lime",
      "storeProductId": null,
      "ratePerAcre": "250 kg",
      "timing": "4–6 weeks before planting",
      "purpose": "Raise pH from 5.2 to 6.2"
    }
  ],
  "baseFertilizer": {
    "product": "DAP 18-46-0",
    "storeProductId": 12,
    "ratePerAcre": "50 kg",
    "timing": "At planting, banded 5 cm below seed"
  },
  "warnings": [],
  "summary": "Your clay-loam soil is moderately acidic. Apply lime 4 weeks before planting then DAP at planting."
}
```

If no matching store product exists for an amendment, set `storeProductId: null` and suggest the generic amendment name.

## Evolution hooks
- When a user follows the prescription and later logs a positive outcome (via plan-season or diagnosis), the amendment rates for that soil class × crop × country are reinforced.
- Repeated negative feedback (crop still failed after amendment) is flagged for agronomist review in the foundation skill update cycle.
