/**
 * Per-story brownfield implementation truth for BMAD story generation.
 * Keys match story-manifest.mjs (75 stories).
 */
export const IMPLEMENTATION_STATE = {
	"E1.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Auth.mo",
			"src/backend/mixins/auth-api.mo",
			"src/frontend/src/App.tsx",
			"src/frontend/src/components/ProfileGuard.tsx",
			"src/frontend/src/hooks/useAuth.ts",
			"src/frontend/src/main.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/App.tsx`\n  - [x] `src/frontend/src/components/ProfileGuard.tsx`\n  - [x] `src/frontend/src/hooks/useAuth.ts`\n  - [x] `src/frontend/src/main.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Auth.mo`\n  - [x] `src/backend/mixins/auth-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Auth.test.mo`",
		completionNotes: [
				"Wired Internet Identity via useAuth and @caffeineai/core-infrastructure useInternetIdentity().",
			"Protected routes use inline GuardedPage wrapper in App.tsx with ProfileGuard.",
			"Anonymous principals rejected on shared updates via Auth.assertNotAnonymous."
		],
		qaEvidence: {"1":"src/frontend/src/hooks/useAuth.ts","2":"src/backend/mixins/auth-api.mo","3":"test/Auth.test.mo"},
	},
	"E1.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Auth.mo",
			"src/backend/mixins/auth-api.mo",
			"src/frontend/src/pages/OnboardingPage.tsx",
			"src/frontend/src/pages/ProfilePage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/OnboardingPage.tsx`\n  - [x] `src/frontend/src/pages/ProfilePage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Auth.mo`\n  - [x] `src/backend/mixins/auth-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Auth.test.mo`",
		completionNotes: [
			"OnboardingPage persists handle and avatar on first login.",
			"ProfilePage loads and saves getMyProfile/setMyProfile."
		],
		qaEvidence: {"1":"src/frontend/src/pages/OnboardingPage.tsx","2":"src/frontend/src/pages/ProfilePage.tsx","3":"test/Auth.test.mo"},
	},
	"E1.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/auth-api.mo",
			"src/frontend/src/pages/ProfilePage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/ProfilePage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/auth-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"Public profile route strips private fields server-side.",
			"Visitor sees listings grid without principal or liability data."
		],
		qaEvidence: {"1":"src/frontend/src/pages/ProfilePage.tsx","2":"src/backend/mixins/auth-api.mo"},
	},
	"E1.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Admin.mo",
			"src/backend/mixins/admin-api.mo",
			"src/frontend/src/pages/AdminPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Admin.mo`\n  - [x] `src/backend/mixins/admin-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Admin.test.mo`",
		completionNotes: [
			"Admin ban and suspend flows in AdminPage.",
			"Ban actions recorded in audit log."
		],
		qaEvidence: {"1":"src/backend/lib/Admin.mo","2":"test/Admin.test.mo"},
	},
	"E2.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Marketplace.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/backend/mixins/object-storage-api.mo",
			"src/frontend/src/pages/CreateListingPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/CreateListingPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Marketplace.mo`\n  - [x] `src/backend/mixins/marketplace-api.mo`\n  - [x] `src/backend/mixins/object-storage-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Marketplace.test.mo`",
		completionNotes: [
			"CreateListingPage with Caffeine object storage uploads.",
			"Physical listings forced to self_pickup via deliveryPolicy."
		],
		qaEvidence: {"1":"test/Marketplace.test.mo","2":"src/backend/mixins/object-storage-api.mo","3":"src/frontend/src/pages/CreateListingPage.tsx"},
	},
	"E2.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/components/marketplace/FilterPanel.tsx",
			"src/frontend/src/components/marketplace/SearchBar.tsx",
			"src/frontend/src/pages/ListingsPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/marketplace/FilterPanel.tsx`\n  - [x] `src/frontend/src/components/marketplace/SearchBar.tsx`\n  - [x] `src/frontend/src/pages/ListingsPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Marketplace.test.mo`",
		completionNotes: [
			"ListingsPage searchListings with URL-synced filters.",
			"FilterPanel and SearchBar wired to category and token filters."
		],
		qaEvidence: {"1":"test/Marketplace.test.mo","2":"src/frontend/src/pages/ListingsPage.tsx"},
	},
	"E2.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/escrow-api.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/lib/initiateListingTrade.ts",
			"src/frontend/src/pages/ListingDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/lib/initiateListingTrade.ts`\n  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/escrow-api.mo`\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"ListingDetailPage shows photos, price, token, seller card.",
			"Buy CTA triggers sign-in guard when logged out."
		],
		qaEvidence: {"1":"src/frontend/src/pages/ListingDetailPage.tsx","2":"src/frontend/src/lib/initiateListingTrade.ts"},
	},
	"E2.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/lib/createListingSearch.ts",
			"src/frontend/src/pages/CreateListingPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/lib/createListingSearch.ts`\n  - [x] `src/frontend/src/pages/CreateListingPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"Edit flow via /listings/create?edit=id with owner guard.",
			"updateListing persists seller edits."
		],
		qaEvidence: {"1":"src/frontend/src/pages/CreateListingPage.tsx","2":"src/backend/mixins/marketplace-api.mo"},
	},
	"E2.S5": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Marketplace.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/pages/ListingDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Marketplace.mo`\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Marketplace.test.mo`",
		completionNotes: [
			"Deactivate with confirmation on ListingDetailPage.",
			"Inactive listings excluded from browse index."
		],
		qaEvidence: {"1":"test/Marketplace.test.mo"},
	},
	"E2.S6": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Marketplace.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/pages/ProfilePage.tsx",
			"test/Marketplace.test.mo"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/ProfilePage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Marketplace.mo`\\n  - [x] `src/backend/mixins/marketplace-api.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Marketplace.test.mo` getPublicListingsByUser\\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"Public seller profile uses getPublicListingsByUser (active-only server filter).",
			"Owner profile still uses getListingsByUser with active/inactive tabs."
		],
		qaEvidence: {"1":"src/backend/lib/Marketplace.mo","2":"test/Marketplace.test.mo","3":"src/frontend/src/pages/ProfilePage.tsx"},
	},
	"E2.S7": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/backend/types.mo",
			"src/frontend/src/pages/CreateListingPage.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/CreateListingPage.tsx`\\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Escrow.mo`\\n  - [x] `src/backend/types.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] Manual digital listing smoke\\n  - [x] Known test gap documented: dedicated `test/Escrow.test.mo` coverage for digital delivery / inspection window\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"Digital listing type in CreateListingPage and Escrow digital delivery fields.",
			"Trade detail supports digital inspection window."
		],
		qaEvidence: {"1":"src/backend/lib/Escrow.mo","2":"src/frontend/src/pages/TradeDetailPage.tsx"},
		gaps: [
			"No dedicated Escrow.test.mo cases for digital delivery and inspection deadline paths."
		],
	},
	"E2.S8": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/CategoryCatalog.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/components/marketplace/CategoryGrid.tsx",
			"src/frontend/src/components/marketplace/CategoryPicker.tsx",
			"src/frontend/src/pages/ListingsPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/marketplace/CategoryGrid.tsx`\n  - [x] `src/frontend/src/components/marketplace/CategoryPicker.tsx`\n  - [x] `src/frontend/src/pages/ListingsPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/CategoryCatalog.mo`\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Marketplace.test.mo`",
		completionNotes: [
			"CategoryCatalog.mo 15 L1 + 99 L2 categories.",
			"CategoryPicker, CategoryGrid, and ?cat= URL filter on browse."
		],
		qaEvidence: {"1":"src/backend/lib/CategoryCatalog.mo","2":"test/Marketplace.test.mo","3":"src/frontend/src/components/marketplace/CategoryPicker.tsx"},
	},
	"E11.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Engagement.mo",
			"src/backend/mixins/engagement-api.mo",
			"src/frontend/src/components/marketplace/FavoriteButton.tsx",
			"src/frontend/src/pages/FavoritesPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/marketplace/FavoriteButton.tsx`\n  - [x] `src/frontend/src/pages/FavoritesPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Engagement.mo`\n  - [x] `src/backend/mixins/engagement-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Engagement.test.mo`",
		completionNotes: [
			"FavoriteButton on listing cards; FavoritesPage lists watchlist."
		],
		qaEvidence: {"1":"test/Engagement.test.mo","2":"src/frontend/src/components/marketplace/FavoriteButton.tsx"},
	},
	"E11.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/engagement-api.mo",
			"src/frontend/src/components/marketplace/SavedSearchesPanel.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/marketplace/SavedSearchesPanel.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/engagement-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Engagement.test.mo`",
		completionNotes: [
			"SavedSearchesPanel persists and reapplies filter state."
		],
		qaEvidence: {"1":"test/Engagement.test.mo","2":"src/frontend/src/components/marketplace/SavedSearchesPanel.tsx"},
	},
	"E11.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/engagement-api.mo",
			"src/frontend/src/components/marketplace/ListingInquiryPanel.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/marketplace/ListingInquiryPanel.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/engagement-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Engagement.test.mo`",
		completionNotes: [
			"ListingInquiryPanel on listing detail for pre-trade questions."
		],
		qaEvidence: {"1":"src/backend/mixins/engagement-api.mo","2":"src/frontend/src/components/marketplace/ListingInquiryPanel.tsx"},
	},
	"E11.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/admin-api.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/pages/AdminPage.tsx",
			"src/frontend/src/pages/ListingDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\\n  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/mixins/admin-api.mo`\\n  - [x] `src/backend/mixins/marketplace-api.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Engagement.test.mo`",
		completionNotes: [
			"adminPromoteListing in admin-api and marketplace sort priority.",
			"Admin Listings tab promote-by-ID control.",
			"Seller bump via engagement API."
		],
		qaEvidence: {"1":"src/backend/mixins/admin-api.mo","2":"src/frontend/src/pages/AdminPage.tsx","3":"test/Engagement.test.mo"},
	},
	"E3.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/backend/mixins/escrow-api.mo",
			"src/frontend/src/lib/initiateListingTrade.ts",
			"src/frontend/src/pages/ListingDetailPage.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx",
			"test/Escrow.test.mo"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/lib/initiateListingTrade.ts`\\n  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`\\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Escrow.mo`\\n  - [x] `src/backend/mixins/escrow-api.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Escrow.test.mo` initiateTrade suite\\n  - [x] Manual listing buy → trade detail smoke",
		completionNotes: [
			"initiateTrade from listing detail via initiateListingTrade helper.",
			"TradeDetailPage loads after successful initiation.",
			"initiateTrade happy-path covered in Escrow.test.mo."
		],
		qaEvidence: {"1":"src/backend/mixins/escrow-api.mo","2":"test/Escrow.test.mo","3":"src/frontend/src/lib/initiateListingTrade.ts"},
	},
	"E3.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Escrow.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Escrow.test.mo`",
		completionNotes: [
			"confirmPaymentSent on TradeDetailPage moves trade to buyer_confirmed."
		],
		qaEvidence: {"1":"test/Escrow.test.mo","2":"src/frontend/src/pages/TradeDetailPage.tsx"},
	},
	"E3.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Escrow.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Escrow.test.mo`",
		completionNotes: [
			"confirmPaymentReceived completes trade from buyer_confirmed."
		],
		qaEvidence: {"1":"test/Escrow.test.mo"},
	},
	"E3.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Escrow.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Escrow.test.mo`\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"proposeCancelTrade mutual-cancel flow on TradeDetailPage.",
			"Refund deadline rules in Escrow.mo."
		],
		qaEvidence: {"1":"test/Escrow.test.mo","2":"src/backend/lib/Escrow.mo"},
		gaps: [
			"API is proposeCancelTrade not cancelTrade; story AC wording uses cancel/refund generically."
		],
	},
	"E3.S5": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/frontend/src/components/trade/ChatPanel.tsx",
			"src/frontend/src/components/trade/EscrowTimeline.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/trade/ChatPanel.tsx`\n  - [x] `src/frontend/src/components/trade/EscrowTimeline.tsx`\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Escrow.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"TradeDetailPage with EscrowTimeline and ChatPanel entry."
		],
		qaEvidence: {"1":"src/frontend/src/pages/TradeDetailPage.tsx","2":"src/frontend/src/components/trade/EscrowTimeline.tsx"},
	},
	"E3.S6": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/frontend/src/pages/HomePage.tsx",
			"src/frontend/src/pages/HowPaymentsWorkPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/HomePage.tsx`\n  - [x] `src/frontend/src/pages/HowPaymentsWorkPage.tsx`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"HowPaymentsWorkPage documents Phase 1 manual settlement.",
			"Home and trade surfaces audited for honest copy."
		],
		qaEvidence: {"1":"src/frontend/src/pages/HowPaymentsWorkPage.tsx"},
	},
	"E4.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Admin.mo",
			"src/frontend/src/pages/HomePage.tsx"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/HomePage.tsx`\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Admin.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] Manual smoke on affected routes\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"HomePage shows four approved buyer-facing tokens.",
			"TradeToken enum includes additional networks in types.mo for backend."
		],
		qaEvidence: {"1":"src/frontend/src/pages/HomePage.tsx"},
		gaps: [
			"Backend TradeToken has more than four variants; UI trimmed to product set only."
		],
	},
	"E4.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"docs/bmad/PAYMENT-VERIFICATION-E2E.md",
			"src/backend/lib/Payments.mo",
			"src/backend/mixins/payments-api.mo",
			"src/frontend/src/components/shared/PaymentVerificationWidget.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/shared/PaymentVerificationWidget.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Payments.mo`\n  - [x] `src/backend/mixins/payments-api.mo`\n- [x] **Documentation**\n  - [x] `docs/bmad/PAYMENT-VERIFICATION-E2E.md`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Payments.test.mo`",
		completionNotes: [
			"PaymentVerificationWidget calls verifyPayment for explorer match.",
			"PAYMENT-VERIFICATION-E2E.md documents Gate B proof."
		],
		qaEvidence: {"1":"test/Payments.test.mo","2":"src/frontend/src/components/shared/PaymentVerificationWidget.tsx"},
	},
	"E4.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/payments-api.mo"
		],
		tasks: "- [x] **Backend**\\n  - [x] `src/backend/mixins/payments-api.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Payments.test.mo`\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"httpGet/PostWithRetry in payments-api.mo for explorer outcalls."
		],
		qaEvidence: {"1":"src/backend/mixins/payments-api.mo"},
		gaps: [
			"No automated circuit-breaker or retry-budget tests in Payments.test.mo."
		],
	},
	"E4.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/admin-api.mo",
			"src/frontend/src/pages/AdminPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/admin-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"Admin settings panel stores TronGrid/BSCScan/Infura keys."
		],
		qaEvidence: {"1":"src/frontend/src/pages/AdminPage.tsx","2":"src/backend/mixins/admin-api.mo"},
	},
	"E4.S5": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/payments-api.mo",
			"src/frontend/src/components/payment/AddressInputWithHints.tsx",
			"src/frontend/src/components/payment/WalletQRScanner.tsx",
			"src/frontend/src/pages/AddPaymentMethodPage.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/components/payment/AddressInputWithHints.tsx`\\n  - [x] `src/frontend/src/components/payment/WalletQRScanner.tsx`\\n  - [x] `src/frontend/src/pages/AddPaymentMethodPage.tsx`\\n  - [x] `src/frontend/src/pages/TradeDetailPage.tsx` seller payment copy panel\\n- [x] **Backend**\\n  - [x] `src/backend/mixins/payments-api.mo` getSellerPaymentMethodsForTrade\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"WalletQRScanner and AddressInputWithHints on AddPaymentMethodPage.",
			"TradeDetailPage SellerPaymentAddressPanel with copy for buyers in pending/funded."
		],
		qaEvidence: {"1":"src/backend/mixins/payments-api.mo","2":"src/frontend/src/pages/TradeDetailPage.tsx","3":"src/frontend/src/components/payment/WalletQRScanner.tsx"},
	},
	"E4.S6": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Payments.mo"
		],
		tasks: "- [x] **Backend**\\n  - [x] `src/backend/lib/Payments.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Payments.test.mo`\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"CoinGecko refreshRates and getCachedRate in Payments.mo."
		],
		qaEvidence: {"1":"test/Payments.test.mo","2":"src/backend/lib/Payments.mo"},
		gaps: [
			"No explicit oracle TTL/cache miss tests in Payments.test.mo."
		],
	},
	"E5.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Messaging.mo",
			"src/backend/mixins/messaging-api.mo",
			"src/frontend/src/components/trade/ChatPanel.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/trade/ChatPanel.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Messaging.mo`\n  - [x] `src/backend/mixins/messaging-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Messaging.test.mo`",
		completionNotes: [
			"ChatPanel per-trade messaging via Messaging.mo."
		],
		qaEvidence: {"1":"test/Messaging.test.mo","2":"src/frontend/src/components/trade/ChatPanel.tsx"},
	},
	"E5.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/messaging-api.mo",
			"src/frontend/src/contexts/NotificationContext.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/contexts/NotificationContext.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/messaging-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"NotificationContext 30s polling for unread and trade warnings."
		],
		qaEvidence: {"1":"src/frontend/src/contexts/NotificationContext.tsx"},
	},
	"E5.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Messaging.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/Messaging.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Messaging.test.mo`",
		completionNotes: [
			"Message content sanitized on render in chat components."
		],
		qaEvidence: {"1":"test/Messaging.test.mo"},
	},
	"E6.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Disputes.mo",
			"src/backend/mixins/disputes-api.mo",
			"src/frontend/src/components/trade/DisputeModal.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/trade/DisputeModal.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Disputes.mo`\n  - [x] `src/backend/mixins/disputes-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Disputes.test.mo`",
		completionNotes: [
			"DisputeModal opens dispute with reason and evidence."
		],
		qaEvidence: {"1":"test/Disputes.test.mo","2":"src/frontend/src/components/trade/DisputeModal.tsx"},
	},
	"E6.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/disputes-api.mo",
			"src/frontend/src/pages/AdminPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/disputes-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Disputes.test.mo`",
		completionNotes: [
			"Admin dispute queue resolveDispute updates terminal states."
		],
		qaEvidence: {"1":"test/Disputes.test.mo","2":"src/frontend/src/pages/AdminPage.tsx"},
	},
	"E6.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Reputation.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/Reputation.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Reputation.test.mo`",
		completionNotes: [
			"Reputation tiers enforce trade limits on initiation."
		],
		qaEvidence: {"1":"test/Reputation.test.mo","2":"src/backend/lib/Reputation.mo"},
	},
	"E6.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/mixins/disputes-api.mo",
			"src/frontend/src/pages/JurorDashboardPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/JurorDashboardPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/mixins/disputes-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Disputes.test.mo`\n- [x] **Product deferral** — code present, nav/marketing gated",
		completionNotes: [
			"JurorDashboardPage and disputes-api jury paths implemented.",
			"Product launch deferred from primary navigation."
		],
		qaEvidence: {"1":"test/Disputes.test.mo","2":"src/frontend/src/pages/JurorDashboardPage.tsx"},
		gaps: [
			"No golden-path flow; jury mode not productized."
		],
	},
	"E6.S5": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/Reputation.mo",
			"src/backend/types.mo",
			"src/backend/lib/Auth.mo",
			"src/frontend/src/components/profile/ReputationStats.tsx",
			"test/Reputation.test.mo"
		],
		tasks: "- [x] **Frontend**\\n  - [x] ReputationStats buyer/seller scores\\n- [x] **Backend**\\n  - [x] buyerScore/sellerScore on User\\n  - [x] ensureDualScores migration\\n- [x] **Testing:**\\n  - [x] `test/Reputation.test.mo`",
		completionNotes: [
			"Dual buyerScore/sellerScore with legacy reputationScore as trust tier gate.",
			"ensureDualScores maps pre-migration reputationScore to both role scores."
		],
		qaEvidence: {"1":"test/Reputation.test.mo","2":"src/frontend/src/components/profile/ReputationStats.tsx"},
	},
	"E6.S6": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/types.mo",
			"src/backend/lib/Reputation.mo",
			"src/backend/main.mo",
			"src/backend/mixins/admin-api.mo",
			"src/backend/mixins/disputes-api.mo",
			"src/backend/mixins/escrow-api.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/backend/lib/OnChainSettlement.mo",
			"test/Reputation.test.mo",
			"src/frontend/src/components/admin/LiabilityQueueTable.tsx",
			"src/frontend/src/pages/AdminPage.tsx",
			"src/frontend/src/i18n/index.ts"
		],
		tasks: "- [x] **Backend**\\n  - [x] LiabilityRecord with unique IDs, audit trail, partial status\\n  - [x] createLiability / applyStakeSeizure / partialClearLiability\\n  - [x] tradeBlockedErrorUa citing liability ID\\n  - [x] adminListLiabilities + adminPartialClearLiability\\n- [x] **Frontend**\\n  - [x] Admin liabilities tab (sorted by severity + age)\\n- [x] **Testing:**\\n  - [x] `test/Reputation.test.mo` E6.S6 depth suites",
		completionNotes: [
			"Global liability records with unique IDs, partial stake seizure status, admin partial clear with audit.",
			"Trade/listing gates return UA message citing primary liability ID when threshold exceeded.",
			"Admin dashboard tab lists open/partial liabilities sorted by remaining balance then age."
		],
		qaEvidence: {"1":"src/backend/lib/Reputation.mo","2":"test/Reputation.test.mo","3":"src/backend/mixins/admin-api.mo","4":"src/frontend/src/components/admin/LiabilityQueueTable.tsx","5":"test/Reputation.test.mo"},
	},
	"E6.S7": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/types.mo",
			"src/backend/lib/LiabilityWaterfall.mo",
			"src/backend/mixins/disputes-api.mo",
			"src/backend/main.mo",
			"test/LiabilityWaterfall.test.mo",
			"src/frontend/src/components/trade/SellerFaultSettlementPanel.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx",
			"src/frontend/src/i18n/index.ts",
			"src/frontend/src/backend.d.ts",
			"src/frontend/src/backend.ts",
			"src/frontend/src/mocks/backend.ts"
		],
		tasks: "- [x] **Phase 1** account restrictions via isTradeBlocked (no custodial seizure)\\n- [x] **Wave 3 depth** LiabilityWaterfall: stake → on-chain refund (escrow) → insurance → restriction\\n- [x] Honest manual vs ck copy (SellerFaultSettlementPanel + i18n)\\n- [x] test/LiabilityWaterfall.test.mo W3-9",
		completionNotes: [
			"Seller-fault waterfall seizes stake first (S=max(5%×P,10 USDT)), then requests capped insurance on ck path only.",
			"Manual path: stake + account restriction — never custodial recovery copy (D-041).",
			"getSellerFaultSettlementView + TradeDetail honest copy for partial/on-chain recovery."
		],
		qaEvidence: {
			"1": "src/backend/lib/LiabilityWaterfall.mo",
			"2": "test/LiabilityWaterfall.test.mo",
			"3": "src/frontend/src/components/trade/SellerFaultSettlementPanel.tsx"
		},
		gaps: [
			"Cross-wallet ck collateral seizure (step 3) deferred — Gate C scope."
		],
	},
	"E7.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Shipping.mo",
			"src/frontend/src/lib/deliveryPolicy.ts",
			"src/frontend/src/pages/CreateListingPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/lib/deliveryPolicy.ts`\n  - [x] `src/frontend/src/pages/CreateListingPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Shipping.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"PHYSICAL_DELIVERY_LOCKED_TO_PICKUP in deliveryPolicy.ts.",
			"Carrier selectors hidden on create listing."
		],
		qaEvidence: {"1":"src/frontend/src/lib/deliveryPolicy.ts"},
	},
	"E7.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Escrow.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/Escrow.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Escrow.test.mo`",
		completionNotes: [
			"Digital inspection window enforced in Escrow digital paths."
		],
		qaEvidence: {"1":"src/backend/lib/Escrow.mo"},
	},
  "E7.S3": {
    reconciledAt: "2026-05-23",
    fileList: [
      "src/backend/lib/Shipping.mo",
      "src/backend/lib/Escrow.mo",
      "src/backend/mixins/shipping-api.mo",
      "src/backend/mixins/escrow-api.mo",
      "src/backend/types.mo",
      "src/frontend/src/lib/deliveryPolicy.ts",
      "src/frontend/src/pages/TradeDetailPage.tsx",
      "src/frontend/src/components/shared/ShippingProviderSelector.tsx",
      "test/Shipping.test.mo",
      "test/Escrow.test.mo"
    ],
    tasks: "- [x] **Backend foundation**\n  - [x] `src/backend/lib/Shipping.mo`\n  - [x] `src/backend/mixins/shipping-api.mo`\n- [x] **Frontend foundation**\n  - [x] `src/frontend/src/components/CascadingLocationPicker.tsx`\n  - [x] `src/frontend/src/components/trade/ShippingTracker.tsx`\n- [x] **Wave 1 product enablement**\n  - [x] flip `deliveryPolicy.ts` from pickup-only to Nova Poshta-only\n  - [x] listing/trade UI exposes Nova Poshta only\n  - [x] D-019 ship-by SLA timer wired",
    completionNotes: [
      "Nova Poshta-only deliveryPolicy unlock (self-pickup/ukrposhta/meest hidden).",
      "TTN format validation + markShipped with carrier acceptance; invalid TTN stays fulfillment_pending.",
      "Buyer confirmBuyerReceipt + NP delivered 48h auto-complete (fail-closed without npDeliveredAt).",
      "Ship-by 7d SLA escalates to disputed via checkShipByDeadlines / checkFulfillmentDeadlines."
    ],
    qaEvidence: {"1":"test/Shipping.test.mo","2":"test/Escrow.test.mo","3":"src/backend/lib/Shipping.mo"},
    gaps: [],
  },
	"E7.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Shipping.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/Shipping.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Shipping.test.mo`\n- [x] **Product deferral** — code present, nav/marketing gated",
		completionNotes: [
			"Ukrposhta and Meest paths in Shipping.mo."
		],
		qaEvidence: {"1":"test/Shipping.test.mo"},
		gaps: [
			"Same pickup lock as E7.S3; not exposed in Phase 1 UI."
		],
	},
	"E7.S5": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/mixins/shipping-api.mo",
			"src/backend/main.mo",
			"src/frontend/src/components/trade/ShippingTracker.tsx"
		],
		tasks: "- [x] **Backend**\\n  - [x] trackingTimelines map + appendTrackingEvent\\n- [x] **Frontend**\\n  - [x] ShippingTracker 30s polling (existing)\\n- [x] **Testing:**\\n  - [x] `mops test` Shipping suite",
		completionNotes: [
			"Unified tracking accumulates statusHistory across polls within SLA window.",
			"Carrier webhook ingestion deferred; polling + persistent timeline shipped."
		],
		qaEvidence: {"1":"src/backend/mixins/shipping-api.mo","2":"src/frontend/src/components/trade/ShippingTracker.tsx"},
	},
	"E8.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Observability.mo",
			"src/backend/mixins/admin-api.mo",
			"src/frontend/src/pages/AdminPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Observability.mo`\n  - [x] `src/backend/mixins/admin-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Admin.test.mo`",
		completionNotes: [
			"AdminPage dashboards for users, disputes, metrics."
		],
		qaEvidence: {"1":"test/Admin.test.mo","2":"src/frontend/src/pages/AdminPage.tsx"},
	},
	"E8.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Admin.mo",
			"src/frontend/src/pages/AdminPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/AdminPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Admin.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"System settings including allowed tokens in admin UI."
		],
		qaEvidence: {"1":"src/backend/lib/Admin.mo"},
	},
	"E8.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Admin.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/Admin.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Admin.test.mo`",
		completionNotes: [
			"Audit log for ban and settings changes."
		],
		qaEvidence: {"1":"test/Admin.test.mo"},
	},
	"E8.S4": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Observability.mo",
			"src/frontend/src/components/admin/Phase2MetricsPanel.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/components/admin/Phase2MetricsPanel.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Observability.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes",
		completionNotes: [
			"Phase2MetricsPanel and Observability.mo metrics."
		],
		qaEvidence: {"1":"src/frontend/src/components/admin/Phase2MetricsPanel.tsx","2":"src/backend/lib/Observability.mo"},
	},
	"E8.S5": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/RateLimiter.mo"
		],
		tasks: "- [x] **Backend**\n  - [x] `src/backend/lib/RateLimiter.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/RateLimiter.test.mo`",
		completionNotes: [
			"RateLimiter.mo on sensitive public updates."
		],
		qaEvidence: {"1":"test/RateLimiter.test.mo"},
	},
	"E8.S6": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Auth.mo",
			"src/backend/lib/RateLimiter.mo",
			"src/backend/mixins/auth-api.mo",
			"src/backend/mixins/escrow-api.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/backend/mixins/messaging-api.mo"
		],
		tasks: "- [x] **Backend**\\n  - [x] `src/backend/lib/Auth.mo`\\n  - [x] `src/backend/lib/RateLimiter.mo`\\n  - [x] `src/backend/mixins/auth-api.mo`\\n  - [x] `src/backend/mixins/escrow-api.mo`\\n  - [x] `src/backend/mixins/marketplace-api.mo`\\n  - [x] `src/backend/mixins/messaging-api.mo`\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Auth.test.mo`\\n- [x] **Known gaps documented** in Dev Agent Record",
		completionNotes: [
			"Auth.assertNotAnonymous used across mixins.",
			"Input validation on marketplace and escrow updates."
		],
		qaEvidence: {"1":"test/Auth.test.mo","2":"src/backend/lib/Auth.mo"},
		gaps: [
			"No standalone CallerGuard.mo module; guard lives in Auth.mo and per-domain asserts."
		],
	},
	"E9.S1": {
		reconciledAt: "2026-05-23",
		fileList: [
			"docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md",
			"src/backend/mixins/escrow-api.mo"
		],
		tasks: "- [x] Design doc with failure modes + admin gating\\n- [x] trustlessEscrowEnabled flag",
		completionNotes: [
			"ONCHAIN-SETTLEMENT-DESIGN.md: ICRC-2 path, failure modes, Gate C checklist.",
			"initiateOnChainTrade gated by admin flag (default false)."
		],
		qaEvidence: {"1":"docs/bmad/ONCHAIN-SETTLEMENT-DESIGN.md","2":"test/Escrow.test.mo"},
		gaps: [],
	},
	"E9.S2": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/Escrow.mo",
			"src/backend/mixins/escrow-api.mo",
			"src/backend/lib/Admin.mo",
			"src/frontend/src/components/admin/TrustlessEscrowPanel.tsx",
			"test/Escrow.test.mo"
		],
		tasks: "- [x] Backend initiateOnChainTrade + rollback on ledger error\\n- [x] Admin trustlessEscrowEnabled gate\\n- [x] Frontend buyer ICRC-2 approve CTA (Gate C)",
		completionNotes: [
			"Buyer path: icrc2_approve → initiateOnChainTrade → #funded; TradeDetailPage on-chain panel; manual path hidden for ckUSDC/ckUSDT."
		],
		qaEvidence: {"1":"test/Escrow.test.mo","2":"src/frontend/src/lib/icrcEscrow.ts"},
		gaps: [
			"Mainnet multi-party E2E with real ckUSDC/ckUSDT wallets still required before production cap removal."
		],
	},
	"E9.S3": {
		reconciledAt: "2026-05-24",
		fileList: [
			"src/backend/lib/OnChainSettlement.mo",
			"src/backend/lib/Escrow.mo",
			"src/backend/mixins/escrow-api.mo",
			"src/backend/types.mo",
			"test/Escrow.test.mo"
		],
		tasks: "- [x] Deferred terminal ICRC release/refund (pending queue + finalize on success)\\n- [x] retryPendingOnChainSettlements admin job\\n- [x] buyer cancel 85/10/5 on-chain split\\n- [x] dispute resolve atomic settlement\\n- [ ] Testnet multi-party release/refund E2E",
		completionNotes: [
			"OnChainSettlement.mo orchestrates ICRC transfers; terminal status only after ledger success; failed transfers queue retry with attempts/lastError on trade."
		],
		qaEvidence: {"1":"test/Escrow.test.mo","2":"src/backend/mixins/escrow-api.mo","3":"src/backend/lib/OnChainSettlement.mo"},
		gaps: [
			"Gate C testnet E2E with real ckUSDC ledger still required before production."
		],
	},
	"E10.S4": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/InsuranceReserve.mo",
			"src/backend/mixins/insurance-api.mo",
			"src/backend/mixins/governance-api.mo",
			"src/backend/main.mo",
			"test/Treasury.test.mo",
			"src/frontend/src/components/trade/BuyerProtectionBadge.tsx",
			"src/frontend/src/pages/HowPaymentsWorkPage.tsx",
			"src/frontend/src/pages/TradeDetailPage.tsx",
			"src/frontend/src/i18n/index.ts"
		],
		tasks: "- [x] InsuranceReserve ledger + 40% fee accrual\\n- [x] Capped payout policy + dual-admin + fraud hold\\n- [x] Honest buyer protection copy (HowPaymentsWork + TradeDetail)\\n- [x] test/Treasury.test.mo W3-6..8",
		completionNotes: [
			"Separate insurance ledger from operating treasury; no unlimited guarantee copy when fund empty or trade >500 USDT."
		],
		qaEvidence: {"1":"test/Treasury.test.mo","2":"src/backend/lib/InsuranceReserve.mo","3":"src/frontend/src/components/trade/BuyerProtectionBadge.tsx"},
		gaps: [],
	},
	"E9.S4": {
		reconciledAt: "2026-05-23",
		fileList: [
			"docs/bmad/ADR-ICRC-VS-EXTERNAL-WALLET.md"
		],
		tasks: "- [x] ADR: ICRC-first; vault evaluation deferred",
		completionNotes: [
			"Accepted: ICRC-first escrow; external vault scope stays built-deferred (E10)."
		],
		qaEvidence: {"1":"docs/bmad/ADR-ICRC-VS-EXTERNAL-WALLET.md"},
		gaps: [],
	},
	"E9.S5": {
		reconciledAt: "2026-05-23",
		fileList: [
			"docs/bmad/ADR-CROSS-CHAIN-PATTERN.md"
		],
		tasks: "- [x] ADR: cross-chain deferred; ICRC-only Phase 3 beta",
		completionNotes: [
			"Cross-chain lock-release documented as future milestone; no product promise."
		],
		qaEvidence: {"1":"docs/bmad/ADR-CROSS-CHAIN-PATTERN.md"},
		gaps: [],
	},
	"E10.S1": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Governance.mo",
			"src/backend/mixins/governance-api.mo",
			"src/frontend/src/pages/GovernancePage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/GovernancePage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Governance.mo`\n  - [x] `src/backend/mixins/governance-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes\n- [x] **Product deferral** — code present, nav/marketing gated",
		completionNotes: [
			"Governance.mo and GovernancePage.tsx implemented.",
			"Deferred from launch navigation."
		],
		qaEvidence: {"1":"src/backend/lib/Governance.mo","2":"src/frontend/src/pages/GovernancePage.tsx"},
		gaps: [
			"Product not enabled for Phase 1 users."
		],
	},
	"E10.S2": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Vault.mo",
			"src/backend/mixins/vault-api.mo",
			"src/frontend/src/pages/VaultPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/VaultPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Vault.mo`\n  - [x] `src/backend/mixins/vault-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes\n- [x] **Product deferral** — code present, nav/marketing gated",
		completionNotes: [
			"Vault.mo and VaultPage.tsx for per-chain addresses."
		],
		qaEvidence: {"1":"src/backend/lib/Vault.mo","2":"src/frontend/src/pages/VaultPage.tsx"},
		gaps: [
			"Vault not in Phase 1 product surface."
		],
	},
	"E10.S3": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Treasury.mo",
			"src/frontend/src/pages/GovernancePage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/GovernancePage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Treasury.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] Manual smoke on affected routes\n- [x] **Product deferral** — code present, nav/marketing gated",
		completionNotes: [
			"Treasury.mo fee accrual hooks; treasury panel in governance UI."
		],
		qaEvidence: {"1":"src/backend/lib/Treasury.mo"},
		gaps: [
			"Treasury withdrawals require governance enablement."
		],
	},
	"E2.S9": {
		reconciledAt: "2026-05-21",
		fileList: [
			"src/backend/lib/Admin.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/pages/ListingDetailPage.tsx"
		],
		tasks: "- [x] **Frontend**\n  - [x] `src/frontend/src/pages/ListingDetailPage.tsx`\n- [x] **Backend**\n  - [x] `src/backend/lib/Admin.mo`\n  - [x] `src/backend/mixins/marketplace-api.mo`\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\n- [x] **Testing:**\n  - [x] `test/Admin.test.mo`",
		completionNotes: [
			"reportListing from listing detail to admin audit."
		],
		qaEvidence: {"1":"src/frontend/src/pages/ListingDetailPage.tsx","2":"test/Admin.test.mo"},
	},
	"E12.S1": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/Auth.mo",
			"src/backend/mixins/auth-api.mo",
			"src/backend/types.mo",
			"src/frontend/src/pages/ProfilePage.tsx",
			"test/Auth.test.mo"
		],
		tasks: "- [x] **Frontend**\\n  - [x] `src/frontend/src/pages/ProfilePage.tsx` PrivacyDataPanel\\n- [x] **Backend**\\n  - [x] `src/backend/lib/Auth.mo` buildAccountExport + deleteMyAccount\\n  - [x] `src/backend/mixins/auth-api.mo` exportMyAccountData + deleteMyAccount\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Auth.test.mo` GDPR suites",
		completionNotes: [
			"exportMyAccountData returns principal-scoped JSON bundle (profile, listings, trades, messages).",
			"deleteMyAccount anonymizes PII after DELETE confirmation; blocks open trades.",
			"ProfilePage export download + close-account UI with i18n uk/en."
		],
		qaEvidence: {"1":"src/backend/lib/Auth.mo","2":"test/Auth.test.mo","3":"src/frontend/src/pages/ProfilePage.tsx"},
	},
	"E12.S2": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/types.mo",
			"src/backend/lib/Reputation.mo",
			"src/backend/lib/Admin.mo",
			"src/backend/mixins/admin-api.mo",
			"src/frontend/src/pages/ProfilePage.tsx",
			"src/frontend/src/components/admin/UserManagementTable.tsx",
			"test/Reputation.test.mo"
		],
		tasks: "- [x] **Backend**\\n  - [x] KycTier enum + adminSetUserKycTier\\n  - [x] Verified tier doubles trade limits\\n- [x] **Frontend**\\n  - [x] Profile verified badge\\n  - [x] Admin KYC+/- in user table\\n- [x] **Testing:**\\n  - [x] Reputation.test.mo KYC suites",
		completionNotes: [
			"Phase 1 substitute: admin manual tier assignment (no external KYC provider).",
			"External provider flow deferred until legal + vendor selected."
		],
		qaEvidence: {"1":"test/Reputation.test.mo","2":"src/frontend/src/pages/ProfilePage.tsx","3":"src/backend/mixins/admin-api.mo"},
		gaps: [
			"External KYC provider integration requires vendor API keys + legal review."
		],
	},
	"E2.S10": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/CategoryCatalog.mo",
			"src/backend/lib/Marketplace.mo",
			"src/backend/types.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/frontend/src/components/marketplace/CategoryAttributeFields.tsx",
			"src/frontend/src/pages/CreateListingPage.tsx",
			"src/frontend/src/pages/ListingDetailPage.tsx",
			"test/Marketplace.test.mo"
		],
		tasks: "- [x] **Frontend**\\n  - [x] CategoryAttributeFields + CreateListingPage\\n  - [x] ListingDetailPage attribute display\\n- [x] **Backend**\\n  - [x] CategoryCatalog.attributeSchema\\n  - [x] Marketplace.validateAttributes\\n- [x] **Testing:**\\n  - [x] `test/Marketplace.test.mo` auto vertical suites",
		completionNotes: [
			"Auto (transport) requires make/model/year; RE requires rooms/area_sqm.",
			"getCategoryAttributeSchema query + attributes on Listing/ListingCard."
		],
		qaEvidence: {"1":"test/Marketplace.test.mo","2":"src/backend/lib/CategoryCatalog.mo","3":"src/frontend/src/components/marketplace/CategoryAttributeFields.tsx"},
	},
	"E11.S5": {
		reconciledAt: "2026-05-23",
		fileList: [
			"src/backend/lib/Engagement.mo",
			"src/backend/lib/Notifications.mo",
			"src/backend/lib/Marketplace.mo",
			"src/backend/types.mo",
			"src/backend/mixins/engagement-api.mo",
			"src/backend/mixins/marketplace-api.mo",
			"src/backend/mixins/messaging-api.mo",
			"src/backend/main.mo",
			"src/frontend/src/components/marketplace/SavedSearchesPanel.tsx",
			"src/frontend/src/contexts/NotificationContext.tsx",
			"src/frontend/src/lib/engagementActor.ts",
			"src/frontend/src/i18n/index.ts",
			"test/Engagement.test.mo"
		],
		tasks: "- [x] **Backend**\\n  - [x] `src/backend/mixins/engagement-api.mo` setSavedSearchAlerts\\n  - [x] `src/backend/mixins/messaging-api.mo` shared Notifications helper\\n  - [x] `src/backend/lib/Engagement.mo` match + notify on createListing\\n- [x] **Frontend**\\n  - [x] SavedSearchesPanel alert toggle\\n  - [x] NotificationContext polls saved_search_match\\n- [x] **Security:** Auth.assertNotAnonymous and validation on touched endpoints\\n- [x] **Testing:**\\n  - [x] `test/Engagement.test.mo`",
		completionNotes: [
			"SavedSearch.alertsEnabled with setSavedSearchAlerts endpoint.",
			"createListing triggers in-app saved_search_match notifications for matching enabled searches.",
			"Frontend toggle + 30s polling via getTradeNotifications."
		],
		qaEvidence: {"1":"test/Engagement.test.mo","2":"src/backend/lib/Engagement.mo","3":"src/frontend/src/components/marketplace/SavedSearchesPanel.tsx"},
	},
};
