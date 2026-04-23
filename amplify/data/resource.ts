import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Generic JSON row for TanStack Query + SQLite sync bridge
  SyncedRecord: a
    .model({
      collection: a.string().required(),
      recordKey: a.string().required(),
      payload: a.string().required(),
      updatedAt: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // Legacy store listing (kept for backward compat). Image bytes live in S3 under store/listings/*.
  StoreListing: a
    .model({
      title: a.string().required(),
      description: a.string(),
      imageKeysJson: a.string().required(),
      priceLabel: a.string(),
      sellerSub: a.string(),
      createdAt: a.string(),
    })
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // Merchant profile — public key required for E2E encrypted chat
  MerchantProfile: a
    .model({
      displayName: a.string(),
      businessName: a.string(),
      role: a.enum(['BUYER', 'SELLER', 'BOTH']),
      publicKey: a.string(), // TweetNaCl X25519 public key, base64
      userSub: a.string(),   // Cognito sub — used to look up public keys by sub
      country: a.string(),   // ISO country code e.g. "UG", "KE", "TZ"
      // Seller approval workflow
      approvalStatus: a.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED']),
      sellerRequestJson: a.string(), // JSON blob of submitted seller request data
      approvalNote: a.string(),      // Admin note on approval/rejection
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  // P2P market listing — portal merchants post buy/sell offers
  MarketListing: a
    .model({
      title: a.string().required(),
      description: a.string(),
      category: a.string(),
      priceLabel: a.string(),
      unit: a.string(),
      imageKeysJson: a.string(), // JSON array of S3 keys under store/listings/*
      sellerSub: a.string().required(),
      sellerName: a.string(),
      status: a.enum(['ACTIVE', 'SOLD', 'PAUSED']),
      isInternational: a.boolean(), // true = visible to subscribers only
      country: a.string(),          // seller country code e.g. "UG", "KE", "TZ"
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  // User subscription — $10/year plan
  UserSubscription: a
    .model({
      userSub: a.string().required(), // Cognito sub
      planId: a.string().required(),  // e.g. "annual_10usd"
      status: a.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
      expiresAt: a.string().required(), // ISO date
      paymentRef: a.string(),           // Flutterwave tx_ref
      amountPaid: a.float(),
      currency: a.string(),             // "UGX" or "USD"
      network: a.string(),              // "MTN" | "AIRTEL"
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // Registered company store — shown as a round icon on the mobile store landing page.
  // Managed by the merchant via the web portal. AGRON is the built-in global store (not stored here).
  RegisteredStore: a
    .model({
      name: a.string().required(),
      logoKey: a.string(),        // S3 key under store/logos/*
      tagline: a.string(),
      status: a.enum(['ACTIVE', 'PENDING']),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // Product belonging to a registered company store.
  // Tapping the store icon in the mobile app shows these products.
  // AGRON (global) shows products from ALL stores merged with the SQLite catalog.
  StoreProduct: a
    .model({
      storeId: a.string().required(), // RegisteredStore.id
      name: a.string().required(),
      description: a.string(),
      category: a.string(),
      priceLabel: a.string(),         // display string e.g. "UGX 95,000"
      sellingPrice: a.float(),
      unit: a.string(),
      imageKeysJson: a.string(),      // JSON array of S3 keys under store/products/*
      inStock: a.boolean(),
      quantity: a.integer(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ── Crop Diagnosis Record ───────────────────────────────────────────────────
  // Every AI diagnosis (premium Gemini + community KB serves) is saved here.
  // Images live in S3 under diagnoses/<userSub>/<id>/photo.jpg
  // This table is the ground-truth training dataset for future AI improvements.
  //
  // Training readiness lifecycle:
  //   PENDING  → just saved, not reviewed
  //   VERIFIED → user confirmed the AI was correct (thumbs up)
  //   CORRECTED → user said it was wrong + provided correct label
  //   TRAINING_READY → reviewed and cleared for export to training set
  //   EXCLUDED → poor quality / duplicate — excluded from training
  DiagnosisRecord: a
    .model({
      // ── Who & when ──────────────────────────────────────────────────────────
      userSub: a.string().required(),     // Cognito sub of the user who scanned
      isPremium: a.boolean().required(),  // was this user a paid subscriber at scan time?
      scannedAt: a.string().required(),   // ISO timestamp

      // ── Location context ─────────────────────────────────────────────────────
      country: a.string(),               // "UG", "KE", "TZ", "RW" etc.
      region: a.string(),                // e.g. "Central", "Western Uganda"
      season: a.string(),                // "long_rains_2025", "short_rains_2025"

      // ── Image ───────────────────────────────────────────────────────────────
      imageS3Key: a.string().required(), // S3 key: diagnoses/<userSub>/<id>/photo.jpg
      imageThumbnailKey: a.string(),     // S3 key: diagnoses/<userSub>/<id>/thumb.jpg

      // ── AI diagnosis output ──────────────────────────────────────────────────
      cropType: a.string().required(),           // "maize", "tomato", "beans", "banana" etc.
      healthStatus: a.string().required(),       // "healthy" | "diseased" | "pest_damage" | "nutrient_deficiency"
      diseaseType: a.string().required(),        // "Maize Lethal Necrosis", "Late Blight", "none" etc.
      causalAgent: a.string(),                   // "fungus" | "bacteria" | "virus" | "pest" | "nutrient"
      severityLevel: a.string(),                 // "low" | "medium" | "high" | "critical"
      confidenceScore: a.float().required(),     // 0.0 – 1.0
      symptomsJson: a.string(),                  // JSON array of symptom strings
      recommendationsJson: a.string(),           // JSON array of recommendation strings
      productsJson: a.string(),                  // JSON array of recommended AGRON store product names
      applicationMethod: a.string(),             // how to apply treatment
      prevention: a.string(),                    // prevention tip
      urgency: a.string(),                       // "treat within 24h" | "treat within 1 week" | "monitor"

      // ── AI metadata ──────────────────────────────────────────────────────────
      aiSource: a.string().required(),           // "gemini_premium" | "community_kb" | "basic_free"
      aiModel: a.string(),                       // "gemini-2.5-flash" or future model name
      timesConfirmedInKb: a.integer(),           // how many users had the same diagnosis (from KB)

      // ── User feedback (for training quality) ────────────────────────────────
      userFeedback: a.enum(['PENDING', 'CORRECT', 'INCORRECT', 'PARTIAL']),
      userCorrectedDisease: a.string(),          // if INCORRECT, what was the actual disease
      userCorrectedCrop: a.string(),             // if crop was misidentified
      userNotes: a.string(),                     // free-text notes from the user

      // ── Training lifecycle ───────────────────────────────────────────────────
      trainingStatus: a.enum([
        'PENDING',        // just saved — not yet reviewed
        'VERIFIED',       // user confirmed correct
        'CORRECTED',      // user corrected the label — very valuable for training
        'TRAINING_READY', // cleared for export
        'EXCLUDED',       // poor quality / duplicate
      ]),
      reviewedBy: a.string(),   // admin userSub who reviewed this record
      reviewNote: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update']),    // user can see + update their own scans
      allow.authenticated().to(['read']),                 // other users can read (for KB building)
    ]),

  // ── User farm profile — personal farm details for personalized AI reasoning
  UserFarmProfile: a
    .model({
      userSub: a.string().required(),
      farmName: a.string(),
      country: a.string(),
      region: a.string(),
      farmSizeAcres: a.float(),
      primaryCropsJson: a.string(),   // JSON array: ["maize","beans","tomatoes"]
      farmingType: a.enum(['SUBSISTENCE', 'COMMERCIAL', 'MIXED']),
      soilType: a.string(),           // "loam", "clay", "sandy"
      irrigationType: a.string(),     // "rain-fed", "drip", "furrow"
      language: a.string(),           // preferred language code e.g. "en", "lg"
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // ── Crop season record — one row per planted crop per season
  CropSeason: a
    .model({
      userSub: a.string().required(),
      cropType: a.string().required(),    // "maize", "beans", "tomatoes"
      variety: a.string(),               // "longe5", "kenya flat white"
      areaAcres: a.float(),
      plantedAt: a.string(),             // ISO date
      harvestedAt: a.string(),           // ISO date (null if still active)
      expectedYieldKg: a.float(),
      actualYieldKg: a.float(),
      notes: a.string(),
      diseaseCount: a.integer(),         // how many disease scans this season
      status: a.enum(['ACTIVE', 'HARVESTED', 'FAILED']),
      season: a.string(),               // "long_rains_2026", "short_rains_2025"
      budgetUgx: a.float(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // ── Agent skill run log ─────────────────────────────────────────────────────
  // Every AGRON agent skill invocation (diagnose, plan, advise, place-order, …)
  // is logged here for two purposes:
  //   1) Per-user evolution — the nightly job reads a user's recent runs and
  //      derives personalised skill overrides under agent-skills/users/<sub>/.
  //   2) Foundation evolution — aggregated learnings across users feed back
  //      into the foundation skill prompts via the cross-account MCP server.
  //
  // Writes are made by the portal server route using API key auth (the route
  // has no per-request user context). Users can read their own history via
  // owner auth for transparency / "why did the agent do X" debugging.
  AgentSkillRun: a
    .model({
      userSub: a.string(),              // Cognito sub; nullable for anonymous runs
      skill: a.string().required(),     // skill folder name, e.g. "diagnose-crop"
      country: a.string(),
      isPremium: a.boolean(),
      inputsJson: a.string(),           // JSON of non-image inputs
      outcomeJson: a.string(),          // JSON of key fields extracted from output
      rawOutput: a.string(),            // raw LLM/text output for replay + training
      success: a.boolean().required(),
      errorMessage: a.string(),
      latencyMs: a.integer(),
      feedback: a.enum(['PENDING', 'POSITIVE', 'NEGATIVE']),
      feedbackNote: a.string(),
      createdAt: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create', 'read', 'update']),
      allow.owner().to(['read', 'update']),
      allow.authenticated().to(['read']),
    ]),

  // ── Encrypted merchant-to-merchant message (TweetNaCl box)
  // chatId = sorted([fromSub, toSub]).join('_')
  ChatMessage: a
    .model({
      chatId: a.string().required(),
      fromSub: a.string().required(),
      toSub: a.string().required(),
      ciphertext: a.string().required(), // nacl.box output, base64; encrypted to recipient
      nonce: a.string().required(),      // base64; nonce for recipient ciphertext
      selfCiphertext: a.string(),        // nacl.box output encrypted to sender (self-copy)
      selfNonce: a.string(),             // nonce for self-copy
      readAt: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']), // recipients can read; plaintext is never stored — only ciphertext
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // API key is used by the portal /api/ai/agent route to log skill runs
    // from server-side (no user JWT available inside the fetch handler).
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});
