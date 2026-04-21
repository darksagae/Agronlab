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

  // Encrypted merchant-to-merchant message (TweetNaCl box)
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
  },
});
