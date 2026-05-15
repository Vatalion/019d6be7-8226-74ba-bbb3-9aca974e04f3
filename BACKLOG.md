# Development Backlog

> **P2P Crypto Marketplace on ICP** — Decentralized, trustless, stablecoin-only.
> Last updated: 2026-04-12
> Payments: Stablecoins ONLY — USDT and USDC on TRC20 (Tron), BEP20 (BSC), ERC20 (Ethereum), SPL (Solana), Polygon, Avalanche — **no fiat, no ICP-native tokens**

---

## Status Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- `[-]` — Skipped / deferred

---

## Epic 1: Marketplace Core

### [1.1] Create Listing
**As a** seller, **I want** to create a listing with title, description, price, category, and accepted payment methods, **so that** buyers can find and purchase my goods.
**Acceptance Criteria:**
- [ ] Required fields: title (max 120 chars), description (max 2000 chars), price, currency, category, listing type (Physical/Digital), accepted payment methods (array of composite identifiers)
- [ ] At least one payment method required; all must be from the supported stablecoin list
- [ ] Image upload via object-storage extension; up to 5 image URLs stored in listing
- [ ] Listing status set to `Active` on creation; immediately searchable
- [ ] Inline validation feedback on all form fields
**ICP Skills:** `stable-memory`, `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [1.2] Search & Filter Listings
**As a** buyer, **I want** to search and filter listings, **so that** I can quickly find what I'm looking for.
**Acceptance Criteria:**
- [ ] Full-text search across `title` and `description` fields
- [ ] Filters: category, price range (min/max), listing type (Physical/Digital), accepted payment method
- [ ] Cursor-based pagination (20 results per page)
- [ ] URL state sync: filters persisted in URL query params
- [ ] "Reset all filters" button clears all active filters
- [ ] Results sorted by `createdAt` descending by default
**ICP Skills:** `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [1.3] Listing Detail Page
**As a** buyer, **I want** to view a listing's full details, **so that** I can decide whether to purchase.
**Acceptance Criteria:**
- [ ] Page shows: title, photos carousel, price + currency, accepted payment methods, description, seller reputation badge, Buy button
- [ ] Photos loaded from object-storage URLs
- [ ] Seller reputation badge links to seller profile
- [ ] Buy button disabled if user is the listing owner
- [ ] Breadcrumb navigation: Home → Listings → [Listing Title]
- [ ] `data-ocid` markers on Buy button and seller profile link
**ICP Skills:** `asset-canister`
**Priority:** P0
**Status:** [ ]

---

### [1.4] Edit Listing
**As a** seller, **I want** to edit my listing's fields after creation, **so that** I can correct mistakes or update pricing.
**Acceptance Criteria:**
- [ ] Canister method verifies caller is listing owner
- [ ] All fields editable except listing `id` and `createdAt`
- [ ] Optimistic UI update; rollback on error
- [ ] Validation errors shown inline per field
- [ ] Edit page accessible at `/listings/:id/edit`, protected route
**ICP Skills:** `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [1.5] Deactivate Listing
**As a** seller, **I want** to deactivate or delete my listing, **so that** I can remove goods I no longer want to sell.
**Acceptance Criteria:**
- [ ] `deactivateListing(id)` sets status to `Inactive`; immediately excluded from search
- [ ] Confirmation dialog shown before action
- [ ] Deactivated listings still accessible to their owner (with Inactive badge)
- [ ] Active trades on the listing are not automatically cancelled
- [ ] Canister verifies caller is listing owner before deactivation
**ICP Skills:** `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [1.6] Seller Profile Page
**As a** buyer, **I want** to view a seller's public profile, **so that** I can assess their trustworthiness before buying.
**Acceptance Criteria:**
- [ ] Public page at `/profile/:principal`
- [ ] Shows: username, avatar, buyer reputation score, seller reputation score, trust level badge, verification badge (if applicable), active listings grid
- [ ] No private data exposed (no principal shown to other users)
- [ ] Listings grid links to individual listing pages
- [ ] Empty state shown if seller has no active listings
**ICP Skills:** `internet-identity`
**Priority:** P1
**Status:** [ ]

---

### [1.7] Digital Goods Support
**As a** seller, **I want** to sell digital goods with automatic payload delivery after swap completion, **so that** buyers receive their purchase without manual intervention.
**Acceptance Criteria:**
- [ ] `Listing.digitalPayload` stored as encrypted blob in canister stable memory
- [ ] Payload unlocked automatically after swap status reaches `Completed`
- [ ] Manual fallback: seller can reveal payload via QR code or text code display
- [ ] Buyer can open dispute during configurable inspection period
- [ ] Dispute evidence log attached to digital goods trades
**ICP Skills:** `stable-memory`, `canister-security`
**Priority:** P2
**Status:** [ ]

---

### [1.8] Listing Expiry
**As a** seller, **I want** listings to expire automatically after a set period, **so that** stale listings don't clutter search results.
**Acceptance Criteria:**
- [ ] Listings have optional `expiresAt` timestamp
- [ ] Canister query filters out expired listings from search results
- [ ] Seller notified (via in-app message) 24h before expiry
- [ ] Seller can extend expiry from listing edit page
**ICP Skills:** `stable-memory`
**Priority:** P2
**Status:** [ ]

---

## Epic 2: Atomic Swap / HTLC Escrow

### [2.1] Initiate Swap
**As a** buyer, **I want** to initiate a trustless atomic swap, **so that** funds are locked in escrow and only released when I receive the goods.
**Acceptance Criteria:**
- [ ] `atomic_swap` canister: `initiateSwap(listingId, paymentMethod)` creates escrow record
- [ ] Escrow includes: `hashlock` (SHA-256 of secret), `timelock` (Unix timestamp), `buyerPrincipal`, `sellerPrincipal`, `amount`, `asset` (composite stablecoin identifier)
- [ ] Phase 1: escrow record created on-chain; actual stablecoin transfer confirmed manually by seller
- [ ] Returns `swapId` on success
- [ ] Listing status updated to `PendingSwap` to prevent double-purchase
- [ ] Swap state: `Pending`
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [2.2] Complete Swap (Secret Reveal)
**As a** buyer, **I want** to complete the swap by revealing the preimage, **so that** the seller receives funds after I've confirmed receipt.
**Acceptance Criteria:**
- [ ] `completeSwap(swapId, preimage)` verifies `sha256(preimage) == hashlock`
- [ ] On valid preimage: swap status → `Completed`; seller notified to release goods
- [ ] On invalid preimage: error returned, swap remains `Pending`
- [ ] Reputation scores updated for both buyer and seller after completion
- [ ] Listing status returned to `Active` if swap was the only pending trade (or set to `Sold`)
**ICP Skills:** `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [2.3] Refund on Timeout
**As a** buyer, **I want** to get a refund if the seller doesn't fulfill the order before the timelock expires, **so that** my funds are never permanently locked.
**Acceptance Criteria:**
- [ ] `refundSwap(swapId)` callable only after `timelock` timestamp has passed
- [ ] Swap status → `Refunded`; buyer notified to reclaim funds via their external wallet
- [ ] Refund rejected with `#TimelockNotExpired` if called too early
- [ ] Seller notified via messaging canister of refund
**ICP Skills:** `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [2.4] Cancel Swap
**As a** buyer or seller, **I want** to cancel a swap before funds are locked, **so that** both parties can back out of a trade before commitment.
**Acceptance Criteria:**
- [ ] `cancelSwap(swapId)` callable by either buyer or seller
- [ ] Cancel only allowed when swap is in `Pending` state (before escrow funding)
- [ ] After funds are locked, cancel redirects to refund flow (if timelock expired) or dispute
- [ ] Listing status restored to `Active` on cancel
- [ ] Swap status → `Cancelled`
**ICP Skills:** `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [2.5] Buy Flow Frontend
**As a** buyer, **I want** a clear step-by-step UI for initiating and completing a trade, **so that** I can execute a swap without confusion.
**Acceptance Criteria:**
- [ ] "Buy Now" button on listing detail opens swap flow modal/page
- [ ] Step 1: Payment method selection (stablecoin picker with asset/network chips)
- [ ] Step 2: Price display (converted via Price Oracle canister to USD equivalent)
- [ ] Step 3: Confirmation screen with trade summary
- [ ] Step 4: Swap initiated → swap ID shown, trade detail page opened
- [ ] HTLC secret delivery: auto-delivered to seller via messaging canister
- [ ] QR-code fallback for manual secret exchange
- [ ] `data-ocid` markers on each step CTA
**ICP Skills:** `canister-security`, `internet-identity`
**Priority:** P0
**Status:** [ ]

---

### [2.6] Trade Detail Page
**As a** user, **I want** to see the full status and history of a trade, **so that** I know exactly where it stands and what action to take next.
**Acceptance Criteria:**
- [ ] Page at `/trades/:swapId`
- [ ] Status timeline: Initiated → Funded → Completed / Refunded / Disputed / Cancelled
- [ ] Deadline warning banner shown T-1hr and T-24hr before timelock expiry
- [ ] Actionable buttons per state: Complete, Refund, Dispute, Cancel
- [ ] Embedded P2P chat thread for this trade
- [ ] Shipping tracking widget (if physical goods)
- [ ] Protected route: only buyer or seller can view
**ICP Skills:** `stable-memory`
**Priority:** P0
**Status:** [ ]

---

## Epic 3: Stablecoin Payments

### [3.1] Multi-Network Stablecoin Support
**As a** user, **I want** to pay and receive USDT and USDC across all major blockchain networks, **so that** I can use the wallet and network I already have without friction.
**Acceptance Criteria:**
- [ ] Supported payment methods: USDT on TRC20 (Tron), BEP20 (BSC), ERC20 (Ethereum), SPL (Solana), Polygon, Avalanche; USDC on the same six networks
- [ ] Each payment method stored as a composite identifier: `asset·network` (e.g. `USDT·TRC20`, `USDC·Solana`)
- [ ] Canister validates that all listing and trade payment methods are within the supported stablecoin list
- [ ] All amounts stored as `Nat` in canister, displayed with correct decimals per stablecoin (6 decimals for USDC, 6 for USDT)
- [ ] Unsupported or unknown asset·network combinations rejected with `#UnsupportedPaymentMethod`
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [3.2] Payment Method Selection UI
**As a** buyer, **I want** to select from all accepted stablecoins for a listing, **so that** I can pay with the network I prefer.
**Acceptance Criteria:**
- [ ] `TokenSelectionChips` component displays all accepted payment methods as chips
- [ ] Composite identifiers displayed with asset + network: "USDT · TRC20", "USDC · Solana", "USDT · Polygon"
- [ ] Selected method persisted in state and passed to swap initiation
- [ ] Unsupported methods greyed out (e.g., if buyer has no balance on that network)
**ICP Skills:** `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [3.3] Manual Payment Confirmation Flow (Phase 1)
**As a** seller, **I want** to manually confirm receipt of off-chain stablecoin payments, **so that** the escrow can be completed even before automated verification is available.
**Acceptance Criteria:**
- [ ] For off-chain stablecoins (USDT-TRC20, USDT-BEP20, USDC-SPL): seller manually confirms payment received
- [ ] `confirmPayment(swapId)` canister method updates swap state to `SellerConfirmed`
- [ ] Buyer sees "Awaiting Seller Confirmation" status with estimated wait time
- [ ] Seller sees "Confirm Payment Received" CTA with buyer's payment reference
- [ ] Confirmation is irreversible; triggers secret delivery to buyer
**ICP Skills:** `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [3.4] Automated Payment Verification via HTTPS Outcalls (Phase 2)
**As a** seller, **I want** payment from off-chain stablecoins to be verified automatically, **so that** trades complete faster without manual intervention.
**Acceptance Criteria:**
- [ ] `price_oracle` canister makes HTTPS outcalls to blockchain APIs (TronGrid for TRC20, BSCScan for BEP20, Solana RPC for SPL)
- [ ] `verifyPayment(txHash, expectedAmount, recipientAddress)` returns `#Verified` or `#Unverified`
- [ ] Transform function used for HTTPS outcall consensus
- [ ] Retry logic with exponential backoff on API errors
- [ ] API keys stored in canister stable vars, not in frontend code
- [ ] Verification result triggers automatic escrow progression
**ICP Skills:** `https-outcalls`, `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [3.5] Wallet Balance Display
**As a** user, **I want** to see my stablecoin balances per connected wallet network, **so that** I know if I have enough funds before initiating a trade.
**Acceptance Criteria:**
- [ ] Header shows balance for supported stablecoins (USDT, USDC) per connected wallet network when logged in
- [ ] Balance data sourced from the connected external wallet (TRC20, BEP20, ERC20, SPL, Polygon, Avalanche)
- [ ] Balance refreshes after every trade action
- [ ] Skeleton loading state shown during fetch
- [ ] Balances not shown to logged-out users
**ICP Skills:** `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [3.6] Transaction History
**As a** user, **I want** to see my trade and payment history, **so that** I can track all my past transactions.
**Acceptance Criteria:**
- [ ] `getMyTrades(principal)` canister query returns all trades for caller (buyer or seller)
- [ ] History page at `/trades` lists all trades with status, asset, amount, counterparty
- [ ] Paginated with cursor-based pagination (20 per page)
- [ ] Clickable rows link to `/trades/:swapId`
- [ ] Filter by status: All, Active, Completed, Refunded, Disputed
**ICP Skills:** `stable-memory`
**Priority:** P1
**Status:** [ ]

---

### [3.7] Price Oracle Integration
**As a** user, **I want** prices displayed in USD equivalent regardless of the token used, **so that** I can compare listings fairly.
**Acceptance Criteria:**
- [ ] `price_oracle` canister fetches exchange rates via HTTPS outcalls (e.g., CoinGecko API)
- [ ] Rates cached in canister with 5-minute TTL
- [ ] `getRate(asset)` returns `{ usdRate: Float; updatedAt: Int }`
- [ ] Frontend shows both native price and USD equivalent on listing cards
- [ ] Stale rate warning if `updatedAt` > 15 minutes ago
**ICP Skills:** `https-outcalls`, `stable-memory`
**Priority:** P1
**Status:** [ ]

---

## Epic 4: Shipping Integration

### [4.1] Shipping Abstraction Layer
**As a** user, **I want** a unified shipping experience across all carriers, **so that** I can compare options and choose the best one for my trade.
**Acceptance Criteria:**
- [ ] Unified shipping interface: `calculateCost`, `createWaybill`, `getTrackingStatus`, `searchCities`, `searchWarehouses`
- [ ] All 3 carriers exposed through a single `ShippingProviderSelector` UI component showing side-by-side cost estimates
- [ ] Unified types: `ShippingRate`, `ShippingStatus`, `TrackingEvent`, `Waybill`
**ICP Skills:** `https-outcalls`, `multi-canister`
**Priority:** P1
**Status:** [ ]

---

### [4.2] Nova Poshta Integration
**As a** seller, **I want** to calculate shipping costs and create waybills via Nova Poshta, **so that** I can offer reliable domestic shipping to buyers.
**Acceptance Criteria:**
- [ ] HTTPS outcalls to Nova Poshta API v2: `getCities`, `getWarehouses`, `getDocumentPrice`, `save` (create waybill)
- [ ] API key stored in canister stable var
- [ ] Transform function used for all HTTPS outcall responses (consensus requirement)
- [ ] Retry with exponential backoff on 5xx errors
- [ ] City/warehouse autocomplete UI component
- [ ] TTN (tracking number) returned on waybill creation and stored in trade record
**ICP Skills:** `https-outcalls`, `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [4.3] Ukrposhta Integration
**As a** seller, **I want** to use Ukrposhta as an alternative carrier, **so that** buyers in areas without Nova Poshta coverage can receive orders.
**Acceptance Criteria:**
- [ ] HTTPS outcalls to Ukrposhta REST API: address lookup, cost calculation, shipment creation, tracking
- [ ] Feature parity with Nova Poshta integration: cost calc, waybill, tracking
- [ ] Shared shipping interface implemented
**ICP Skills:** `https-outcalls`
**Priority:** P1
**Status:** [ ]

---

### [4.4] Meest Express Integration
**As a** seller, **I want** to use Meest Express for international or courier deliveries, **so that** I can serve buyers who need alternative shipping options.
**Acceptance Criteria:**
- [ ] HTTPS outcalls to Meest Express API: city/branch search, cost calculation, shipment creation, tracking
- [ ] Feature parity with Nova Poshta integration
- [ ] Shared shipping interface implemented
**ICP Skills:** `https-outcalls`
**Priority:** P2
**Status:** [ ]

---

### [4.5] Manual TTN Entry
**As a** seller, **I want** to enter a tracking number manually when auto-generation fails, **so that** buyers can still track their shipment.
**Acceptance Criteria:**
- [ ] `setManualTtn(swapId, ttn, carrier)` canister method
- [ ] Manual TTN entry UI with per-carrier format validation (NP: 14 digits, UP: alphanumeric)
- [ ] Caller must be the seller on that trade
- [ ] TTN stored in trade record and displayed in buyer's trade detail page
**ICP Skills:** `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [4.6] Shipment Tracking UI
**As a** buyer, **I want** to see real-time tracking status for my shipment, **so that** I know when my order will arrive.
**Acceptance Criteria:**
- [ ] Shipment tracking widget embedded in trade detail page
- [ ] Status auto-refreshed every 30s
- [ ] Status timeline: Registered → In Transit → Out for Delivery → Delivered
- [ ] Shows carrier name, estimated delivery date, last update timestamp
- [ ] Loading skeleton shown during initial fetch
**ICP Skills:** `https-outcalls`
**Priority:** P1
**Status:** [ ]

---

### [4.7] Shipping Cost Calculator in Listing Creation
**As a** seller, **I want** to calculate and display shipping costs during listing creation, **so that** buyers see accurate shipping fees.
**Acceptance Criteria:**
- [ ] Location picker for sender city/warehouse and recipient city
- [ ] Real-time cost calculation as user selects cities (debounced 500ms)
- [ ] All 3 carriers shown with side-by-side cost comparison
- [ ] Selected carrier and estimated cost stored in listing
**ICP Skills:** `https-outcalls`
**Priority:** P2
**Status:** [ ]

---

## Epic 5: Reputation & Disputes

### [5.1] Reputation System
**As a** user, **I want** to build a reputation score based on my trade history, **so that** other users can assess my trustworthiness.
**Acceptance Criteria:**
- [ ] Separate `buyerScore` and `sellerScore` stored per principal in canister
- [ ] Composite trust score = weighted average of buyer + seller scores
- [ ] Scores updated after every `Completed` or `Disputed` swap
- [ ] Score range: 0–100; new users start at 50
- [ ] Reputation badge component displays buyer/seller scores separately
- [ ] Trust level labels: New (0–30), Regular (31–60), Trusted (61–85), Verified (86–100)
**ICP Skills:** `multi-canister`, `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [5.2] Review Submission
**As a** user, **I want** to leave a review after a completed trade, **so that** other users benefit from my experience.
**Acceptance Criteria:**
- [ ] `submitReview(swapId, rating, comment)` callable once per swap per principal
- [ ] Rating: 1–5 stars; comment: max 500 chars
- [ ] Review linked to the reviewer's role in that trade (buyer/seller)
- [ ] Review displayed on reviewer's and reviewee's profile pages
- [ ] Duplicate review rejected with `#AlreadyReviewed`
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P1
**Status:** [ ]

---

### [5.3] Open Dispute (Manual Moderation)
**As a** buyer or seller, **I want** to open a dispute if a trade goes wrong, **so that** a moderator can intervene and resolve it fairly.
**Acceptance Criteria:**
- [ ] `openDispute(swapId, reason, evidenceUrls)` callable by buyer or seller
- [ ] Dispute assigned to moderator queue in `disputes` canister
- [ ] Evidence uploaded via object-storage extension; URLs stored in dispute record
- [ ] Swap status → `Disputed`; funds remain locked in escrow
- [ ] Status updates sent to both parties via messaging canister
**ICP Skills:** `multi-canister`, `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [5.4] Dispute Resolution
**As a** moderator, **I want** to resolve disputes by choosing a winner, **so that** locked funds are released appropriately.
**Acceptance Criteria:**
- [ ] `resolveDispute(disputeId, winner)` callable only by principals with moderator role
- [ ] `winner` is either `#Buyer` or `#Seller`
- [ ] On `#Buyer` win: funds returned to buyer; on `#Seller` win: funds released to seller
- [ ] Dispute status → `Resolved`; both parties notified via messaging
- [ ] Reputation scores updated based on dispute outcome
**ICP Skills:** `canister-security`, `multi-canister`
**Priority:** P0
**Status:** [ ]

---

### [5.5] Dispute Chat Thread
**As a** user in a dispute, **I want** a dedicated chat thread with the moderator, **so that** I can provide evidence and context.
**Acceptance Criteria:**
- [ ] Dispute record includes `chatThreadId` linked to messaging canister
- [ ] Both parties and moderator can send messages in the dispute thread
- [ ] Evidence upload (images, documents) via object-storage in dispute thread
- [ ] Thread visible in dispute detail page at `/disputes/:disputeId`
**ICP Skills:** `multi-canister`
**Priority:** P1
**Status:** [ ]

---

## Epic 6: Messaging

### [6.1] P2P Chat
**As a** user, **I want** to send messages to my trading counterpart, **so that** we can coordinate the trade details.
**Acceptance Criteria:**
- [ ] `messaging` canister: `sendMessage(threadId, text)` — authenticated caller only
- [ ] Messages stored in stable memory: `{ id, senderId, threadId, text, timestamp }`
- [ ] `getMessages(threadId, limit, cursor)` — paginated query
- [ ] Each trade automatically creates a message thread on swap initiation
- [ ] Access control: only trade participants can read/write to trade thread
**ICP Skills:** `stable-memory`, `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [6.2] Chat UI Component
**As a** user, **I want** a chat interface embedded in the trade detail page, **so that** I can communicate without leaving the trade context.
**Acceptance Criteria:**
- [ ] Chat component with message list and input field
- [ ] Messages polled every 3 seconds
- [ ] Unread message count badge on trade list and navigation
- [ ] Message pagination: "Load earlier messages" link at top
- [ ] Optimistic message send: message shown immediately, confirmed on canister response
- [ ] Timestamps shown in user's local timezone
**ICP Skills:** `asset-canister`
**Priority:** P0
**Status:** [ ]

---

### [6.3] Unread Message Count
**As a** user, **I want** to see how many unread messages I have, **so that** I don't miss important trade communications.
**Acceptance Criteria:**
- [ ] `getUnreadCount(principal)` canister query returns count of unread messages across all threads
- [ ] Badge displayed in header navigation and trade list
- [ ] Count resets when user views the thread
- [ ] Real-time updates: badge refreshes every 30 seconds
**ICP Skills:** `stable-memory`
**Priority:** P1
**Status:** [ ]

---

## Epic 7: Security & Compliance

### [7.1] Rate Limiting
**As a** canister, **I want** to limit the rate of calls per principal, **so that** the system is protected from spam and abuse.
**Acceptance Criteria:**
- [ ] Per-principal call counters stored in stable memory (resets on timer)
- [ ] Limits: `createListing` 1/60s, `sendMessage` 10/min, `initiateSwap` 3/hr
- [ ] Returns `#err(#RateLimited { retryAfter: Nat })` with seconds until next allowed call
- [ ] Rate limit state survives canister upgrades
- [ ] Frontend shows countdown timer on `#RateLimited` error
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [7.2] Input Validation (Canister-Side)
**As a** canister, **I want** to validate all input at the canister boundary, **so that** invalid data never enters the system state.
**Acceptance Criteria:**
- [ ] Title: 1–120 chars, no HTML tags, no null bytes
- [ ] Description: 1–2000 chars
- [ ] Price: positive `Nat`, non-zero
- [ ] Payment method: must be in allowed list of supported assets
- [ ] Crypto address: format validated per asset (EIP-55 for ETH, Base58 for BTC/SOL, TRON Base58 for TRC20)
- [ ] All validation errors returned as typed `#err` variants, not panics
**ICP Skills:** `canister-security`
**Priority:** P0
**Status:** [ ]

---

### [7.3] RBAC for Admin Functions
**As an** admin, **I want** role-based access control for moderator and admin functions, **so that** only authorized principals can perform sensitive actions.
**Acceptance Criteria:**
- [ ] `user_management` canister maintains a `roles: HashMap<Principal, Role>` in stable memory
- [ ] Roles: `User`, `Moderator`, `Admin`
- [ ] All `resolveDispute` calls verify `Moderator` or `Admin` role
- [ ] `grantRole` and `revokeRole` callable only by `Admin` principals
- [ ] Initial admin principal set in canister `init` args
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P0
**Status:** [ ]

---

### [7.4] Crypto Address Verification
**As a** user, **I want** wallet addresses validated before submitting payment, **so that** funds are never sent to an invalid address.
**Acceptance Criteria:**
- [ ] Level 1 (client-side): EIP-55 checksum for ETH/BEP20, Base58Check for BTC/SOL, TRON Base58 for TRC20
- [ ] Level 2 (canister): HTTPS outcall to RPC node to verify address exists on-chain
- [ ] Inline validation feedback in address input: valid ✓ / invalid ✗ / verifying…
- [ ] Level 2 check only triggered on blur, not per-keystroke
**ICP Skills:** `https-outcalls`, `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [7.5] GDPR & Privacy Data Handling
**As a** user, **I want** my personal data handled according to GDPR principles, **so that** my privacy is protected.
**Acceptance Criteria:**
- [ ] No PII stored beyond what's required for marketplace operation
- [ ] `deleteMyData(principal)` method in `user_management` canister (pseudonymizes profile)
- [ ] Data retention policy: completed trade records kept 2 years, then archived
- [ ] Privacy policy page in frontend at `/privacy`
**ICP Skills:** `canister-security`, `stable-memory`
**Priority:** P2
**Status:** [ ]

---

## Epic 8: Observability & Admin

### [8.1] Canister Error Logging
**As an** admin, **I want** structured error logs from all canisters, **so that** I can diagnose issues in production.
**Acceptance Criteria:**
- [ ] Shared error log module: stores level, canisterId, method, message, caller
- [ ] Error logs stored in ring buffer (last 1000 entries) in stable memory
- [ ] `getErrorLogs(since: Timestamp)` admin query method
- [ ] Log entries viewable in admin dashboard
**ICP Skills:** `stable-memory`, `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [8.2] Performance Metrics
**As an** admin, **I want** canister performance metrics exposed, **so that** I can monitor system health and identify bottlenecks.
**Acceptance Criteria:**
- [ ] Each canister exposes `getMetrics()` query: `{ requestCount, errorCount, cycleBalance, memoryUsed, lastUpdated }`
- [ ] Admin dashboard displays metrics with sparkline charts
- [ ] Alert thresholds: cycle balance < 1T → warning; < 500B → critical
**ICP Skills:** `stable-memory`, `canister-security`
**Priority:** P1
**Status:** [ ]

---

### [8.3] Admin Dashboard
**As an** admin, **I want** an admin panel showing system health and canister state, **so that** I can monitor the platform without command-line access.
**Acceptance Criteria:**
- [ ] Admin page at `/admin` — accessible only to principals with `Admin` role
- [ ] Shows: canister cycle balances, memory usage, recent error logs, pending disputes count, active trades count
- [ ] Cycle top-up CTA links to ICP NNS or relevant wallet
- [ ] Metrics auto-refresh every 60 seconds
- [ ] Dispute management: list open disputes, assign to moderator, view evidence
**ICP Skills:** `canister-security`, `multi-canister`
**Priority:** P1
**Status:** [ ]

---

### [8.4] Cycle Monitoring & Top-Up
**As an** admin, **I want** to be alerted when canister cycles are low, **so that** I can top them up before any canister stops responding.
**Acceptance Criteria:**
- [ ] `checkCycles()` query on each canister returns current cycle balance
- [ ] Dashboard shows warning when any canister < 1T cycles
- [ ] HTTPS outcall alert (webhook to admin channel) when balance drops below threshold
**ICP Skills:** `https-outcalls`, `canister-security`
**Priority:** P2
**Status:** [ ]

---

## Epic 9: UX & Accessibility

### [9.1] Navigation & Routing
**As a** user, **I want** consistent navigation with clear breadcrumbs and back-button behavior, **so that** I never get lost in the app.
**Acceptance Criteria:**
- [ ] Breadcrumb component on all inner pages (Listings → Category → Listing Title)
- [ ] Browser back button works correctly on all routes
- [ ] Create Listing accessible via floating action button (not buried in nav)
- [ ] No dead ends: every page offers a next action or way back
- [ ] 404 page with navigation back to home
**ICP Skills:** `asset-canister`
**Priority:** P1
**Status:** [ ]

---

### [9.2] Accessibility Baseline (WCAG AA)
**As a** user with disabilities, **I want** the app to be fully accessible, **so that** I can use all features with assistive technology.
**Acceptance Criteria:**
- [ ] All interactive elements keyboard-accessible (Tab, Enter, Space, Escape)
- [ ] Visible focus rings on all focusable elements (`:focus-visible`)
- [ ] ARIA labels on all icon-only buttons
- [ ] Color contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text
- [ ] `prefers-reduced-motion` media query respected for all animations
**ICP Skills:** `asset-canister`
**Priority:** P1
**Status:** [ ]

---

### [9.3] Loading States & Error Boundaries
**As a** user, **I want** clear loading indicators and friendly error messages, **so that** I always know what the app is doing.
**Acceptance Criteria:**
- [ ] Skeleton screens for all data-fetching components (shown after 300ms delay)
- [ ] Error boundary on each page-level route with fallback UI and retry button
- [ ] Empty states with illustration + headline + CTA for all list views
- [ ] Toast notifications auto-dismiss after 5 seconds
- [ ] Network error shown as banner with "Retry" button when canister unreachable
**ICP Skills:** `asset-canister`
**Priority:** P1
**Status:** [ ]

---

### [9.4] Form Validation Feedback
**As a** user, **I want** clear inline validation feedback on forms, **so that** I can correct mistakes before submitting.
**Acceptance Criteria:**
- [ ] Validation triggers on blur, not per-keystroke (except address format, which shows on paste)
- [ ] Error messages in accessible red with error icon; success state with green checkmark
- [ ] Consistent error format across all forms
- [ ] Submit button shows loading state and disables during submission
- [ ] Server-side errors from canister displayed inline next to relevant field
**ICP Skills:** `asset-canister`
**Priority:** P1
**Status:** [ ]

---

### [9.5] Localization (Ukrainian & English)
**As a** Ukrainian user, **I want** the app in Ukrainian, **so that** I can use it comfortably in my native language.
**Acceptance Criteria:**
- [ ] English as default locale; Ukrainian (`uk`) as alternative
- [ ] Language switcher component in header
- [ ] All user-facing strings externalized (no hardcoded copy in JSX)
- [ ] Browser language used to auto-detect preferred language on first visit
**ICP Skills:** `asset-canister`
**Priority:** P2
**Status:** [ ]

---

### [9.6] Responsive Design
**As a** mobile user, **I want** the app to work on my phone, **so that** I can browse and trade on the go.
**Acceptance Criteria:**
- [ ] All pages fully usable at 375px viewport width
- [ ] Navigation collapses to hamburger menu on mobile
- [ ] Touch targets ≥44px on mobile
- [ ] No horizontal overflow on any screen size
- [ ] Bottom navigation bar on mobile for primary actions
**ICP Skills:** `asset-canister`
**Priority:** P1
**Status:** [ ]

---

## Summary

| Epic | Stories | Priority P0 | Priority P1 | Priority P2 |
|------|---------|------------|------------|------------|
| 1: Marketplace Core | 8 | 3 | 3 | 2 |
| 2: Atomic Swap / HTLC Escrow | 6 | 4 | 1 | 1 |
| 3: Stablecoin Payments | 7 | 3 | 4 | 0 |
| 4: Shipping Integration | 7 | 0 | 5 | 2 |
| 5: Reputation & Disputes | 5 | 3 | 2 | 0 |
| 6: Messaging | 3 | 2 | 1 | 0 |
| 7: Security & Compliance | 5 | 3 | 1 | 1 |
| 8: Observability & Admin | 4 | 0 | 3 | 1 |
| 9: UX & Accessibility | 6 | 0 | 5 | 1 |
| **Total** | **51** | **18** | **25** | **8** |
