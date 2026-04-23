---
name: diagnose-crop
description: Identify crop disease or health status from a plant photo. Returns symptoms, causal agent, severity, treatment plan, and matching AGRON store products with dosages. Tier-aware — free users get a 2-sentence preview, premium users get the full structured JSON.
inputs: image, country
optionalInputs: mimeType, cropHint, userContext
output: tiered
needsImage: true
premium: tiered
---

# Diagnose Crop

## When to use
- A user uploads a plant photo in AI Care or anywhere image input is available.
- The user describes a crop problem and attaches an image.
- Do NOT use when the user just asks a text question — route to the chat skill instead.

## Reasoning protocol
1. Identify the crop from leaf shape, fruit, growth habit.
2. Compare symptoms against the regional disease list pre-loaded in your context.
3. Match the causal agent (fungus / bacteria / virus / pest / nutrient / other).
4. From the STORE INVENTORY tool output, pick up to 3 products that treat this specific agent in this country. Cite exact product names and prices. Never invent products.
5. Give severity and urgency so the farmer knows how fast to act.

## Tier behavior
- **Free tier (`subscription !== 'premium'`)**: return the `prompt.free.md` output — a 2-sentence plain-text preview plus an upgrade nudge. No product recommendations.
- **Premium tier**: return the full JSON defined in `prompt.premium.md`.

## Output contract (premium)
Strict JSON, no markdown fences, no commentary. Keys exactly as specified in the prompt template. `products_to_use` must reference products that actually appear in the STORE INVENTORY block. Set `storeAvailable: false` only when no matching product exists.

## Evolution hooks
- Every successful diagnosis is logged to `AgentSkillRun` with crop, disease, country, products chosen, and (later) farmer feedback.
- When a pattern repeats across many users in the same country (e.g. "Cassava Brown Streak in UG treated with Ridomil Gold works 80% of the time"), the aggregate becomes a per-country override that future runs reference before the generic prompt.
