---
name: place-order
description: Commit an order for AGRON store products. Two-phase — prepare returns a priced summary and a confirmation token; a second call with that token actually writes the order and decrements inventory. Use after diagnose-crop or plan-season recommends products and the user taps "Order these".
inputs: items, country
optionalInputs: userSub, shippingAddress, notes, confirmToken, currency
output: json
premium: none
requires_confirmation: true
---

# Place Order

## When to use
- A farmer approves a set of recommended products from AI Care or AI Plan and wants to commit the order.
- The agent must NEVER charge or decrement stock in a single round trip — always split into prepare + confirm.

## Two-phase flow

### Phase 1 — prepare (no `confirmToken` in request)
1. Validate every item against the live STORE INVENTORY block (product exists, quantity ≤ stock).
2. Compute line totals and subtotal from current `sellingPrice`.
3. Stash a `PendingAction` in the portal's in-memory token store with a 5-minute TTL.
4. Return `{ pendingAction, confirmToken, expiresAt, summary }`. The UI is expected to show a confirmation sheet.

### Phase 2 — confirm (request includes `confirmToken`)
1. Look up the token. If missing or expired → `410 Gone` with a clear error.
2. Forward the stashed items to store-backend `POST /api/orders` — that's the single source of truth for stock decrement and order persistence.
3. Delete the token (single-use).
4. Return the committed `{ order }` record.

## Execution
This is a **deterministic skill** — no Gemini call. The dispatcher handles it inline:
the `prompt.md` file is informational only (shown in skill discovery) and is not sent to the LLM.

## Output contract

Prepare response:
```json
{
  "status": "success",
  "skill": "place-order",
  "phase": "prepare",
  "pendingAction": {
    "type": "order",
    "items": [{ "productId": 42, "productName": "...", "quantity": 2, "unitPrice": 45000, "lineTotal": 90000, "inStock": true }],
    "subtotal": 107000,
    "currency": "UGX",
    "warnings": []
  },
  "confirmToken": "conf_...",
  "expiresAt": "2026-...",
  "summary": "2 items, total UGX 107,000"
}
```

Confirm response:
```json
{
  "status": "success",
  "skill": "place-order",
  "phase": "committed",
  "order": { "id": 17, "orderNumber": "AGR-...", "total": 107000, "items": [...] }
}
```

## Error cases
- `400` — items array empty or malformed.
- `409` — at confirm time, stock changed and is no longer sufficient (propagated from store-backend).
- `410` — confirm token expired or already used.

## Evolution hooks
- Each successful order logs which recommending skill sourced each item (e.g. "diagnose-crop → Ridomil Gold × 1"). That attribution drives the relevance weights used by `product-search` in future runs.
