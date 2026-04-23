---
name: weather-lookup
description: Fetch and interpret current seasonal outlook and rainfall forecast for a given country/region to adjust planting windows, irrigation plans, or harvest timing. Returns a structured advisory with planting-window recommendation. Load when the user asks about rain, drought, dry spell, best time to plant, or mentions that rains have been unusual.
inputs: country, crop
optionalInputs: region, month, userContext
output: json
premium: none
---

# Weather & Seasonal Outlook

## When to use
- Farmer asks "when should I plant?" or "is it a good time to plant now?"
- User mentions drought, delayed rains, or unusual weather.
- Plan-season needs to anchor its schedule to a reliable planting window.
- Diagnose-crop returns drought stress or root rot — weather context explains the pattern.

## Reasoning protocol
1. Determine the country's agro-climatic zone from `country` (and `region` if provided).
2. Identify the current or upcoming season: long rains (March–May for East Africa), short rains (Oct–Dec), dry season, etc.
3. From `month` (or today's date from context), assess whether planting is advisable now or in N weeks.
4. Give an irrigation advisory: is supplemental irrigation needed given the current outlook?
5. Flag any known El Niño / La Niña impacts on the region for this season.

## Regional reference (use as baseline; flag if user-reported conditions differ)
- **Uganda / Kenya / Tanzania / Rwanda**: bimodal — long rains (Mar–May), short rains (Oct–Dec).
- **Ethiopia / South Sudan**: single main season (Jun–Sep); erratic northeast corridor.
- **West Africa (Nigeria, Ghana, Senegal)**: single rainy season (May–Oct), Sahel drier May–Jul onset.
- **Southern Africa (Zambia, Malawi, Zimbabwe)**: single season (Nov–Apr), ENSO-sensitive.

## Output contract
Strict JSON, no markdown fences:
```json
{
  "country": "UG",
  "region": "Central Uganda",
  "currentSeason": "short rains",
  "seasonStatus": "ongoing",
  "plantingWindowAdvice": "Plant now — short rains are 3 weeks in, soil moisture is good for maize germination.",
  "irrigationAdvisory": "Supplemental irrigation not needed for first 3 weeks; monitor if rains stop before 6 weeks.",
  "ensoAlert": null,
  "recommendedPlantingStart": "2026-10-15",
  "recommendedPlantingEnd": "2026-11-10",
  "harvestEstimate": "2027-02-20",
  "warnings": []
}
```

## Data limitation note
AGRON does not yet integrate a live weather API. The model responds with agronomic knowledge of regional seasonal patterns. If the user's reported conditions differ sharply from the typical pattern, flag this in `warnings` and recommend the user verify with a local extension officer.

## Evolution hooks
- When a user later reports actual conditions via feedback, that datum improves per-country seasonal accuracy over time.
