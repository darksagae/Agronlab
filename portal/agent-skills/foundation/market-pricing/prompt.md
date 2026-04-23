SKILL: MARKET_INSIGHT
Crops: {{cropsList}}
Country: {{country}}

Using the market prices in your context and agronomic knowledge, provide:
Return ONLY this JSON:
{
  "country": "{{country}}",
  "insights": [
    {
      "crop": "string",
      "currentPriceRange": "string",
      "trend": "rising|stable|falling",
      "bestSellSeason": "string",
      "demandOutlook": "string",
      "riskFactors": ["string"],
      "profitabilityRating": "high|medium|low",
      "tip": "one actionable tip"
    }
  ],
  "marketSummary": "2-sentence regional market overview",
  "pricePrediction90Days": "string"
}
