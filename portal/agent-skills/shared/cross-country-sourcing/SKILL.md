---
name: cross-country-sourcing
description: Find agricultural inputs (seeds, fertilizers, pesticides) available in neighboring countries when the farmer's local AGRON store is out of stock. Returns a sourcing plan with border crossing points, import duty estimates, and cost comparison. Premium-only skill — load when a product is unavailable locally and the user asks where else they can get it.
inputs: product, country
optionalInputs: quantity, targetCrop, userContext
output: json
premium: required
---

# Cross-Country Sourcing

## When to use
- A product returned by diagnose-crop or plan-season shows `storeAvailable: false`.
- Farmer explicitly asks "where else can I buy X?" or "can I get this from Kenya/Uganda?"
- Place-order fails availability check and the user wants alternatives.
- **Requires premium subscription** — gate this in the dispatcher.

## Reasoning protocol
1. Identify the target product category (fungicide / seed / fertilizer / pesticide / equipment).
2. List neighboring countries where the active ingredient or equivalent product is commonly available:
   - East Africa: UG ↔ KE ↔ TZ ↔ RW are tightly integrated; most agro-inputs cross borders freely.
   - West Africa: ECOWAS free movement simplifies sourcing between NG/GH/CI/SN.
   - Southern Africa: COMESA zone allows most agro-imports.
3. Estimate import duty: most COMESA/EAC countries levy 0–10% on raw ag-inputs; give a range.
4. Recommend a specific border crossing or trading hub (Malaba UG/KE, Namanga KE/TZ, Rusumo RW/TZ, etc.).
5. Flag phytosanitary certificate requirements if applicable (seeds always require one).

## Output contract
Strict JSON, no markdown fences:
```json
{
  "requestedProduct": "Ridomil Gold 68 WG",
  "activeIngredient": "Metalaxyl-M + Mancozeb",
  "localAvailability": false,
  "alternatives": [
    {
      "country": "KE",
      "countryName": "Kenya",
      "equivalentProduct": "Ridomil Gold MZ 68 WG",
      "estimatedPrice": "KES 1,800–2,400 / 100g",
      "borderCrossing": "Malaba (UG/KE)",
      "importDutyPct": 5,
      "phytosanitaryCertRequired": false,
      "notes": "Widely available at Nakuru and Eldoret agrovets."
    }
  ],
  "sourcingRecommendation": "Cross to Malaba (UG/KE) — Ridomil equivalent widely available in Eldoret at roughly KES 2,000/100g (~UGX 56,000 at current rate).",
  "warnings": ["Always verify registration status of imported products with your national pesticide authority."]
}
```

## Compliance note
AGRON does not facilitate illegal imports. The model only describes legal cross-border trade within existing regional trade frameworks. Always include the standard warning about national registration requirements.

## Evolution hooks
- Successful sourcing stories (user bought from KE, confirmed it worked) are logged and weight the Kenya alternative higher for future UG users.
