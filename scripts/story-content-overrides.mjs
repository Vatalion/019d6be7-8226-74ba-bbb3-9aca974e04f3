/**
 * Hand-crafted BMAD sections — cryptomarket-p2p only.
 */
export const OVERRIDES = {
	"E1.S4": {
		story:
			"As a moderator, I want to ban or suspend principals so abusive users cannot continue mutating platform state.",
		acceptance: [
			"Given a banned principal, when they attempt mutating actions, then operations fail.",
			"Given admin, when I ban a user, then action is audit-logged.",
		],
		bdd: `- **Scenario: Banned user blocked**
  - Given principal is banned in \`Admin.mo\`
  - When they call \`createListing\` or \`initiateTrade\`
  - Then result is unauthorized or banned error

- **Scenario: Admin ban with audit**
  - Given admin principal
  - When admin bans a user principal
  - Then ban persists and audit log records the action`,
		tasks: `- [x] **Backend:** \`Admin.mo\` ban/suspend checks on sensitive update paths.
  - [x] **Backend:** \`admin-api.mo\` ban endpoints + audit log integration.
  - [x] **Frontend:** \`AdminPage.tsx\` ban/suspend actions.
  - [x] **Testing:** \`test/Admin.test.mo\`.`,
	},
	"E3.S1": {
		story:
			"As a buyer, I want to start a trade from a listing through a clear guided flow (price, token, deadlines) so the platform records the transaction without on-chain custody in Phase 1.",
		acceptance: [
			"Given I view an active listing while authenticated, when I click Buy / start trade, then `initiateTrade` creates a trade and navigates to trade detail.",
			"Given the listing price is set, when I proceed, then I see amount and approved stablecoin network (USDT/USDC on 4 networks).",
			"Given trade is created, when I land on trade detail, then timeline shows manual payment steps (buyer sent → seller received) and chat entry.",
			"Given inactive listing or unauthenticated buyer, when I attempt trade start, then operation fails with clear error and no trade row is created.",
		],
		bdd: `- **Scenario: Successful trade initiation**
  - Given I am authenticated with Internet Identity
  - And the listing status is active
  - When I confirm Buy on listing detail
  - Then the backend calls \`initiateTrade\` with listing id and buyer principal
  - And I am routed to \`/trades/{id}\` with pending payment state
  - And per-trade chat is available

- **Scenario: Price and token display**
  - Given the listing has price and \`priceToken\`
  - When trade detail loads
  - Then the UI shows crypto amount and network consistent with listing

- **Scenario: Blocked initiation**
  - Given the listing is inactive OR I am not signed in
  - When I attempt to start a trade
  - Then no trade is created and the UI shows sign-in or unavailable state`,
		tasks: `- [x] **Frontend:** \`ListingDetailPage.tsx\` Buy CTA → \`initiateTrade\`; navigate to \`TradeDetailPage.tsx\`.
  - [x] **Frontend:** Trade timeline Phase 1 steps; link to \`/how-payments-work\`.
  - [x] **Backend:** \`escrow-api.mo\` \`initiateTrade\` validates listing active, buyer ≠ seller, reputation gates.
  - [x] **Backend:** Persist \`Trade\` with deadlines per \`Escrow.mo\`.
  - [x] **Security:** CallerGuard + rate limits on initiate path.
  - [x] **i18n:** uk/en strings for buy and trade states.
  - [x] **Testing:** \`test/Escrow.test.mo\`; flow \`listing-buy-signin-guard\`.`,
	},
	"E9.S1": {
		story:
			"As architects, we want an approved ICRC-first escrow design so Phase 3 can lock and release funds on-chain while Phase 1 manual settlement remains unchanged.",
		acceptance: [
			"Given Phase 1 is live, when design is reviewed, then document states ICRC-2 lock/release as the on-chain path.",
			"Given design approved, when implementation starts, then failure modes cover dispute freeze, partial release, and ledger errors.",
			"Given UX rules in ONCHAIN-SETTLEMENT-DESIGN.md, when copy is written, then Phase 1 paths describe manual off-chain payment only.",
		],
		bdd: `- **Scenario: Design covers ckUSDC/ckUSDT path**
  - Given \`initiateOnChainTrade\` exists in \`escrow-api.mo\`
  - When architect documents Phase 3 flow
  - Then steps include approve → lock → deliver → release/refund

- **Scenario: Phase 1 unchanged**
  - Given manual \`initiateTrade\` for Wave 1 TRC20/BEP20
  - When design is published
  - Then \`Trade\` type for Phase 1 stays manual-payment fields only`,
		tasks: `- [ ] **Architecture:** Update \`docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md\` and \`architecture.md\` Phase 3 section.
- [ ] **Architecture:** ADR for ICRC escrow scope and Gate C.
- [ ] **Security:** Threat model for canister-held funds.
- [ ] **Product:** Gate C beta caps and allowed tokens for on-chain escrow CTA.
- [ ] **Review:** Owner sign-off before on-chain escrow marketing.`,
	},
	"E9.S2": {
		story:
			"As a buyer, I want ckUSDC/ckUSDT locked in protocol escrow only after the seller confirms within 24h — not at trade start.",
		acceptance: [
			"Given fresh deploy, when getPlatformFlags(), then trustlessEscrowEnabled is false.",
			"Given Gate C false, when initiateOnChainTrade called, then rejected before ledger call.",
			"Given handshake pending, when on-chain lock attempted, then rejected.",
			"Given ICRC lock fails after handshake, when error returned, then rollback to payment_intent — not ghost funded.",
			"Given concurrent initiateOnChainTrade, when interleaved, then no unsafe nextTradeId rollback.",
		],
		bdd: `- **Scenario: Gate C default disabled**
  - Given fresh deploy
  - When platform flags are queried
  - Then trustlessEscrowEnabled is false

- **Scenario: No lock before handshake**
  - Given seller has not confirmed the trade
  - When lock attempted
  - Then the call is rejected before ledger transfer

- **Scenario: Ledger failure rollback**
  - Given seller-confirmed PaymentIntent on ck path
  - When ICRC transfer_from fails
  - Then trade returns to payment_intent and is not funded_locked`,
		tasks: `- [ ] **Backend:** Gate \`initiateOnChainTrade\` behind seller-confirmed PaymentIntent and \`trustlessEscrowEnabled\`.
- [ ] **Backend:** Reject before ledger calls when Gate C false or handshake pending.
- [ ] **Testing:** Rollback/no-ghost-funded/concurrent lock tests in \`Escrow.test.mo\`.
- [ ] **Product:** Keep Gate C enable and marketing trustless copy deferred to E9.S6.`,
	},
	"E9.S3": {
		story:
			"As the platform, I want automatic on-chain release/refund based on provable fulfillment and dispute outcomes when Gate C is enabled.",
		acceptance: [
			"Given funded_locked + fulfillment complete (NP/digital rules), when release conditions met, then releaseEscrow transfers seller minus fee on-chain.",
			"Given dispute freeze on ck trade, when moderator resolves refund, then on-chain refund to buyer atomic with terminal state.",
			"Given release ICRC fails, when error, then trade not marked terminal — retry job scheduled.",
			"Given buyer cancel pre-ship on ck path, when processed, then 85/10/5 split on-chain with dust to platform.",
		],
		bdd: `- **Scenario: Happy-path release**
  - Given trade funded and delivery confirmed
  - When release invoked
  - Then seller receives funds per fee schedule

- **Scenario: Dispute freeze**
  - Given open dispute
  - When release attempted
  - Then blocked until resolution outcome`,
		tasks: `- [ ] **Backend:** Audit \`releaseEscrow\` / refund paths in \`escrow-api.mo\`.
- [ ] **Testing:** Motoko tests + testnet multi-party flow, including ICRC release failure retry.`,
	},
	"E9.S4": {
		story:
			"As architects, we want a documented decision on external wallet vault scope versus ICRC-first escrow for goods marketplace.",
		acceptance: [
			"When evaluation completes, then ADR picks primary Phase 3 approach with explicit deferrals.",
			"Given ADR, when E10 vault UI is considered, then vault addresses are not marketed as buyer escrow for Wave 1 TRC20/BEP20 or Wave 3 ERC20 manual trades.",
		],
		bdd: `- **Scenario: ADR recorded**
  - Given options ICRC-only vs multi-chain vault + broadcast
  - When workshop completes
  - Then \`architecture.md\` references decision and Gate C scope`,
		tasks: `- [ ] **Research:** Compare external wallet integration scope to current \`Escrow.mo\`.
- [ ] **Architecture:** Write ADR with cost, security, and Ukraine-goods UX impact.
- [ ] **Product:** Defer vault marketing until ADR accepts scope.`,
	},
	"E9.S5": {
		story:
			"As architects, we want a documented decision on cross-chain lock-release patterns for goods trades.",
		acceptance: [
			"When evaluation completes, then document states adopt/reject for MVP goods marketplace.",
			"Given reject decision, when epics updated, then \`Trade\` type keeps Phase 1 manual fields only.",
		],
		bdd: `- **Scenario: Cross-chain pattern rejected for MVP goods**
  - Given Phase 1 manual + Phase 3 ICRC plan
  - When evaluation recorded
  - Then implementation plan references E9 ICRC path only`,
		tasks: `- [ ] **Architecture:** Record decision in \`docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md\`.
- [ ] **Docs:** Align E3 coordinated trade copy with E9 Phase 3 in PRD §6.`,
	},
	"E2.S8": {
		story:
			"As a buyer, I want to browse and filter by OLX-aligned category tree so discovery matches classifieds expectations.",
		acceptance: [
			"Given category catalog seeded, when I open create or browse, then L1/L2 picker shows localized labels.",
			"Given URL `?cat=<slug>`, when listings page loads, then results filter to category subtree.",
			"Given search with categoryId, when query runs, then `searchListings` includes subtree matches.",
		],
		bdd: `- **Scenario: Pick category on create**
  - Given authenticated seller on create listing
  - When category L1/L2 selected
  - Then listing stores canonical \`categoryId\`

- **Scenario: Browse by category**
  - Given homepage category grid
  - When user clicks a category
  - Then navigates to listings with correct filter`,
		tasks: `- [x] **Backend:** \`CategoryCatalog.mo\` + \`listCategories\`; regenerate via \`scripts/gen-category-catalog.mjs\`.
- [x] **Frontend:** \`CategoryPicker\`, \`CategoryGrid\`, URL sync on \`ListingsPage\`.
- [x] **Search:** \`searchListings\` respects category subtree.
- [ ] **Future:** Expand beyond 114 nodes (see E2.S10).`,
	},
	"E11.S1": {
		story: "As a buyer, I want to save listings to favorites so I can revisit them later from `/favorites`.",
		acceptance: [
			"Given authenticated user, when I favorite a listing, then it persists and appears on favorites page.",
			"Given favorited listing, when I unfavorite, then it is removed from favorites list.",
		],
		bdd: `- **Scenario: Add favorite**
  - Given listing detail with heart control
  - When I toggle favorite on
  - Then \`addFavorite\` succeeds and UI shows active state

- **Scenario: View favorites**
  - Given I have favorites
  - When I open \`/favorites\`
  - Then \`getFavoriteListings\` renders cards`,
		tasks: `- [x] **Backend:** \`Engagement.mo\` + \`engagement-api.mo\` favorites endpoints.
- [x] **Frontend:** \`FavoriteButton.tsx\`, \`FavoritesPage.tsx\`.
- [x] **Testing:** \`test/Engagement.test.mo\`.`,
	},
	"E11.S2": {
		story: "As a buyer, I want to save search filters and re-apply them later.",
		acceptance: [
			"Given filter state on listings page, when I save search, then named entry appears in saved panel.",
			"Given saved search, when I apply, then URL and filters restore.",
		],
		bdd: `- **Scenario: Save and apply**
  - Given listings filters configured
  - When I save and later apply
  - Then \`searchListings\` runs with stored parameters`,
		tasks: `- [x] **Backend:** \`saveSearch\`, \`getSavedSearches\`, delete/update as implemented.
- [x] **Frontend:** \`SavedSearchesPanel.tsx\`.
- [x] **Testing:** \`test/Engagement.test.mo\`.`,
	},
	"E11.S3": {
		story: "As a buyer, I want to message the seller about a listing before opening a trade.",
		acceptance: [
			"Given listing detail, when I send inquiry, then message is stored per listing inquiry thread.",
			"Given seller, when they reply, then buyer sees update in inquiry panel.",
		],
		bdd: `- **Scenario: Inquiry thread**
  - Given authenticated buyer on listing
  - When I send inquiry text
  - Then \`sendListingInquiry\` records message visible to seller`,
		tasks: `- [x] **Backend:** \`sendListingInquiry\`, \`getListingInquiryMessages\`.
- [x] **Frontend:** \`ListingInquiryPanel.tsx\` on \`ListingDetailPage.tsx\`.
- [ ] **Testing:** Add Motoko/flow coverage.`,
	},
	"E11.S4": {
		story: "As a seller I want to bump my listing; as admin I want to promote listings for discovery sort.",
		acceptance: [
			"Given listing owner, when bump within rules, then sort key updates (bumpedAt).",
			"Given admin promote, when applied, then listing shows VIP/promoted badge and sort priority.",
		],
		bdd: `- **Scenario: Sort order**
  - Given mixed listings
  - When default sort runs
  - Then order is promoted → bumped → createdAt`,
		tasks: `- [x] **Backend:** \`bumpListing\`, \`adminPromoteListing\`.
- [x] **Frontend:** owner bump action + admin UI.
- [x] **Search:** \`searchListings\` sort respects promotion fields.`,
	},
	"E6.S5": {
		story:
			"As the platform, I want separate buyer and seller reputation scores so trust is context-aware.",
		acceptance: [
			"Given user record, when reputation displayed on seller profile, then sellerScore is shown; on buyer context, buyerScore.",
			"Given migration from single `reputationScore`, when upgrade runs, then existing score maps to trustScore and role scores initialize safely.",
		],
		bdd: `- **Scenario: Dual scores on profile**
  - Given user with both buyer and seller history
  - When public profile renders
  - Then tabs or sections show role-specific scores

- **Scenario: Migration**
  - Given pre-migration users
  - When postupgrade runs
  - Then no data loss for trust tier gates`,
		tasks: `- [x] **Backend:** Extend \`Reputation\` type in \`types.mo\` + \`Reputation.mo\`.
- [x] **Migration:** Stable upgrade path for in-flight actor data.
- [x] **Frontend:** Profile and dispute UI consume dual scores.
- [x] **Testing:** Extend \`Reputation.test.mo\`.`,
	},
	"E8.S6": {
		story:
			"As the platform, I want anonymous principals rejected on all mutations and invalid payloads validated so state cannot be corrupted.",
		acceptance: [
			"Given anonymous principal on update, when called, then rejected with unauthorized error.",
			"Given invalid payload, when update, then validation error returned without corrupting stable data.",
			"Given authenticated caller, when payload valid, then mutation proceeds through CallerGuard.",
		],
		bdd: `- **Scenario: Anonymous caller blocked**
  - Given Principal.isAnonymous caller
  - When any protected update endpoint is invoked
  - Then request fails before business logic mutates state

- **Scenario: Invalid payload rejected**
  - Given authenticated caller
  - When required fields missing or out of bounds
  - Then structured validation error and no partial write

- **Scenario: Valid mutation allowed**
  - Given authenticated non-banned caller
  - When payload passes validation
  - Then update succeeds and audit/rate limits apply where configured`,
		tasks: `- [x] **Backend:** \`Auth.mo\` CallerGuard on shared update paths.
- [x] **Backend:** Input validation in \`marketplace-api.mo\`, \`escrow-api.mo\`, \`messaging-api.mo\`, \`auth-api.mo\`.
- [x] **Security:** Rate limits via \`RateLimiter.mo\` on sensitive endpoints.
- [x] **Testing:** \`test/Auth.test.mo\`; security review in \`docs/bmad/AUDIT.md\`.`,
	},
	"E12.S1": {
		story:
			"As a user, I want to export or delete my account data per privacy expectations while respecting Internet Identity pseudonymity.",
		acceptance: [
			"Given authenticated user, when I request export, then machine-readable bundle includes profile, listings, trades, and messages tied to my principal.",
			"Given delete request, when I confirm, then PII fields are minimized or anonymized per published privacy policy.",
			"Given export in progress, when generation completes, then download link or inline JSON is available without exposing other users' data.",
		],
		bdd: `- **Scenario: Data export**
  - Given signed-in user on Profile settings
  - When I request account export
  - Then backend aggregates principal-scoped records into a portable bundle

- **Scenario: Account deletion**
  - Given authenticated user
  - When I confirm delete with typed confirmation
  - Then profile PII cleared and active listings deactivated per policy

- **Scenario: Cross-user isolation**
  - Given user A requests export
  - When bundle generated
  - Then no private data from user B is included`,
		tasks: `- [ ] **Backend:** Export aggregator in \`auth-api.mo\` reading \`Auth.mo\`, \`Marketplace.mo\`, \`Escrow.mo\`, \`Messaging.mo\`.
- [ ] **Backend:** Delete/anonymize path with stable upgrade safety.
- [ ] **Frontend:** \`ProfilePage.tsx\` privacy section — export + delete with confirmation modal.
- [ ] **Legal:** Document retention exceptions in \`/privacy\`.
- [ ] **Testing:** \`test/Auth.test.mo\` export/delete paths; manual privacy smoke.`,
	},
};
