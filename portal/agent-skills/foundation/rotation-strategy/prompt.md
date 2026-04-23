SKILL: CROP_ROTATION
Current/last crop: {{crop}}
Farm area: {{area}} acres
{{#history}}History: {{history}}
{{/history}}
Return ONLY this JSON:
{
  "currentCrop": "{{crop}}",
  "situationAnalysis": "2-3 sentences",
  "rotations": [
    {
      "order": 1,
      "crop": "string",
      "season": "string",
      "months": "e.g. Mar–Jun",
      "agronomicReason": "why after {{crop}}",
      "diseasesBroken": ["string"],
      "soilBenefit": "string",
      "keyInputs": [
        { "product": "exact product name", "qty": "string", "pricePerUnit": 0, "totalEstimate": 0 }
      ],
      "estimatedInputCostPerAcre": 0,
      "estimatedTotalInputCost": 0,
      "expectedYieldKgPerAcre": 0,
      "farmGatePrice": "string",
      "expectedRevenueTotal": 0,
      "expectedProfitTotal": 0,
      "roi": 0
    }
  ],
  "threeYearStrategy": "string",
  "soilHealthOutlook": "string",
  "marketOutlook": "string"
}
