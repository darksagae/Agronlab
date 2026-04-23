SKILL: PRODUCT_SEARCH
Query: {{query}}
{{#diseaseType}}Disease: {{diseaseType}}
{{/diseaseType}}{{#crop}}Crop: {{crop}}
{{/crop}}
From the AGRON store inventory above, find the most relevant products.
Return ONLY this JSON:
{
  "query": "{{query}}",
  "results": [
    {
      "name": "exact product name from store",
      "category": "Fungicides|Herbicides|Seeds|Fertilizers|Other",
      "price": 0,
      "stock": 0,
      "relevanceScore": 0.0,
      "whyRecommended": "one sentence",
      "dosage": "e.g. 50ml/20L",
      "applicationMethod": "spray|drench|broadcast|drip"
    }
  ],
  "totalFound": 0,
  "note": "any important tip"
}
