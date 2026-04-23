SKILL: FARM_BUDGET
Crop: {{crop}} | Area: {{area}} acres | Season: {{startDate}} → {{endDate}}
{{#notes}}Notes: {{notes}}
{{/notes}}
Return ONLY this JSON:
{
  "summary": "string",
  "crop": "{{crop}}",
  "area": {{area}},
  "season": "string",
  "inputItems": [
    {
      "category": "Seeds|Fertilizers|Fungicides|Herbicides|Other",
      "product": "exact product from store",
      "specification": "e.g. 2kg/acre × 2 = 4kg",
      "unitPrice": 0,
      "quantity": 0,
      "unit": "kg|litre|packet",
      "totalPrice": 0,
      "storeAvailable": true,
      "applicationTiming": "string"
    }
  ],
  "laborItems": [
    { "activity": "string", "personDays": 0, "dailyRate": 15000, "total": 0 }
  ],
  "totalInputCost": 0,
  "totalLaborCost": 0,
  "grandTotalCost": 0,
  "costPerAcre": 0,
  "expectedYieldKgPerAcre": 0,
  "totalExpectedYieldKg": 0,
  "farmGatePricePerKg": 0,
  "expectedRevenue": 0,
  "expectedProfit": 0,
  "roi": 0,
  "breakEvenYieldKg": 0,
  "riskFactors": ["string"],
  "savingsNote": "string",
  "profitabilityVerdict": "PROFITABLE|MARGINAL|RISKY — reason"
}
