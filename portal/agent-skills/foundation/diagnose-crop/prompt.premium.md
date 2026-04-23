SKILL: DIAGNOSE_CROP
{{#cropHint}}Crop hint from farmer: {{cropHint}}
{{/cropHint}}
Analyze this plant image. Return ONLY this JSON (no markdown fences):
{
  "crop_type": "string",
  "plant_family": "string",
  "growth_stage": "string",
  "health_status": "healthy|diseased|stressed|unknown",
  "disease_type": "string or 'none'",
  "causal_agent": "string (fungus/bacteria/virus/pest/nutrient/other)",
  "severity_level": "none|mild|moderate|severe|critical",
  "confidence": 0.0,
  "symptoms": ["string"],
  "recommendations": ["string"],
  "products_to_use": [
    {
      "name": "exact product name from AGRON store",
      "purpose": "why this product",
      "dosage": "e.g. 50ml per 20L water",
      "timing": "e.g. spray every 7 days for 3 weeks",
      "priceEstimate": 0,
      "storeAvailable": true
    }
  ],
  "application_method": "string",
  "prevention": "string",
  "urgency": "immediate|this_week|this_season|none",
  "country": "{{country}}",
  "communityKbContribution": true
}
