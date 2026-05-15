// Lightweight i18n — supports Ukrainian (uk) and English (en).
// Auto-detects from navigator.language, falls back to 'en'.

export type Locale = "uk" | "en";

export function detectLocale(): Locale {
  const lang = (typeof navigator !== "undefined" && navigator.language) || "en";
  // Matches "uk", "uk-UA", "uk_UA" etc.
  return lang.toLowerCase().startsWith("uk") ? "uk" : "en";
}

// ─── Translation dictionary ────────────────────────────────────────────────

const translations = {
  en: {
    // Navigation
    "nav.browse": "Browse",
    "nav.myTrades": "My Trades",
    "nav.sell": "Sell",
    "nav.admin": "Admin",
    "nav.jurors": "Juror Board",
    "nav.profile": "My Profile",
    "nav.connect": "Connect Identity",
    "nav.connecting": "Connecting…",
    "nav.signOut": "Sign out",
    "nav.skipToContent": "Skip to main content",
    "nav.badge_trades_action": "trades need action",
    "nav.badge_unread_messages": "unread messages",

    // Hero
    "hero.badge": "Decentralized P2P Marketplace",
    "hero.title": "Buy & Sell with Crypto —",
    "hero.titleHighlight": "Securely",
    "hero.subtitle":
      "Peer-to-peer trading with secure payment confirmation. Pay with USDT or USDC on any major blockchain — no middlemen, no banks.",
    "hero.browseCta": "Browse Listings",
    "hero.loginCta": "Log in with Internet Identity",
    "hero.welcomeBack": "Welcome back",

    // Listings
    "listings.featured": "Featured Listings",
    "listings.featuredSub": "Latest items from verified sellers",
    "listings.viewAll": "View all",
    "listings.viewAllListings": "View all listings",
    "listings.noListings": "No listings yet",
    "listings.noListingsFirst": "Be the first to post!",
    "listings.postFirst": "Post a Listing",
    "listings.loadFailed": "Failed to load listings. Please try again later.",
    "listings.found": "listing",
    "listings.foundPlural": "listings",
    "listings.found.suffix": "found",
    "listings.searching": "Searching…",
    "listings.noFound": "No listings found",
    "listings.noFoundSub": "Try adjusting your search or filters",
    "listings.clearFilters": "Clear all filters",
    "listings.loadMore": "Load more",
    "listings.loadFailed.short": "Failed to load listings",
    "listings.loadFailed.retry": "Please try again later",

    // How it works
    "hiw.title": "How It Works",
    "hiw.subtitle": "Three simple steps to your next secure crypto trade",
    "hiw.step1.title": "Post a Listing",
    "hiw.step1.desc":
      "Describe your item, set a price in crypto, add photos and shipping options. Your listing goes live instantly.",
    "hiw.step2.title": "Agree on Price & Payment",
    "hiw.step2.desc":
      "Buyer initiates a trade and selects a supported token. Both parties confirm the deal before funds move.",
    "hiw.step3.title": "Trade with Secure Confirmation",
    "hiw.step3.desc":
      "Both parties manually confirm the transaction. Dispute support available if anything goes wrong.",

    // Trust
    // TODO: rename key when backend contract changes
    "trust.escrow": "Trade Protection",
    "trust.identity": "Internet Identity Auth",
    "trust.multiToken": "Multi-Token Support",

    // Trust tiers
    "trust.tier.new": "New",
    "trust.tier.bronze": "Bronze",
    "trust.tier.silver": "Silver",
    "trust.tier.gold": "Gold",

    // Trade statuses
    "trade.status.pending": "Trade initiated",
    "trade.status.funded": "Awaiting payment",
    "trade.status.buyer_confirmed": "Awaiting seller confirmation",
    "trade.status.payment_verified": "Payment confirmed — completing",
    "trade.status.complete": "Trade complete",
    "trade.status.refunded": "Refunded",
    "trade.status.disputed": "Under dispute",
    "trade.status.cancelled": "Trade cancelled",
    "trade.status.awaiting_approval": "Awaiting Approval",
    "trade.status.verified": "Verified",

    // Item conditions
    "condition.new": "New",
    "condition.likeNew": "Like New",
    "condition.good": "Good",
    "condition.fair": "Fair",
    "condition.poor": "Poor",

    // Condition descriptions
    "condition.new.desc": "Unused, original packaging",
    "condition.likeNew.desc": "Used once or twice, no signs of use",
    "condition.good.desc": "Minor signs of use, fully functional",
    "condition.fair.desc": "Visible wear but works perfectly",
    "condition.poor.desc": "Heavy wear, may need repair",

    // Carriers
    "carrier.nova_poshta": "Nova Poshta",
    "carrier.ukrposhta": "Ukrposhta",
    "carrier.meest": "Meest Express",
    "carrier.self_pickup": "Self Pickup",
    "carrier.digital": "Digital Delivery",

    // Categories
    "category.electronics": "Electronics",
    "category.clothing": "Clothing & Apparel",
    "category.books": "Books",
    "category.digital": "Digital Goods",
    "category.services": "Services",
    "category.other": "Other",

    // Create listing
    "create.title": "Post a Listing",
    "create.titleEdit": "Edit Listing",
    "create.subtitle": "Fill in the details to list your item for sale",
    "create.subtitleEdit": "Update your listing details below",
    "create.signInRequired": "Sign in to post a listing",
    "create.signInDesc":
      "You need to be signed in with Internet Identity to create or edit listings.",
    "create.connect": "Connect with Internet Identity",
    "create.step.basic": "Basic Info",
    "create.step.pricing": "Pricing & Shipping",
    "create.step.photos": "Photos",
    "create.publish": "Publish Listing",
    "create.update": "Update Listing",
    "create.publishing": "Publishing...",
    "create.updating": "Updating...",
    "create.deactivate": "Deactivate",
    "create.continue": "Continue",
    "create.back": "Back",
    "create.connecting": "Connecting…",
    "create.connectingWait": "Please wait while we connect to the blockchain",
    "create.notConnected": "Not connected. Please refresh the page.",
    "create.photosStillUploading": "Please wait for photos to finish uploading",
    "create.photosHaveErrors": "Remove failed photos and try again",
    "create.retryPhotoHint":
      "Click the Retry button on failed photos, or remove and re-add them",
    "create.noPhotos": "Please add at least one photo",
    "create.photoUrlsMissing":
      "Photo upload incomplete — try removing and re-adding photos",
    "create.submitFailed": "Failed to publish listing",
    "create.updateFailed": "Failed to update listing",
    "create.error.noProfile":
      "Please create your profile first before publishing a listing",
    "create.error.banned": "Your account has been suspended",
    "create.error.rateLimited":
      "Too many requests — please wait a moment and try again",
    "create.field.title": "Title",
    "create.field.category": "Category",
    "create.field.condition": "Condition",
    "create.field.description": "Description",
    "create.field.price": "Price",
    "create.field.location": "Location",
    "create.field.carrier": "Shipping carrier",
    "create.field.photos": "Photos",
    "create.field.digitalItem": "Digital item",
    "create.field.digitalItemDesc":
      "Toggle on if you're selling a digital file or online service",
    "create.field.digitalUrl": "Digital file URL",
    "create.placeholder.title": "What are you selling?",
    "create.placeholder.category": "Select a category",
    "create.placeholder.description":
      "Describe your item in detail — condition, features, what's included...",
    "create.placeholder.location": "City, Region",
    "create.review.title": "Review",
    "create.review.carrier": "Carrier",
    "create.photos.upload": "Upload photos",
    "create.photos.uploadDesc":
      "First photo is the cover. Drag thumbnails to reorder.",
    "create.photos.dropzone": "Drag & drop here, or",
    "create.photos.browse": "click to browse",
    "create.photos.hint":
      "Up to {max} images · JPG, PNG, WebP, HEIC · Max 10 MB each",
    "create.photos.uploading": "Uploading {count} photo(s)…",
    "create.photos.errors":
      "{count} photo(s) failed to upload. Remove and try again.",
    "create.photos.cover": "Cover",
    "create.photos.uploadFailedFallback": "Upload failed",
    "create.photos.retryBtn": "Retry",
    "create.photos.removeBtn": "Remove photo",
    "create.published": "Listing published!",
    "create.updated": "Listing updated successfully",
    "create.deactivated": "Listing deactivated",
    "create.deactivateFailed": "Failed to deactivate",
    "create.error.generic": "Something went wrong",
    "create.error.uploadFailed": "Photo upload failed",
    "create.error.storageUnavailable":
      "Photo storage is temporarily unavailable. Please refresh the page and try again.",
    "create.validation.title": "Title is required",
    "create.validation.titleMax": "Max {max} characters",
    "create.validation.category": "Select a category",
    "create.validation.condition": "Select a condition",
    "create.validation.description": "Description is required",
    "create.validation.digitalUrl": "Digital file URL is required",
    "create.validation.price": "Enter a valid price greater than 0",
    "create.validation.location": "Location is required",
    "create.validation.carrier": "Select a shipping carrier",
    "create.validation.photosUploading": "Wait for photos to finish uploading",
    "create.validation.photosErrors": "Remove failed photos and try again",
    "create.validation.photosMin": "Add at least one photo",
    "create.photos.waitForUpload": "Wait for all photos to finish uploading",
    "create.photos.fixFailedUploads":
      "Some photos failed to upload. Remove or retry them before publishing.",

    // Edit mode
    "create.editMode.heading": "Edit Listing",
    "create.editMode.saveBtn": "Save Changes",
    "create.editMode.cancelBtn": "Cancel",
    "create.editMode.discardConfirm.title": "Discard changes?",
    "create.editMode.discardConfirm.description":
      "Any changes you made will be lost.",
    "create.editMode.discardConfirm.confirm": "Discard",
    "create.editMode.discardConfirm.keepEditing": "Keep Editing",
    "create.editMode.notOwnerError": "You can only edit your own listings.",
    "create.editMode.loadError": "Could not load this listing for editing.",
    "create.editMode.backToListing": "Back to Listing",

    // Listing detail
    "detail.breadcrumb.listings": "Listings",
    "detail.paymentMethods": "Payment methods",
    "detail.shipping": "Shipping options",
    "detail.buyNow": "Buy Now",
    "detail.signInToBuy": "Sign in to Buy",
    "detail.selectShippingAndBuy": "Select Shipping & Buy",
    "detail.proceedCheckout": "Proceed to Checkout",
    // TODO: rename key when backend contract changes
    "detail.escrowNote":
      "Both parties have agreed to the trade terms. Complete your manual steps above.",
    "detail.removeListingBtn": "Remove Listing",
    "detail.removeListingConfirm": "Remove this listing?",
    "detail.removeListingDesc":
      "This action will remove the listing for all users. It cannot be undone.",
    "detail.cancel": "Cancel",
    "detail.remove": "Remove",
    "detail.removing": "Removing…",
    "detail.notFound": "Listing not found",
    "detail.notFoundDesc":
      "This listing may have been removed or doesn't exist.",
    "detail.browseListings": "Browse listings",
    "detail.description": "Description",
    "detail.noDescription": "No description available for this listing.",
    "detail.verified": "Verified",
    "detail.reputation": "reputation",
    "detail.marketplaceMember": "Marketplace member",
    "detail.removedSuccess": "Listing removed",
    "detail.removedError": "Failed to remove listing",
    "detail.carousel.prev": "Previous photo",
    "detail.carousel.next": "Next photo",
    "detail.carousel.thumb": "View photo {n}",
    "detail.payment": "Payment methods",

    // Listing detail — seller visibility & owner actions
    "detail.viewSellerProfile": "View seller profile",
    "detail.editListing": "Edit",
    "detail.deactivateListing": "Deactivate",
    "detail.deactivateConfirm": "Deactivate listing?",
    "detail.deactivateDesc":
      "Are you sure you want to deactivate this listing? It will disappear from search.",
    "detail.deactivating": "Deactivating…",
    "detail.otherListings": "Other listings by seller",
    "detail.allListings": "All listings",
    "detail.noOtherListings": "No other listings",
    "detail.deactivateSuccess": "Listing deactivated",
    "detail.deactivateError": "Failed to deactivate listing",
    "detail.deactivateErrorGeneric": "Error deactivating",

    // Shipping selector
    "shipping.compare.title": "Compare Shipping",
    "shipping.compare.subtitle": "Live rates from all carriers",
    "shipping.compare.loading": "Fetching carrier rates…",
    "shipping.compare.loadingHint": "Querying 3 carriers, takes 2–3 seconds",
    "shipping.compare.error": "Failed to load shipping options",
    "shipping.compare.retry": "Try again",
    "shipping.compare.selectCarrier": "Select a carrier to continue",
    "shipping.compare.selected": "Selected",
    "shipping.compare.unavailable": "Unavailable",
    "shipping.compare.demoPrice": "Demo price",
    "shipping.compare.noCoverage": "No coverage",
    "shipping.compare.noApiKey": "API key not configured",
    "shipping.compare.days": "days",
    "shipping.compare.day": "day",
    "shipping.compare.cost": "Cost",
    "shipping.compare.delivery": "Delivery",
    "shipping.compare.fastest": "Fastest",
    "shipping.compare.cheapest": "Cheapest",
    "shipping.compare.selectBtn": "Select",
    "shipping.compare.weight": "Weight (kg)",
    "shipping.compare.from": "From city",
    "shipping.compare.to": "To city",
    "shipping.compare.calculate": "Get Rates",
    "shipping.compare.calculating": "Getting rates…",

    // Package details & branch selector (Nova Poshta)
    "shipping.packageDetails": "Package Details",
    "shipping.weight": "Weight (kg)",
    "shipping.length": "Length (cm)",
    "shipping.width": "Width (cm)",
    "shipping.height": "Height (cm)",
    "shipping.places": "Number of packages",
    "shipping.volumetricWeight": "Volumetric weight: {0} kg",
    "shipping.branchSearch": "Search branch",
    "shipping.branchSearchPlaceholder": "Start typing to search...",
    "shipping.branchLoading": "Loading branches...",
    "shipping.branchNoResults": "No branches found",
    "shipping.branchSelect": "Select a branch",
    "shipping.lockerSizeError":
      "Item too large for locker (max 40×60×30 cm, 20 kg)",
    "shipping.pickupOnly.title": "Self pickup only",
    "shipping.pickupOnly.subtitle": "Carrier delivery is temporarily disabled.",
    "shipping.pickupOnly.description":
      "The buyer and seller arrange pickup details after the trade starts.",
    "shipping.pickupOnly.lockedNotice":
      "Nova Poshta, Ukrposhta and Meest are disabled until the project owner explicitly asks to re-enable delivery integrations.",
    "shipping.pickupOnly.select": "Use self pickup",

    // Trade TTN (carrier waybill)
    "trade.ttnCreate": "Create Waybill",
    "trade.ttnRetry": "Retry TTN Creation",
    "trade.ttnCreating": "Creating waybill...",
    "trade.ttnSuccess": "Waybill created",
    "trade.ttnFailed": "Waybill creation failed",
    "trade.manualTTN": "Enter tracking number manually",
    "trade.manualTTNSave": "Save tracking number",
    "trade.ttnNumber": "Tracking number",
    "trade.ttnSection.nova_poshta": "Nova Poshta Waybill",
    "trade.ttnSection.ukrposhta": "Ukrposhta Waybill",
    "trade.ttnSection.meest": "Meest Waybill",
    "trade.ttnSection.default": "Shipping Waybill",
    "trade.confirmDeliveryReleaseFunds": "Confirm Delivery & Release Funds",

    // ShippingTracker
    "shipping.trackingTitle": "Tracking",
    "shipping.carrierLabel": "Carrier",
    "shipping.refreshButton": "Refresh Tracking",
    "shipping.refreshPrompt":
      "Press refresh to fetch the latest tracking status",
    "shipping.lastUpdated": "Last updated:",
    "shipping.refreshing": "Refreshing…",
    "shipping.fetchError": "Could not fetch tracking info. Try again later.",
    "shipping.requestFailed": "Tracking request failed",

    // Footer
    "footer.builtWith": "Built with love using",

    // Common
    "common.sort.newest": "Newest",
    "common.sort.priceAsc": "Price: Low → High",
    "common.sort.priceDesc": "Price: High → Low",

    // Filter panel
    "filter.title": "Filters",
    "filter.reset": "Reset",
    "filter.category": "Category",
    "filter.priceRange": "Price Range",
    "filter.condition": "Condition",
    "filter.shipping": "Shipping",
    "filter.price.min": "Minimum price",
    "filter.price.max": "Maximum price",
    "filter.listings": "Listing filters",
    "filter.token.title": "Token",
    "filter.token.any": "All tokens",
    "filter.token.USDT_TRC20": "USDT-TRC20",
    "filter.token.USDT_BEP20": "USDT-BEP20",
    "filter.token.USDT_ERC20": "USDT-ERC20",
    "filter.token.USDC_ERC20": "USDC-ERC20",
    "filter.price.errorRange": "Minimum price cannot exceed maximum price",
    "filter.chips.clearAll": "Clear all",
    "filter.activeFilters": "Active filters",
    "filter.any": "Any",

    // Trades page
    "trades.title": "My Trades",
    "trades.subtitle": "Track all your active and completed trades",
    "trades.tab.buying": "Buying",
    "trades.tab.selling": "Selling",
    "trades.empty.buying.title": "No purchases yet",
    "trades.empty.buying.desc": "Browse listings and initiate your first trade",
    "trades.empty.selling.title": "No sales yet",
    "trades.empty.selling.desc": "Create a listing to start selling",
    "trades.empty.browseCta": "Browse Listings",
    "trades.empty.postCta": "Post a Listing",

    // Search bar
    "search.placeholder": "Search listings…",
    "search.ariaLabel": "Search listings",
    "search.clearAriaLabel": "Clear search",

    // Payment Verification Widget
    "verify.title": "Verify Payment on Blockchain",
    "verify.subtitle":
      "Paste your transaction hash to automatically verify the payment on-chain.",
    "verify.txHashLabel": "Transaction Hash",
    "verify.txHashPlaceholder": "0x... or TxID",
    "verify.networkLabel": "Network",
    "verify.networkAutoDetected": "Auto-detected from payment token",
    "verify.submitBtn": "Verify on Blockchain",
    "verify.verifying": "Verifying…",
    "verify.statusPending": "Verification in progress…",
    "verify.statusPendingDesc":
      "Checking the blockchain for your transaction. This may take up to 1 minute.",
    "verify.statusVerified": "Payment Verified",
    "verify.statusVerifiedDesc":
      "Your payment has been confirmed on-chain. The seller will be notified.",
    "verify.statusFailed": "Verification Failed",
    "verify.statusFailedRetry": "Try again with a different hash",
    "verify.blockNumber": "Block",
    "verify.confirmedAmount": "Confirmed Amount",
    "verify.confirmedRecipient": "Recipient",
    "verify.sellerCanConfirm": "The seller can now confirm receipt.",
    "verify.errorSubmit": "Failed to submit verification. Please try again.",

    // Payment networks
    "network.USDT_TRC20": "USDT / Tron (TRC20)",
    "network.USDT_BEP20": "USDT / BNB Chain (BEP20)",
    "network.USDC_SPL": "USDC / Solana (SPL)",
    "network.USDC_ERC20": "USDC / Ethereum (ERC20)",
    "network.USDT_ERC20": "USDT / Ethereum (ERC20)",
    "network.USDC_BEP20": "USDC / BNB Chain (BEP20)",
    "network.USDC_POLYGON": "USDC / Polygon",
    "network.USDC_AVALANCHE": "USDC / Avalanche",
    "network.USDT_POLYGON": "USDT Polygon",
    "network.USDT_AVALANCHE": "USDT Avalanche",
    "network.USDT": "USDT",
    "network.USDC": "USDC",
    "network.TRC20": "TRC20 (Tron)",
    "network.BEP20": "BEP20 (BSC)",
    "network.ERC20": "ERC20 (Ethereum)",
    "network.SPL": "SPL (Solana)",
    "network.Polygon": "Polygon",
    "network.Avalanche": "Avalanche",
    "network.selectTitle": "Select {token} Network",

    // Location picker
    "location.selectOblast": "Select Oblast",
    "location.selectCity": "Select City",
    "location.selectOblastFirst": "Select oblast first",
    "location.clearSelection": "Clear",
    "location.legacyPrefix": "Legacy:",
    "location.failedToLoadRegions": "Failed to load regions",

    // Token selector
    "token.selectBase": "Select Token",
    "token.changeNetwork": "Change Network",

    // Trade timeline (keys keep "escrow.*" names for backward compatibility)
    // TODO: rename key when backend contract changes
    "escrow.step.accepted.label": "Trade Accepted",
    "escrow.step.accepted.desc": "Both parties agreed on terms",
    "escrow.step.pending.label": "Awaiting Payment",
    "escrow.step.pending.desc": "Buyer sends payment off-chain",
    "escrow.step.funded.label": "Payment Sent",
    "escrow.step.funded.desc": "Buyer confirmed payment sent",
    "escrow.step.buyer_confirmed.label": "Seller Confirmed",
    "escrow.step.buyer_confirmed.desc": "Seller confirmed receipt",
    "escrow.step.complete.label": "Trade Complete",
    "escrow.step.complete.desc": "Funds released, trade closed",
    "escrow.terminal.disputed.label": "Dispute Opened",
    "escrow.terminal.disputed.desc": "Under moderator review",
    "escrow.terminal.refunded.label": "Refunded",
    "escrow.terminal.refunded.desc": "Payment returned to buyer",
    "escrow.terminal.cancelled.label": "Cancelled",
    "escrow.terminal.cancelled.desc": "Trade cancelled by mutual agreement",

    // Chat
    "chat.title": "Chat",
    "chat.unread": "{count} unread",
    "chat.empty": "No messages yet. Start the conversation.",
    "chat.placeholder": "Type a message…",
    "chat.attachment.placeholder": "Paste attachment URL…",
    "chat.attachment.ariaLabel": "Add attachment",
    "chat.send.ariaLabel": "Send",
    "chat.sendError": "Failed to send message",
    "chat.attachment.link": "Attachment",
    "chat.uploadPhoto": "Upload photo",
    "chat.uploadVideo": "Upload video",
    "chat.uploadFile": "Upload file",
    "chat.dragDropHint": "Drop files here to upload",
    "chat.linkPreview.loading": "Loading preview...",
    "chat.linkPreview.error": "Could not load preview",
    "chat.gallery.close": "Close",
    "chat.attachments.max": "Maximum 10 attachments",
    "chat.uploading": "Uploading...",
    "chat.removeAttachment": "Remove attachment",
    "chat.dropOverlay": "Drop files here",

    // Reputation stats
    "reputation.completedTrades": "Completed Trades",
    "reputation.averageRating": "Average Rating",
    "reputation.trustLevel": "Trust Level",
    "reputation.disputeRate": "Dispute Rate",
    "reputation.ratingAriaLabel": "{value} out of 5 stars",

    // Admin — Phase 2 metrics
    "admin.metrics.title": "Platform Metrics",
    "admin.metrics.lastUpdated": "Last updated",
    "admin.metrics.secondsAgo": "seconds ago",
    "admin.metrics.refresh": "Refresh",
    "admin.metrics.refreshLabel": "Refresh platform metrics",
    "admin.metrics.autoRefresh": "Auto-refresh every 60s",
    "admin.metrics.swapSuccess": "Swap Success Rate",
    "admin.metrics.avgSettlement": "Avg. Settlement Time",
    "admin.metrics.disputeRate": "Dispute Rate",
    "admin.metrics.disputeTarget": "≤ 3% target",
    "admin.metrics.mau": "Monthly Active Users",
    "admin.metrics.activeUsers24h": "Active Users (24h)",
    "admin.metrics.minutes": "min",
    "admin.metrics.totalTrades": "Total Trades",
    "admin.metrics.activeTrades": "Active Trades",
    "admin.metrics.totalVolume": "Total Volume",
    "admin.metrics.totalRevenue": "Total Revenue",
    "admin.metrics.disputeRatePct": "Dispute Rate",
    "admin.metrics.p95Latency": "P95 Latency",
    "admin.metrics.errorRate": "Error Rate",
    "admin.metrics.cyclesBalanceTril": "Cycles Balance",
    "admin.metrics.volumeGraph": "Trades per Day (Last 7 Days)",
    "admin.alerts.cyclesLow":
      "Cycles balance is below threshold! Top up required.",
    "admin.alerts.errorRateHigh": "Error rate exceeds threshold!",
    "admin.settings.alertThresholds": "Alert Thresholds",
    "admin.settings.cyclesThreshold": "Cycles Balance Threshold (T)",
    "admin.settings.errorRateThreshold": "Error Rate Threshold (%)",
    "admin.cycles.title": "Cycles Status",
    "admin.cycles.balance": "Current Balance",
    "admin.cycles.budget": "% of Budget",
    "admin.cycles.dailyBurn": "Est. Daily Burn",
    "admin.cycles.warning": "Low Cycles",
    "admin.cycles.ok": "Healthy",
    "admin.cycles.progressLabel": "Cycles budget used",
    "admin.errorLog.title": "Error Log",
    "admin.errorLog.filter": "Filter by severity",
    "admin.errorLog.all": "All severities",
    "admin.errorLog.timestamp": "Timestamp",
    "admin.errorLog.module": "Module",
    "admin.errorLog.function": "Function",
    "admin.errorLog.severity": "Severity",
    "admin.errorLog.message": "Message",
    "admin.errorLog.empty": "No error log entries",
    "admin.errorLog.emptyFiltered": "No entries match the selected filter",
    "admin.errorLog.page": "Page",
    "admin.errorLog.of": "of",
    "admin.errorLog.prev": "Previous",
    "admin.errorLog.next": "Next",
    "admin.modules.title": "Module Metrics",
    "admin.modules.name": "Module",
    "admin.modules.requests": "Requests",
    "admin.modules.errors": "Errors",
    "admin.modules.memory": "Memory",
    "admin.modules.cycles": "Cycles Consumed",
    "admin.modules.chart": "Errors per Module",
    "admin.severity.info": "Info",
    "admin.severity.warning": "Warning",
    "admin.severity.error": "Error",
    "admin.severity.critical": "Critical",

    // Admin panel tabs & UI
    "admin.panel.title": "Admin Panel",
    "admin.tab.overview": "Overview",
    "admin.tab.users": "Users",
    "admin.tab.disputes": "Disputes",
    "admin.tab.listings": "Listings",
    "admin.tab.audit": "Audit Log",
    "admin.tab.settings": "Settings",
    "admin.tab.nav.label": "Admin navigation",
    "admin.settings.adminOnly": "Only admins can manage system settings.",
    "admin.listings.title": "Listing Moderation",
    "admin.listings.noFlagged": "No flagged listings",
    "admin.listings.allClean": "All listings look clean.",
    "admin.listings.colTitle": "Title",
    "admin.listings.colSeller": "Seller",
    "admin.listings.colPrice": "Price",
    "admin.listings.colActions": "Actions",
    "admin.listings.remove": "Remove",
    "admin.listings.removing": "Removing…",
    "admin.signInDesc":
      "Sign in with Internet Identity to access the admin panel.",
    "admin.signIn": "Sign in with Internet Identity",

    // Admin user management
    "admin.users.title": "User Management",
    "admin.users.empty": "No users found.",
    "admin.users.col.principal": "Principal",
    "admin.users.col.username": "Username",
    "admin.users.col.role": "Role",
    "admin.users.col.trust": "Trust",
    "admin.users.col.status": "Status",
    "admin.users.col.score": "Score",
    "admin.users.col.registered": "Registered",
    "admin.users.col.actions": "Actions",
    "admin.users.status.active": "Active",
    "admin.users.status.suspended": "Suspended",
    "admin.users.status.banned": "Banned",
    "admin.users.action.suspend": "Suspend",
    "admin.users.action.ban": "Ban",
    "admin.users.page": "Page",
    "admin.users.of": "of",
    "admin.users.modal.ban": "Ban User",
    "admin.users.modal.suspend": "Suspend User",
    "admin.users.modal.promote": "Promote to Moderator",
    "admin.users.modal.user": "User:",
    "admin.users.modal.suspendDays": "Suspend duration (days)",
    "admin.users.modal.reason": "Reason",
    "admin.users.modal.reasonPlaceholder": "Enter reason…",
    "admin.users.modal.promoteDesc":
      "This user will be able to review disputes and access moderation tools.",
    "admin.users.modal.cancel": "Cancel",
    "admin.users.modal.confirm": "Confirm",
    "admin.users.modal.processing": "Processing…",
    "admin.users.banned": "User banned",
    "admin.users.banFailed": "Failed to ban user",
    "admin.users.suspended": "User suspended",
    "admin.users.suspendFailed": "Failed to suspend user",
    "admin.users.promoted": "User promoted to moderator",
    "admin.users.promoteFailed": "Failed to promote user",

    // Sidebar
    "sidebar.toggle": "Toggle Sidebar",

    // Pagination
    "pagination.label": "pagination",
    "pagination.prev": "Go to previous page",
    "pagination.next": "Go to next page",
    "pagination.previous": "Previous",
    "pagination.next.label": "Next",
    "pagination.more": "More pages",

    // Juror Dashboard
    "jurors.pageTitle": "Juror Board",
    "jurors.pageSubtitle": "Help resolve disputes fairly and earn reputation",
    "jurors.joinTitle": "Join the Jury Pool",
    "jurors.joinDesc":
      "Registered jurors review evidence and vote on disputed trades. Build reputation and help keep the marketplace fair.",
    "jurors.joinBtn": "Register as Juror",
    "jurors.joining": "Registering…",
    "jurors.joinStakeLabel": "Stake amount (optional, improves trust ranking)",
    "jurors.leavePool": "Leave Jury Pool",
    "jurors.leaving": "Leaving…",
    "jurors.leaveConfirm": "Leave jury pool?",
    "jurors.leaveConfirmDesc":
      "You will be removed from all pending cases. Active votes are retained.",
    "jurors.stats.title": "Your Stats",
    "jurors.stats.resolved": "Resolved",
    "jurors.stats.successRate": "Success Rate",
    "jurors.stats.active": "Active Cases",
    "jurors.activeCases": "Active Cases",
    "jurors.noCases": "No active cases",
    "jurors.noCasesDesc":
      "You have no pending dispute cases right now. Check back later.",
    "jurors.caseDispute": "Dispute",
    "jurors.caseTrade": "Trade",
    "jurors.caseDeadline": "Deadline",
    "jurors.caseStatus.pending": "Pending vote",
    "jurors.caseStatus.voted": "Voted",
    "jurors.voteFor": "Vote",
    "jurors.voteBuyer": "Buyer wins",
    "jurors.voteSeller": "Seller wins",
    "jurors.voteConfirmTitle": "Confirm your vote",
    "jurors.voteConfirmDesc":
      "This action is irreversible. Your vote will be recorded on-chain.",
    "jurors.voteReasoning": "Reasoning",
    "jurors.voteReasoningPlaceholder":
      "Briefly explain your decision based on the evidence…",
    "jurors.submitVote": "Submit Vote",
    "jurors.submitting": "Submitting…",
    "jurors.voteSubmitted": "Vote submitted",
    "jurors.consensus": "jurors voted",
    "jurors.evidenceSummary": "Evidence & Description",
    "jurors.noEvidence": "No evidence provided.",
    "jurors.loadError": "Failed to load juror dashboard",
    "jurors.voteError": "Failed to submit vote",
    "jurors.registrationError": "Failed to register",
    "jurors.unregisterError": "Failed to leave jury pool",
    "jurors.signInRequired": "Sign in to access the Juror Board",
    "jurors.signInDesc":
      "You need to be authenticated with Internet Identity to participate.",
    "jurors.signIn": "Connect with Internet Identity",
    "jurors.adminTitle": "Jury Pool — Admin View",
    "jurors.adminSubtitle": "All registered jurors and their performance stats",
    "jurors.admin.principal": "Principal",
    "jurors.admin.resolved": "Resolved",
    "jurors.admin.active": "Active",
    "jurors.admin.successRate": "Success %",
    "jurors.admin.staked": "Staked",
    "jurors.admin.registered": "Registered",
    "jurors.admin.remove": "Remove",
    "jurors.admin.removing": "Removing…",
    "jurors.admin.noJurors": "No jurors registered",
    "jurors.timeLeft": "Time left",
    "jurors.expired": "Expired",
    "jurors.expandCase": "Expand case details",
    "jurors.collapseCase": "Collapse case details",
    // Juror join feature highlights
    "jurors.feature.fairVoting": "Fair voting",
    "jurors.feature.onChain": "On-chain results",
    "jurors.feature.reputation": "Earn reputation",
    // Vote live feedback
    "jurors.voteSubmittedLive": "Your vote has been submitted successfully.",

    // Header balance (Phase 3)
    "header.balance": "Balance",
    "header.balance.loading": "Loading…",
    "header.balance.error": "Unavailable",
    "header.balance.refreshing": "Refreshing…",

    // governance.* namespace (Phase 3)
    "governance.pageTitle": "Governance",
    "governance.pageSubtitle":
      "Vote on proposals and shape the future of the marketplace",
    "governance.proposals.title": "Active Proposals",
    "governance.proposals.empty": "No active proposals",
    "governance.proposals.emptyDesc":
      "There are no proposals open for voting right now.",
    "governance.proposals.create": "Create Proposal",
    "governance.proposals.id": "Proposal #",
    "governance.proposals.type": "Type",
    "governance.proposals.status": "Status",
    "governance.proposals.votes": "Votes",
    "governance.proposals.deadline": "Voting deadline",
    "governance.proposals.quorum": "Quorum",
    "governance.proposals.loading": "Loading proposals…",
    "governance.proposals.loadError": "Failed to load proposals",
    "governance.vote.title": "Cast Vote",
    "governance.vote.for": "Vote For",
    "governance.vote.against": "Vote Against",
    "governance.vote.abstain": "Abstain",
    "governance.vote.confirm": "Confirm Vote",
    "governance.vote.submitting": "Submitting…",
    "governance.vote.submitted": "Vote submitted",
    "governance.vote.alreadyVoted": "You have already voted",
    "governance.vote.notEligible": "You are not eligible to vote",
    "governance.vote.error": "Failed to submit vote",
    "governance.vote.reasoning": "Reasoning (optional)",
    "governance.vote.reasoningPlaceholder": "Explain your decision…",
    "governance.create.title": "Create Proposal",
    "governance.create.typeLabel": "Proposal type",
    "governance.create.type.feeChange": "Fee Change",
    "governance.create.type.paramUpdate": "Parameter Update",
    "governance.create.type.treasuryWithdrawal": "Treasury Withdrawal",
    "governance.create.type.emergencyPause": "Emergency Pause",
    "governance.create.type.resume": "Resume Platform",
    "governance.create.descLabel": "Description",
    "governance.create.descPlaceholder": "Describe what this proposal changes…",
    "governance.create.amountLabel": "Amount (USD cents)",
    "governance.create.recipientLabel": "Recipient address",
    "governance.create.submit": "Submit Proposal",
    "governance.create.submitting": "Submitting…",
    "governance.create.success": "Proposal submitted",
    "governance.create.error": "Failed to create proposal",
    "governance.treasury.title": "Treasury",
    "governance.treasury.balance": "Total Balance",
    "governance.treasury.usdt": "USDT Balance",
    "governance.treasury.usdc": "USDC Balance",
    "governance.treasury.totalTrades": "Total Trades",
    "governance.treasury.fees": "Accumulated Fees",
    "governance.treasury.loading": "Loading treasury data…",
    "governance.treasury.error": "Failed to load treasury data",
    "governance.history.title": "Execution History",
    "governance.history.empty": "No executed proposals yet",
    "governance.history.proposal": "Proposal",
    "governance.history.type": "Type",
    "governance.history.executedAt": "Executed at",
    "governance.history.outcome": "Outcome",
    "governance.history.loading": "Loading history…",
    "governance.status.active": "Active",
    "governance.status.passed": "Passed",
    "governance.status.rejected": "Rejected",
    "governance.status.executed": "Executed",
    "governance.status.expired": "Expired",
    "governance.status.pending": "Pending",
    "governance.status.cancelled": "Cancelled",

    // vault.balance / vault.chain namespaces (Phase 3)
    "vault.balance.title": "Vault Balances",
    "vault.balance.usdt": "USDT Balance",
    "vault.balance.usdc": "USDC Balance",
    "vault.balance.total": "Total (USD)",
    "vault.balance.loading": "Fetching on-chain balances…",
    "vault.balance.error": "Balance unavailable",
    "vault.balance.lastSync": "Last synced",
    "vault.chain.erc20": "Ethereum (ERC-20)",
    "vault.chain.bep20": "BNB Chain (BEP-20)",
    "vault.chain.trc20": "Tron (TRC-20)",
    "vault.chain.spl": "Solana (SPL)",
    "vault.chain.polygon": "Polygon",
    "vault.chain.avalanche": "Avalanche",

    // Vault
    "vault.title": "My Vault",
    "vault.subtitle": "Deposit addresses derived from your Internet Identity",
    "vault.refreshAll": "Refresh All",
    "vault.disclaimer":
      "These addresses are derived from your Internet Identity. Only send USDT or USDC — sending other tokens may result in permanent loss.",
    "vault.disclaimerLabel": "Important notice about vault deposits",
    "vault.depositAddress": "Deposit Address",
    "vault.addressNotAvailable": "Address not available",
    "vault.copyAddress": "Copy address",
    "vault.refreshBalance": "Refresh balance",
    "vault.lastUpdated": "Updated",
    "vault.fetchError": "Could not load data. Please try again.",
    "vault.balanceError": "Could not load balance. Please try again.",
    "vault.autoRefreshNote": "Balances auto-refresh every 5 minutes",
    "vault.signInRequired": "Sign in to access your Vault",
    "vault.signInDesc":
      "You need to be authenticated with Internet Identity to view your vault addresses and balances.",
    "nav.vault": "Vault",
    "vault.rateLastUpdated": "USDT rate: {rate} · Updated {age}",
    "vault.rateJustNow": "just now",
    "vault.rateMinutesAgo": "{n} min ago",
    "vault.rateNotAvailable": "Stablecoin rates not available",

    // Governance
    "nav.governance": "Governance",
    "gov.pageTitle": "Governance",
    "gov.pageSubtitle": "Vote on proposals and oversee the platform treasury",
    "gov.createProposal": "New Proposal",
    "gov.tab.active": "Active Proposals",
    "gov.tab.history": "Execution History",
    "gov.tab.treasury": "Treasury",
    "gov.noActive": "No active proposals",
    "gov.noActiveDesc": "There are no proposals open for voting right now.",
    "gov.voteBtn": "Vote",
    "gov.loginToVote": "Sign in to participate in governance",
    "gov.voteModalTitle": "Cast Your Vote",
    "gov.currentTally": "Current Tally",
    "gov.voteYes": "Yes",
    "gov.voteNo": "No",
    "gov.yourVote": "Your Vote",
    "gov.submitVote": "Submit Vote",
    "gov.submitting": "Submitting…",
    "gov.cancel": "Cancel",
    "gov.voteError": "Failed to submit vote. Please try again.",
    "gov.createModalTitle": "Create Proposal",
    "gov.proposalType": "Proposal Type",
    "gov.description": "Description",
    "gov.descriptionPlaceholder":
      "Describe the proposal clearly and in detail (min 20 characters)…",
    "gov.descriptionHint": "Minimum 20 characters required",
    "gov.submitProposal": "Submit Proposal",
    "gov.createError": "Failed to create proposal. Please try again.",
    "gov.type.ParameterChange": "Parameter Change",
    "gov.type.TreasuryTransfer": "Treasury Transfer",
    "gov.type.TextResolution": "Text Resolution",
    "gov.typeDesc.ParameterChange":
      "Modify a platform configuration parameter (e.g. fee rate, trade timeout).",
    "gov.typeDesc.TreasuryTransfer":
      "Transfer funds from the platform treasury to a specified address.",
    "gov.typeDesc.TextResolution":
      "A general-purpose resolution or statement recorded on-chain.",
    "gov.status.active": "Active",
    "gov.status.passed": "Passed",
    "gov.status.rejected": "Rejected",
    "gov.status.executed": "Executed",
    "gov.status.expired": "Expired",
    "gov.treasury.title": "Treasury Balance",
    "gov.treasury.balanceNote":
      "Accumulated platform fees collected from completed trades",
    "gov.treasury.recentFees": "Recent Fee Deposits",
    "gov.treasury.noFees": "No fee deposits recorded yet",
    "gov.treasury.colTradeId": "Trade ID",
    "gov.treasury.colAmount": "Amount",
    "gov.treasury.colDate": "Date",
    "gov.history.title": "Execution History",
    "gov.history.empty": "No executed proposals yet",
    "gov.history.colType": "Type",
    "gov.history.colDescription": "Description",
    "gov.history.colStatus": "Status",
    "gov.history.colDate": "Date",

    // Onboarding
    "onboarding.title": "Create Your Profile",
    "onboarding.subtitle":
      "Set up your profile to start buying and selling on the marketplace.",
    "onboarding.anonymityNote":
      "You can use any nickname — no real identity required. Your Internet Identity keeps you pseudonymous.",
    "onboarding.field.displayName": "Display name",
    "onboarding.field.bio": "About you",
    "onboarding.optional": "optional",
    "onboarding.placeholder.displayName": "e.g. CryptoTrader_UA, Alice, etc.",
    "onboarding.placeholder.bio":
      "Tell others a bit about yourself — what you sell, where you are from…",
    "onboarding.avatar.optional": "optional",
    "onboarding.avatar.change": "Change avatar",
    "onboarding.avatar.uploaded": "Avatar saved",
    "onboarding.avatar.uploadFailed": "Avatar upload failed",
    "onboarding.submit": "Create Profile",
    "onboarding.submitting": "Creating…",
    "onboarding.success": "Profile created!",
    "onboarding.footerHint":
      "Your display name will be shown to other users on listings and trades.",
    "onboarding.validation.usernameRequired": "Display name is required",
    "onboarding.validation.usernameMin": "Must be at least {min} characters",
    "onboarding.validation.usernameMax": "Maximum {max} characters",
    "onboarding.error.notAuthenticated": "Please sign in first",
    "onboarding.error.unauthorized": "Not authorized — please sign in again",
    "onboarding.error.saveFailed": "Failed to save profile",

    // Upload errors
    "upload.errorAuthRequired":
      "Authentication required to upload files. Please sign in.",
    "upload.errorFailed": "Photo upload failed. Please try again.",
    "upload.errorInitStorage": "Storage initialization error: ",
    "upload.errorCertStorage": "Storage certification error",
    "upload.error403": "Server rejected upload (403). Details: ",
    "upload.errorEmptyUrl": "getDirectURL returned empty URL",
    // Upload errors — new keys
    "upload.error403Auth":
      "Storage authentication error. Try refreshing the page.",
    "upload.errorCanisterId":
      "Cannot connect to server. Refresh the page or try again later.",
    "upload.errorPreviewDeployment":
      "File uploads are only available on the live site.",
    "upload.errorNetwork":
      "Network error during upload. Check your connection.",
    "upload.previewBanner":
      "Photo upload is only available on the live site. Open the live URL to add photos.",

    // Package details
    "listing.packageDetails": "Package Details",
    "listing.packageWeight": "Weight (kg)",
    "listing.packageLength": "Length (cm)",
    "listing.packageWidth": "Width (cm)",
    "listing.packageHeight": "Height (cm)",
    "listing.packagePlaces": "Pieces",
    "listing.packageVolumetric": "Volumetric weight",
    "listing.packageWeightHint": "Max 30 kg",
    "listing.packageDimHint": "Max 120 cm each",
    "listing.validation.weightRequired": "Weight must be greater than 0",
    "listing.validation.weightMax": "Weight cannot exceed 30 kg",
    "listing.validation.dimMax": "Each dimension cannot exceed 120 cm",

    // Nova Poshta config
    "listing.novaPoshtaConfig": "Nova Poshta Configuration",
    "listing.novaPoshtaEnable": "Enable Nova Poshta delivery",
    "listing.deliveryTypes": "Delivery types",
    "listing.deliveryBranch": "Branch pickup",
    "listing.deliveryCourier": "Courier delivery",
    "listing.deliveryLocker": "Parcel locker",
    "listing.senderBranch": "Sender branch",

    // Ukrposhta config
    "listing.ukrposhtaConfig": "Ukrposhta Configuration",
    "listing.ukrposhtaEnable": "Enable Ukrposhta delivery",
    "listing.ukrposhtaDeliveryTypes": "Delivery types",
    "listing.ukrposhtaBranchToOffice": "Branch to branch",
    "listing.ukrposhtaCourierToDoor": "Courier to door",
    "listing.ukrposhtaOfficeSearch": "Sender office",
    "listing.ukrposhtaOfficeSearchPlaceholder": "Search by city or address…",
    "listing.ukrposhtaOfficeSelect": "Select an office",
    "listing.ukrposhtaOfficeLoading": "Loading offices…",
    "listing.ukrposhtaOfficeNoResults": "No offices found",

    // Meest config
    "listing.meestConfig": "Meest Express Configuration",
    "listing.meestEnable": "Enable Meest Express delivery",
    "listing.meestDeliveryTypes": "Delivery types",
    "listing.meestPudoDelivery": "PUDO pickup point",
    "listing.meestHomeDelivery": "Home delivery",
    "listing.meestPudoSearch": "Sender PUDO",
    "listing.meestPudoSearchPlaceholder": "Search by city or address…",
    "listing.meestPudoSelect": "Select a PUDO",
    "listing.meestPudoLoading": "Loading PUDOs…",
    "listing.meestPudoNoResults": "No PUDOs found",

    // Digital goods — create listing
    "digital.field.fileHash": "File Hash (optional)",
    "digital.field.fileHashPlaceholder": "SHA-256 hash for dispute evidence",
    "digital.field.passwordProtection": "Enable password protection",
    "digital.field.password": "Password",

    // Digital delivery — trade detail
    "digital.delivery.title": "Access Your Digital Item",
    "digital.delivery.fileUrl": "File URL",
    "digital.delivery.copyUrl": "Copy URL",
    "digital.delivery.password": "Password",
    "digital.delivery.copyPassword": "Copy Password",
    "digital.delivery.fileHash": "File Hash (for verification)",
    "digital.delivery.hashNote":
      "Compare this hash with the downloaded file to verify its integrity.",
    "digital.delivery.inspectionCountdown":
      "You have {hours}h {minutes}m to open a dispute if the file is incorrect.",
    "digital.delivery.inspectionExpired":
      "Inspection period ended. Funds have been released to the seller.",

    // Digital dispute
    "digital.dispute.button": "Open Digital Dispute",
    "digital.dispute.title": "Open a Dispute",
    "digital.dispute.reasonItemDiffers": "File is incorrect or missing",
    "digital.dispute.reasonOther": "Other reason",
    "digital.dispute.submit": "Submit Dispute",

    // Liability tracking
    "liability.balance.title": "Liability Balance",
    "liability.balance.zero": "No outstanding liability",
    "liability.balance.positive": "Credit: ${{amount}}",
    "liability.balance.negative":
      "Outstanding liability: ${{amount}}. New listings may be restricted.",
    "liability.history.title": "Liability History",
    "liability.history.empty": "No liability events recorded.",
    "liability.history.col.date": "Date",
    "liability.history.col.amount": "Amount",
    "liability.history.col.reason": "Reason",
    "liability.history.col.trade": "Trade",
    "liability.create.blocked":
      "Listing creation blocked due to outstanding liability.",
    "liability.reason.dispute_lost": "Dispute lost",
    "liability.reason.cancellation_fee": "Cancellation fee",
    "liability.reason.cross_collateral_seizure":
      "Liability repayment (cross-collateral seizure)",

    // Jury dispute status (on TradeDetailPage)
    "disputes.jury.underReview": "Under review by jury",
    "disputes.jury.deadline": "Jury deadline",
    "disputes.jury.deadlineCountdown": "Deadline: {{hours}} hours remaining",
    "disputes.jury.voteTally": "Votes: {{buyer}} buyer / {{seller}} seller",
    "disputes.jury.noConsensus": "Deadline passed — escalated to admin",
    "disputes.jury.escalatedToAdmin": "Escalated to administrator",
    "disputes.jury.noVoteYet": "You have not voted yet",
    "disputes.jury.yourVote": "Your vote: {{choice}}",
    "disputes.jury.reasoningPlaceholder": "Explain your reasoning (required)",
    "disputes.doNotRelease": "Do not release funds — trade is under review",
    "disputes.resolution.buyerWins": "Resolved: Buyer wins",
    "disputes.resolution.sellerWins": "Resolved: Seller wins",
    "disputes.resolution.split": "Resolved: Split decision",
    "disputes.resolution.notes": "Resolution notes",

    // Navigation
    "nav.paymentMethods": "Payment Methods",

    // Payment method page
    "payment.title": "Add Payment Method",
    "payment.addressLabel": "Wallet Address",
    "payment.selectToken": "Select Network/Token",
    "payment.save": "Save Address",
    "payment.saved": "Address saved!",
    "payment.savedMethods": "Saved Payment Methods",
    "payment.noMethods": "No payment methods added yet.",
    "payment.remove": "Remove",
    "payment.scanQR": "Scan QR",
    "payment.scanInstructions": "Point your camera at a wallet QR code",
    "payment.cameraPermissionDenied":
      "Camera access denied. Please enable it in your browser settings.",
    "payment.scanningAddress": "Scanning...",
    "payment.detectedNetwork": "Detected {label} address — selected {token}",
    "payment.invalidAddress": "Invalid address for selected network",
    "payment.validAddress": "Valid address",
    "payment.qrNotSupported":
      "Your browser does not support QR scanning. Please copy-paste the address manually.",
    "payment.hint.USDT_TRC20":
      "USDT-TRC20: Address must start with 'T' and be 34 characters long.",
    "payment.hint.USDT_BEP20":
      "USDT-BEP20: Standard 0x... Ethereum-compatible address (42 chars).",
    "payment.hint.USDT_ERC20":
      "USDT-ERC20: Standard 0x... Ethereum address (42 chars).",
    "payment.hint.USDC_ERC20":
      "USDC-ERC20: Standard 0x... Ethereum address (42 chars).",
    "payment.hint.USDC_BEP20":
      "USDC-BEP20: Standard 0x... Ethereum-compatible address (42 chars).",
    "payment.hint.USDC_POLYGON":
      "USDC-Polygon: Standard 0x... Polygon-compatible address (42 chars).",
    "payment.hint.USDC_AVALANCHE":
      "USDC-Avalanche: Standard 0x... Avalanche-compatible address (42 chars).",
    "payment.hint.USDC_SPL":
      "USDC-SPL: Solana base58-encoded address (32–44 chars).",

    // Address verification
    "payment.verifyButton": "Verify Address",
    "payment.verifying": "Checking address activity...",
    "payment.verifiedActive": "Address is active ({{count}} transactions)",
    "payment.verifiedInactive":
      "Address format valid, activity could not be verified",
    "payment.verificationFailed":
      "Verification failed. You can still save this address.",
    "payment.badge.level2": "Level 2 Verified",
    "payment.badge.formatValid": "Format Valid",
    "payment.badge.unverified": "Unverified",
    "payment.noPaymentMethods": "No payment methods added yet.",

    // Global backend error messages
    "errors.rateLimited": "Too many requests. Please wait a moment.",
    "errors.invalidInput": "Invalid input. Please check your data.",
    "errors.unauthorized": "You are not authorized. Please sign in.",
    "errors.anonymousNotAllowed": "Please sign in to continue.",
    // TODO: rename key when backend contract changes
    "errors.escrowError": "Transaction error. Please try again.",
    "errors.reentrancyError":
      "This action is already being processed. Please wait.",
    "errors.generic": "Something went wrong. Please try again.",
    "errors.banned": "Your account has been suspended.",
    "errors.disputeAlreadyOpen": "A dispute is already open for this trade.",

    // Toast actions
    "toast.view_trade": "View Trade",

    // Notifications
    "notification.trade_funded": "Trade funded. Awaiting your confirmation.",
    "notification.buyer_confirmed": "Buyer confirmed payment sent.",
    "notification.payment_verified": "Payment verified on-chain.",
    "notification.trade_complete": "Trade completed!",
    "notification.trade_disputed": "Dispute opened on Trade",
    "notification.trade_refunded": "Trade refunded.",
    "notification.new_message": "New message in Trade",
    "notification.shipping_in_transit": "Shipping updated: In Transit",
    "notification.shipping_delivered": "Package delivered!",
    "notification.deadline_pending_24h":
      "Trade has been pending for 24h. Please take action.",
    "notification.deadline_funded_48h":
      "Trade has been funded for 48h. Please verify payment.",
    "notification.deadline_jury_12h":
      "Jury deadline for Trade is in less than 12 hours.",

    // Profile public view
    "profile.notFound.title": "Seller not found",
    "profile.notFound.description":
      "This seller does not exist or has been removed.",
    "profile.notFound.browseBtn": "Browse Listings",
    "profile.invalidLink.title": "Invalid seller link",
    "profile.invalidLink.description":
      "The seller link you followed is not valid.",
    "profile.invalidLink.browseBtn": "Browse Listings",
    "profile.listings.inactiveHidden": "Inactive listings are hidden",
    "profile.anonymousSeller": "Unnamed Seller",

    // Deactivate / Reactivate flow (TASK-004)
    "detail.reactivateListing": "Reactivate Listing",
    "detail.reactivateConfirm": "Reactivate this listing?",
    "detail.reactivateDesc":
      "This will make the listing visible to buyers again.",
    "detail.reactivateSuccess": "Listing reactivated",
    "detail.reactivateError": "Could not reactivate listing",
    "detail.inactiveBanner": "This listing is inactive",
    "profile.tabs.active": "Active",
    "profile.tabs.inactive": "Inactive",
    "listings.inactiveBadge": "Inactive",

    // Trade flow — manual confirmation steps (TASK-006)
    "trade.step.initiated": "Trade initiated",
    "trade.step.awaitingPayment": "Awaiting payment",
    "trade.step.buyerConfirmed": "Buyer confirmed payment sent",
    "trade.step.awaitingSeller": "Awaiting seller confirmation",
    "trade.step.sellerConfirmed": "Seller confirmed payment received",
    "trade.step.complete": "Trade complete",
    "trade.action.buyerSent": "I have sent the payment",
    "trade.action.sellerReceived": "I have received the payment",
    "trade.hint.sendOffChain":
      "Send the stablecoin to the seller's address outside the app, then click the button below.",
    "trade.hint.verifyOffChain":
      "Verify the payment in your wallet or exchange, then confirm below.",
    "trade.cancel": "Cancel trade",

    // Dispute modal i18n (TASK-006)
    "dispute.reason.itemNotReceived": "Item not received",
    "dispute.reason.itemDiffers": "Item differs from description",
    "dispute.reason.itemDamaged": "Item arrived damaged",
    "dispute.reason.sellerUnresponsive": "Seller unresponsive",
    "dispute.reason.other": "Other",
    "dispute.openedMessage":
      "Dispute opened. A moderator will review your case.",
    "dispute.form.title": "Open a Dispute",
    "dispute.form.reason": "Reason",
    "dispute.form.description": "Description",

    // TASK-007: Trade detail UX hardening
    "trade.dispute.chatBanner":
      "This trade is under dispute. Use this chat to provide evidence and communicate with the moderator.",
    "trade.cancelled.chatBanner":
      "This trade was cancelled. The chat remains open for reference.",
    "trade.instructions.USDT_TRC20.title": "Send USDT on Tron (TRC20)",
    "trade.instructions.USDT_TRC20.body":
      "Use the TRC20 network. Do NOT send TRC10 or use any other network. Tron addresses start with 'T'. Double-check the address with the seller before sending.",
    "trade.instructions.USDT_TRC20.warning":
      "Sending on the wrong network will result in permanent loss of funds.",
    "trade.instructions.USDT_BEP20.title": "Send USDT on BSC (BEP20)",
    "trade.instructions.USDT_BEP20.body":
      "Use the BEP20 network on Binance Smart Chain. BSC addresses start with '0x'. Ensure you have a small amount of BNB for gas if sending from a self-custody wallet.",
    "trade.instructions.USDT_BEP20.warning":
      "Sending on the wrong network (e.g., ERC20) will result in permanent loss of funds.",
    "trade.instructions.USDT_ERC20.title": "Send USDT on Ethereum (ERC20)",
    "trade.instructions.USDT_ERC20.body":
      "Use the ERC20 network on Ethereum. Addresses start with '0x'. Ensure you have enough ETH for gas fees. Ethereum transactions may take a few minutes to confirm.",
    "trade.instructions.USDT_ERC20.warning":
      "Sending on the wrong network will result in permanent loss of funds.",
    "trade.instructions.USDC_ERC20.title": "Send USDC on Ethereum (ERC20)",
    "trade.instructions.USDC_ERC20.body":
      "Use the ERC20 network on Ethereum. Addresses start with '0x'. Ensure you have enough ETH for gas fees. Ethereum transactions may take a few minutes to confirm.",
    "trade.instructions.USDC_ERC20.warning":
      "Sending on the wrong network will result in permanent loss of funds.",
    "trade.sellerReminder.title": "Verify payment before confirming",
    "trade.sellerReminder.body":
      "The buyer claims they have sent {amount} {token}. Please check your wallet or exchange for the incoming transaction before confirming receipt.",
    "trade.sellerReminder.warning":
      "Confirming receipt without actually receiving payment may result in loss of funds.",

    // TASK-008: Boundary validation + admin scope
    "validation.title.min": "Title must be at least 3 characters.",
    "validation.title.max": "Title cannot exceed 120 characters.",
    "validation.description.max": "Description cannot exceed 2000 characters.",
    "validation.price.range": "Price must be between $0 and $1,000,000.",
    "validation.photos.max": "You can upload a maximum of 10 photos.",
    "create.validation.photoType":
      "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or GIF.",
    "create.validation.photoSize": "File too large. Maximum size is 10 MB.",
    "validation.location.max": "Location cannot exceed 100 characters.",
    "validation.username.format":
      "Username can only contain letters, numbers, spaces, and underscores.",
    "validation.bio.max": "Bio cannot exceed 500 characters.",
    "admin.scope.note":
      "Stablecoin scope is limited to the approved 4-token set.",
    "profile.avatar.sizeError": "Avatar image must be under 5 MB.",

    // TASK-009: Shipping TTN fallback + tracking display + dispute improvements
    "shipping.manualTTN.label": "Enter tracking number manually",
    "shipping.manualTTN.placeholder": "Tracking number (TTN)",
    "shipping.tracking.empty":
      "No tracking updates yet. If you have a tracking number, enter it above.",
    "shipping.tracking.loading": "Loading tracking updates…",
    "dispute.reason.notShipped": "Seller did not ship",
    "dispute.reason.payment": "Payment issue",
    "dispute.alreadyOpened": "Dispute already opened",
  },

  uk: {
    // Navigation
    "nav.browse": "Перегляд",
    "nav.myTrades": "Мої угоди",
    "nav.sell": "Продати",
    "nav.admin": "Адмін",
    "nav.jurors": "Журі",
    "nav.profile": "Мій профіль",
    "nav.connect": "Підключити Identity",
    "nav.connecting": "Підключення…",
    "nav.signOut": "Вийти",
    "nav.skipToContent": "Перейти до основного вмісту",
    "nav.badge_trades_action": "угоди потребують дії",
    "nav.badge_unread_messages": "непрочитані повідомлення",

    // Hero
    "hero.badge": "Децентралізований P2P маркетплейс",
    "hero.title": "Купуй та продавай за крипто —",
    "hero.titleHighlight": "Безпечно",
    "hero.subtitle":
      "P2P торгівля з безпечним підтвердженням оплати. Оплата USDT або USDC у будь-якому популярному блокчейні — без посередників і банків.",
    "hero.browseCta": "Переглянути оголошення",
    "hero.loginCta": "Увійти через Internet Identity",
    "hero.welcomeBack": "З поверненням",

    // Listings
    "listings.featured": "Вибрані оголошення",
    "listings.featuredSub": "Останні товари від перевірених продавців",
    "listings.viewAll": "Всі",
    "listings.viewAllListings": "Всі оголошення",
    "listings.noListings": "Оголошень ще немає",
    "listings.noListingsFirst": "Будьте першим!",
    "listings.postFirst": "Додати оголошення",
    "listings.loadFailed":
      "Не вдалося завантажити оголошення. Спробуйте пізніше.",
    "listings.found": "оголошення",
    "listings.foundPlural": "оголошень",
    "listings.found.suffix": "знайдено",
    "listings.searching": "Пошук…",
    "listings.noFound": "Оголошень не знайдено",
    "listings.noFoundSub": "Спробуйте змінити пошуковий запит або фільтри",
    "listings.clearFilters": "Скинути фільтри",
    "listings.loadMore": "Завантажити ще",
    "listings.loadFailed.short": "Не вдалося завантажити",
    "listings.loadFailed.retry": "Спробуйте пізніше",

    // How it works
    "hiw.title": "Як це працює",
    "hiw.subtitle": "Три прості кроки до безпечної крипто-угоди",
    "hiw.step1.title": "Додайте оголошення",
    "hiw.step1.desc":
      "Опишіть товар, вкажіть ціну в крипто, додайте фото та варіанти доставки. Оголошення з'явиться миттєво.",
    "hiw.step2.title": "Домовтеся про ціну та оплату",
    "hiw.step2.desc":
      "Покупець ініціює угоду та обирає токен. Обидві сторони підтверджують умови до переказу коштів.",
    "hiw.step3.title": "Безпечне підтвердження угоди",
    "hiw.step3.desc":
      "Обидві сторони вручну підтверджують транзакцію. Є підтримка спорів у разі проблем.",

    // Trust
    // TODO: rename key when backend contract changes
    "trust.escrow": "Захист угоди",
    "trust.identity": "Internet Identity",
    "trust.multiToken": "Підтримка токенів",

    // Trust tiers
    "trust.tier.new": "Новачок",
    "trust.tier.bronze": "Бронза",
    "trust.tier.silver": "Срібло",
    "trust.tier.gold": "Золото",

    // Trade statuses
    "trade.status.pending": "Угоду розпочато",
    "trade.status.funded": "Очікування оплати",
    "trade.status.buyer_confirmed": "Очікування підтвердження продавця",
    "trade.status.payment_verified": "Оплату підтверджено — завершуємо",
    "trade.status.complete": "Угоду завершено",
    "trade.status.refunded": "Повернено",
    "trade.status.disputed": "Під диспутом",
    "trade.status.cancelled": "Угоду скасовано",
    "trade.status.awaiting_approval": "Очікує підтвердження",
    "trade.status.verified": "Верифіковано",

    // Item conditions
    "condition.new": "Нове",
    "condition.likeNew": "Як нове",
    "condition.good": "Добре",
    "condition.fair": "Задовільно",
    "condition.poor": "Погане",

    // Condition descriptions
    "condition.new.desc": "Не використовувалось, оригінальне пакування",
    "condition.likeNew.desc":
      "Використано один-два рази, без слідів використання",
    "condition.good.desc":
      "Незначні сліди використання, повністю функціональне",
    "condition.fair.desc": "Видимий знос, але працює ідеально",
    "condition.poor.desc": "Сильний знос, можливо потребує ремонту",

    // Carriers
    "carrier.nova_poshta": "Нова Пошта",
    "carrier.ukrposhta": "Укрпошта",
    "carrier.meest": "Meest Express",
    "carrier.self_pickup": "Самовивіз",
    "carrier.digital": "Цифрова доставка",

    // Categories
    "category.electronics": "Електроніка",
    "category.clothing": "Одяг та аксесуари",
    "category.books": "Книги",
    "category.digital": "Цифрові товари",
    "category.services": "Послуги",
    "category.other": "Інше",

    // Create listing
    "create.title": "Додати оголошення",
    "create.titleEdit": "Редагувати оголошення",
    "create.subtitle": "Заповніть деталі для публікації товару",
    "create.subtitleEdit": "Оновіть інформацію про оголошення",
    "create.signInRequired": "Увійдіть, щоб додати оголошення",
    "create.signInDesc":
      "Для створення або редагування оголошень потрібно ввійти через Internet Identity.",
    "create.connect": "Підключити Internet Identity",
    "create.step.basic": "Основне",
    "create.step.pricing": "Ціна та доставка",
    "create.step.photos": "Фото",
    "create.publish": "Опублікувати",
    "create.update": "Оновити",
    "create.publishing": "Публікація...",
    "create.updating": "Оновлення...",
    "create.deactivate": "Деактивувати",
    "create.continue": "Далі",
    "create.back": "Назад",
    "create.connecting": "Підключення…",
    "create.connectingWait": "Зачекайте поки ми підключаємось до блокчейну",
    "create.notConnected": "Немає з'єднання. Оновіть сторінку.",
    "create.photosStillUploading": "Зачекайте поки фото завантажаться",
    "create.photosHaveErrors": "Видаліть фото з помилками та спробуйте ще раз",
    "create.retryPhotoHint":
      'Натисніть кнопку "Повторити" на фото з помилкою або видаліть і додайте знову',
    "create.noPhotos": "Додайте хоча б одне фото",
    "create.photoUrlsMissing":
      "Завантаження фото не завершено — видаліть і додайте фото знову",
    "create.submitFailed": "Не вдалося опублікувати оголошення",
    "create.updateFailed": "Не вдалося оновити оголошення",
    "create.error.noProfile":
      "Спочатку створіть профіль перед публікацією оголошення",
    "create.error.banned": "Ваш акаунт заблоковано",
    "create.error.rateLimited":
      "Забагато запитів — зачекайте хвилину і спробуйте ще раз",
    "create.field.title": "Назва",
    "create.field.category": "Категорія",
    "create.field.condition": "Стан",
    "create.field.description": "Опис",
    "create.field.price": "Ціна",
    "create.field.location": "Місцезнаходження",
    "create.field.carrier": "Перевізник",
    "create.field.photos": "Фото",
    "create.field.digitalItem": "Цифровий товар",
    "create.field.digitalItemDesc":
      "Увімкніть, якщо продаєте цифровий файл або онлайн-послугу",
    "create.field.digitalUrl": "URL цифрового файлу",
    "create.placeholder.title": "Що ви продаєте?",
    "create.placeholder.category": "Виберіть категорію",
    "create.placeholder.description":
      "Опишіть товар детально — стан, характеристики, що включено…",
    "create.placeholder.location": "Місто, Регіон",
    "create.review.title": "Огляд",
    "create.review.carrier": "Перевізник",
    "create.photos.upload": "Завантажте фото",
    "create.photos.uploadDesc":
      "Перше фото — обкладинка. Перетягуйте мініатюри для зміни порядку.",
    "create.photos.dropzone": "Перетягніть фото сюди або",
    "create.photos.browse": "виберіть файли",
    "create.photos.hint": "До {max} фото · JPG, PNG, WebP, HEIC · Макс 10 МБ",
    "create.photos.uploading": "Завантаження {count} фото…",
    "create.photos.errors":
      "{count} фото не вдалося завантажити. Видаліть їх і спробуйте ще раз.",
    "create.photos.cover": "Обкладинка",
    "create.photos.uploadFailedFallback": "Завантаження не вдалось",
    "create.photos.retryBtn": "Повторити",
    "create.photos.removeBtn": "Видалити фото",
    "create.published": "Оголошення опубліковано!",
    "create.updated": "Оголошення оновлено",
    "create.deactivated": "Оголошення деактивовано",
    "create.deactivateFailed": "Не вдалося деактивувати",
    "create.error.generic": "Щось пішло не так",
    "create.error.uploadFailed": "Не вдалося завантажити фото",
    "create.error.storageUnavailable":
      "Сховище файлів тимчасово недоступне. Оновіть сторінку та спробуйте ще раз.",
    "create.validation.title": "Вкажіть назву",
    "create.validation.titleMax": "Макс {max} символів",
    "create.validation.category": "Виберіть категорію",
    "create.validation.condition": "Виберіть стан",
    "create.validation.description": "Додайте опис",
    "create.validation.digitalUrl": "URL цифрового файлу обов'язковий",
    "create.validation.price": "Вкажіть коректну ціну",
    "create.validation.location": "Вкажіть місцезнаходження",
    "create.validation.carrier": "Виберіть перевізника",
    "create.validation.photosUploading": "Зачекайте поки фото завантажаться",
    "create.validation.photosErrors":
      "Видаліть фото з помилками та спробуйте ще раз",
    "create.validation.photosMin": "Додайте хоча б одне фото",
    "create.photos.waitForUpload": "Зачекайте, поки всі фото завантажаться",
    "create.photos.fixFailedUploads":
      "Деякі фото не завантажились. Видаліть або повторіть завантаження перед публікацією.",

    // Edit mode
    "create.editMode.heading": "Редагувати оголошення",
    "create.editMode.saveBtn": "Зберегти зміни",
    "create.editMode.cancelBtn": "Скасувати",
    "create.editMode.discardConfirm.title": "Скасувати зміни?",
    "create.editMode.discardConfirm.description": "Усі зміни буде втрачено.",
    "create.editMode.discardConfirm.confirm": "Скасувати",
    "create.editMode.discardConfirm.keepEditing": "Продовжити редагування",
    "create.editMode.notOwnerError":
      "Ви можете редагувати тільки свої оголошення.",
    "create.editMode.loadError":
      "Не вдалося завантажити оголошення для редагування.",
    "create.editMode.backToListing": "Назад до оголошення",

    // Listing detail
    "detail.breadcrumb.listings": "Оголошення",
    "detail.paymentMethods": "Методи оплати",
    "detail.shipping": "Варіанти доставки",
    "detail.buyNow": "Купити",
    "detail.signInToBuy": "Увійти для покупки",
    "detail.selectShippingAndBuy": "Обрати доставку та купити",
    "detail.proceedCheckout": "Перейти до оформлення",
    // TODO: rename key when backend contract changes
    "detail.escrowNote":
      "Обидві сторони погодилися з умовами угоди. Виконайте ваші кроки вище.",
    "detail.removeListingBtn": "Видалити оголошення",
    "detail.removeListingConfirm": "Видалити це оголошення?",
    "detail.removeListingDesc":
      "Ця дія видалить оголошення для всіх користувачів. Це незворотньо.",
    "detail.cancel": "Скасувати",
    "detail.remove": "Видалити",
    "detail.removing": "Видалення…",
    "detail.notFound": "Оголошення не знайдено",
    "detail.notFoundDesc": "Це оголошення могло бути видалено або не існує.",
    "detail.browseListings": "Переглянути оголошення",
    "detail.description": "Опис",
    "detail.noDescription": "Опис для цього оголошення недоступний.",
    "detail.verified": "Верифікований",
    "detail.reputation": "репутація",
    "detail.marketplaceMember": "Учасник маркетплейсу",
    "detail.removedSuccess": "Оголошення видалено",
    "detail.removedError": "Не вдалося видалити оголошення",
    "detail.carousel.prev": "Попереднє фото",
    "detail.carousel.next": "Наступне фото",
    "detail.carousel.thumb": "Переглянути фото {n}",
    "detail.payment": "Методи оплати",

    // Listing detail — seller visibility & owner actions
    "detail.viewSellerProfile": "Переглянути профіль продавця",
    "detail.editListing": "Редагувати",
    "detail.deactivateListing": "Деактивувати",
    "detail.deactivateConfirm": "Деактивувати оголошення?",
    "detail.deactivateDesc":
      "Ви впевнені, що хочете деактивувати це оголошення? Воно зникне з пошуку.",
    "detail.deactivating": "Деактивація…",
    "detail.otherListings": "Інші оголошення продавця",
    "detail.allListings": "Усі оголошення",
    "detail.noOtherListings": "Немає інших оголошень",
    "detail.deactivateSuccess": "Оголошення деактивовано",
    "detail.deactivateError": "Помилка деактивації оголошення",
    "detail.deactivateErrorGeneric": "Помилка деактивації",

    // Shipping selector
    "shipping.compare.title": "Порівняння доставки",
    "shipping.compare.subtitle": "Актуальні тарифи від усіх перевізників",
    "shipping.compare.loading": "Отримуємо тарифи перевізників…",
    "shipping.compare.loadingHint": "Запит до 3 перевізників, займає 2–3 сек",
    "shipping.compare.error": "Не вдалося завантажити варіанти доставки",
    "shipping.compare.retry": "Спробувати ще раз",
    "shipping.compare.selectCarrier": "Виберіть перевізника для продовження",
    "shipping.compare.selected": "Вибрано",
    "shipping.compare.unavailable": "Недоступно",
    "shipping.compare.demoPrice": "Демо-ціна",
    "shipping.compare.noCoverage": "Немає покриття",
    "shipping.compare.noApiKey": "API ключ не налаштовано",
    "shipping.compare.days": "дні",
    "shipping.compare.day": "день",
    "shipping.compare.cost": "Вартість",
    "shipping.compare.delivery": "Доставка",
    "shipping.compare.fastest": "Найшвидше",
    "shipping.compare.cheapest": "Найдешевше",
    "shipping.compare.selectBtn": "Вибрати",
    "shipping.compare.weight": "Вага (кг)",
    "shipping.compare.from": "Місто відправлення",
    "shipping.compare.to": "Місто отримання",
    "shipping.compare.calculate": "Розрахувати",
    "shipping.compare.calculating": "Розраховуємо…",

    // Package details & branch selector (Nova Poshta)
    "shipping.packageDetails": "Параметри пакунку",
    "shipping.weight": "Вага (кг)",
    "shipping.length": "Довжина (см)",
    "shipping.width": "Ширина (см)",
    "shipping.height": "Висота (см)",
    "shipping.places": "Кількість місць",
    "shipping.volumetricWeight": "Об'ємна вага: {0} кг",
    "shipping.branchSearch": "Пошук відділення",
    "shipping.branchSearchPlaceholder": "Почніть вводити для пошуку...",
    "shipping.branchLoading": "Завантаження відділень...",
    "shipping.branchNoResults": "Відділень не знайдено",
    "shipping.branchSelect": "Оберіть відділення",
    "shipping.lockerSizeError":
      "Товар завеликий для поштомату (макс. 40×60×30 см, 20 кг)",
    "shipping.pickupOnly.title": "Лише самовивіз",
    "shipping.pickupOnly.subtitle":
      "Доставка перевізниками тимчасово вимкнена.",
    "shipping.pickupOnly.description":
      "Покупець і продавець узгоджують деталі самовивозу після початку угоди.",
    "shipping.pickupOnly.lockedNotice":
      "Нова Пошта, Укрпошта та Meest вимкнені, доки власник проекту явно не попросить повернути інтеграції доставки.",
    "shipping.pickupOnly.select": "Використати самовивіз",

    // Trade TTN (carrier waybill)
    "trade.ttnCreate": "Створити ТТН",
    "trade.ttnRetry": "Повторити створення ТТН",
    "trade.ttnCreating": "Створення ТТН...",
    "trade.ttnSuccess": "ТТН створено",
    "trade.ttnFailed": "Помилка створення ТТН",
    "trade.manualTTN": "Ввести номер відстеження вручну",
    "trade.manualTTNSave": "Зберегти номер",
    "trade.ttnNumber": "Номер відстеження",
    "trade.ttnSection.nova_poshta": "Накладна Нової Пошти",
    "trade.ttnSection.ukrposhta": "Накладна Укрпошти",
    "trade.ttnSection.meest": "Накладна Meest",
    "trade.ttnSection.default": "Накладна доставки",
    "trade.confirmDeliveryReleaseFunds":
      "Підтвердити доставку та звільнити кошти",

    // ShippingTracker
    "shipping.trackingTitle": "Відстеження",
    "shipping.carrierLabel": "Перевізник",
    "shipping.refreshButton": "Оновити відстеження",
    "shipping.refreshPrompt": "Натисніть оновити, щоб отримати останній статус",
    "shipping.lastUpdated": "Останнє оновлення:",
    "shipping.refreshing": "Оновлення…",
    "shipping.fetchError":
      "Не вдалося отримати інформацію про відстеження. Спробуйте пізніше.",
    "shipping.requestFailed": "Запит відстеження не вдався",

    // Footer
    "footer.builtWith": "Зроблено з любов'ю за допомогою",

    // Common
    "common.sort.newest": "Новіші",
    "common.sort.priceAsc": "Ціна: від низької до високої",
    "common.sort.priceDesc": "Ціна: від високої до низької",

    // Filter panel
    "filter.title": "Фільтри",
    "filter.reset": "Скинути",
    "filter.category": "Категорія",
    "filter.priceRange": "Діапазон цін",
    "filter.condition": "Стан",
    "filter.shipping": "Доставка",
    "filter.price.min": "Мінімальна ціна",
    "filter.price.max": "Максимальна ціна",
    "filter.listings": "Фільтри оголошень",
    "filter.token.title": "Токен",
    "filter.token.any": "Усі токени",
    "filter.token.USDT_TRC20": "USDT-TRC20",
    "filter.token.USDT_BEP20": "USDT-BEP20",
    "filter.token.USDT_ERC20": "USDT-ERC20",
    "filter.token.USDC_ERC20": "USDC-ERC20",
    "filter.price.errorRange":
      "Мінімальна ціна не може перевищувати максимальну",
    "filter.chips.clearAll": "Очистити все",
    "filter.activeFilters": "Активні фільтри",
    "filter.any": "Будь-яке",

    // Trades page
    "trades.title": "Мої угоди",
    "trades.subtitle": "Відстежуйте всі активні та завершені угоди",
    "trades.tab.buying": "Купую",
    "trades.tab.selling": "Продаю",
    "trades.empty.buying.title": "Покупок ще немає",
    "trades.empty.buying.desc": "Перегляньте оголошення та почніть першу угоду",
    "trades.empty.selling.title": "Продажів ще немає",
    "trades.empty.selling.desc": "Створіть оголошення, щоб почати продавати",
    "trades.empty.browseCta": "Переглянути оголошення",
    "trades.empty.postCta": "Опублікувати оголошення",

    // Search bar
    "search.placeholder": "Пошук оголошень…",
    "search.ariaLabel": "Пошук оголошень",
    "search.clearAriaLabel": "Очистити пошук",

    // Payment Verification Widget
    "verify.title": "Верифікація платежу в блокчейні",
    "verify.subtitle":
      "Вставте хеш транзакції, щоб автоматично підтвердити оплату в мережі.",
    "verify.txHashLabel": "Хеш транзакції",
    "verify.txHashPlaceholder": "0x... або TxID",
    "verify.networkLabel": "Мережа",
    "verify.networkAutoDetected": "Визначається автоматично з токена платежу",
    "verify.submitBtn": "Перевірити в блокчейні",
    "verify.verifying": "Перевірка…",
    "verify.statusPending": "Верифікація в процесі…",
    "verify.statusPendingDesc":
      "Перевіряємо блокчейн на наявність вашої транзакції. Це може зайняти до 1 хвилини.",
    "verify.statusVerified": "Платіж підтверджено",
    "verify.statusVerifiedDesc":
      "Вашу оплату підтверджено в мережі. Продавця буде повідомлено.",
    "verify.statusFailed": "Верифікацію не вдалось",
    "verify.statusFailedRetry": "Спробуйте з іншим хешем",
    "verify.blockNumber": "Блок",
    "verify.confirmedAmount": "Підтверджена сума",
    "verify.confirmedRecipient": "Отримувач",
    "verify.sellerCanConfirm": "Продавець тепер може підтвердити отримання.",
    "verify.errorSubmit": "Не вдалося надіслати верифікацію. Спробуйте ще раз.",

    // Payment networks
    "network.USDT_TRC20": "USDT / Tron (TRC20)",
    "network.USDT_BEP20": "USDT / BNB Chain (BEP20)",
    "network.USDC_SPL": "USDC / Solana (SPL)",
    "network.USDC_ERC20": "USDC / Ethereum (ERC20)",
    "network.USDT_ERC20": "USDT / Ethereum (ERC20)",
    "network.USDC_BEP20": "USDC / BNB Chain (BEP20)",
    "network.USDC_POLYGON": "USDC / Polygon",
    "network.USDC_AVALANCHE": "USDC / Avalanche",
    "network.USDT_POLYGON": "USDT Polygon",
    "network.USDT_AVALANCHE": "USDT Avalanche",
    "network.USDT": "USDT",
    "network.USDC": "USDC",
    "network.TRC20": "TRC20 (Tron)",
    "network.BEP20": "BEP20 (BSC)",
    "network.ERC20": "ERC20 (Ethereum)",
    "network.SPL": "SPL (Solana)",
    "network.Polygon": "Polygon",
    "network.Avalanche": "Avalanche",
    "network.selectTitle": "Оберіть мережу {token}",

    // Location picker
    "location.selectOblast": "Оберіть область",
    "location.selectCity": "Оберіть місто",
    "location.selectOblastFirst": "Спочатку оберіть область",
    "location.clearSelection": "Очистити",
    "location.legacyPrefix": "Застаріле:",
    "location.failedToLoadRegions": "Не вдалося завантажити регіони",

    // Token selector
    "token.selectBase": "Оберіть токен",
    "token.changeNetwork": "Змінити мережу",

    // Trade timeline (keys keep "escrow.*" names for backward compatibility)
    // TODO: rename key when backend contract changes
    "escrow.step.accepted.label": "Угоду прийнято",
    "escrow.step.accepted.desc": "Обидві сторони погодились на умови",
    "escrow.step.pending.label": "Очікує оплати",
    "escrow.step.pending.desc": "Покупець надсилає оплату поза мережею",
    "escrow.step.funded.label": "Оплату надіслано",
    "escrow.step.funded.desc": "Покупець підтвердив надсилання оплати",
    "escrow.step.buyer_confirmed.label": "Продавець підтвердив",
    "escrow.step.buyer_confirmed.desc": "Продавець підтвердив отримання",
    "escrow.step.complete.label": "Угоду завершено",
    "escrow.step.complete.desc": "Кошти звільнено, угоду закрито",
    "escrow.terminal.disputed.label": "Відкрито диспут",
    "escrow.terminal.disputed.desc": "На розгляді модератора",
    "escrow.terminal.refunded.label": "Повернено",
    "escrow.terminal.refunded.desc": "Оплату повернено покупцю",
    "escrow.terminal.cancelled.label": "Скасовано",
    "escrow.terminal.cancelled.desc": "Угоду скасовано за взаємною згодою",

    // Chat
    "chat.title": "Чат",
    "chat.unread": "{count} непрочитаних",
    "chat.empty": "Повідомлень ще немає. Почніть розмову.",
    "chat.placeholder": "Введіть повідомлення…",
    "chat.attachment.placeholder": "Вставте URL вкладення…",
    "chat.attachment.ariaLabel": "Додати вкладення",
    "chat.send.ariaLabel": "Надіслати",
    "chat.sendError": "Не вдалося надіслати повідомлення",
    "chat.attachment.link": "Вкладення",
    "chat.uploadPhoto": "Завантажити фото",
    "chat.uploadVideo": "Завантажити відео",
    "chat.uploadFile": "Завантажити файл",
    "chat.dragDropHint": "Перетягніть файли для завантаження",
    "chat.linkPreview.loading": "Завантаження попереднього перегляду...",
    "chat.linkPreview.error": "Не вдалося завантажити попередній перегляд",
    "chat.gallery.close": "Закрити",
    "chat.attachments.max": "Максимум 10 вкладень",
    "chat.uploading": "Завантаження...",
    "chat.removeAttachment": "Видалити вкладення",
    "chat.dropOverlay": "Перетягніть файли сюди",

    // Reputation stats
    "reputation.completedTrades": "Завершені угоди",
    "reputation.averageRating": "Середній рейтинг",
    "reputation.trustLevel": "Рівень довіри",
    "reputation.disputeRate": "Рівень диспутів",
    "reputation.ratingAriaLabel": "{value} з 5 зірок",

    // Admin — Phase 2 metrics (Ukrainian)
    "admin.metrics.title": "Метрики платформи",
    "admin.metrics.lastUpdated": "Оновлено",
    "admin.metrics.secondsAgo": "секунд тому",
    "admin.metrics.refresh": "Оновити",
    "admin.metrics.refreshLabel": "Оновити метрики платформи",
    "admin.metrics.autoRefresh": "Авто-оновлення кожні 60 сек",
    "admin.metrics.swapSuccess": "Успішність свопів",
    "admin.metrics.avgSettlement": "Середній час розрахунку",
    "admin.metrics.disputeRate": "Рівень диспутів",
    "admin.metrics.disputeTarget": "≤ 3% ціль",
    "admin.metrics.mau": "Активні користувачі (місяць)",
    "admin.metrics.activeUsers24h": "Активні за 24 год",
    "admin.metrics.minutes": "хв",
    "admin.metrics.totalTrades": "Всього угод",
    "admin.metrics.activeTrades": "Активні угоди",
    "admin.metrics.totalVolume": "Загальний обсяг",
    "admin.metrics.totalRevenue": "Загальний дохід",
    "admin.metrics.disputeRatePct": "Рівень суперечок",
    "admin.metrics.p95Latency": "P95 Затримка",
    "admin.metrics.errorRate": "Рівень помилок",
    "admin.metrics.cyclesBalanceTril": "Баланс циклів",
    "admin.metrics.volumeGraph": "Угоди по днях (останні 7 днів)",
    "admin.alerts.cyclesLow":
      "Баланс циклів нижче порогу! Необхідне поповнення.",
    "admin.alerts.errorRateHigh": "Рівень помилок перевищує поріг!",
    "admin.settings.alertThresholds": "Порогові значення сповіщень",
    "admin.settings.cyclesThreshold": "Поріг балансу циклів (T)",
    "admin.settings.errorRateThreshold": "Поріг рівня помилок (%)",
    "admin.cycles.title": "Стан циклів",
    "admin.cycles.balance": "Поточний баланс",
    "admin.cycles.budget": "% від бюджету",
    "admin.cycles.dailyBurn": "Спалення на день",
    "admin.cycles.warning": "Мало циклів",
    "admin.cycles.ok": "Норма",
    "admin.cycles.progressLabel": "Використання бюджету циклів",
    "admin.errorLog.title": "Журнал помилок",
    "admin.errorLog.filter": "Фільтр за рівнем",
    "admin.errorLog.all": "Всі рівні",
    "admin.errorLog.timestamp": "Час",
    "admin.errorLog.module": "Модуль",
    "admin.errorLog.function": "Функція",
    "admin.errorLog.severity": "Рівень",
    "admin.errorLog.message": "Повідомлення",
    "admin.errorLog.empty": "Записів у журналі немає",
    "admin.errorLog.emptyFiltered": "Записів за обраним фільтром немає",
    "admin.errorLog.page": "Сторінка",
    "admin.errorLog.of": "з",
    "admin.errorLog.prev": "Назад",
    "admin.errorLog.next": "Далі",
    "admin.modules.title": "Метрики модулів",
    "admin.modules.name": "Модуль",
    "admin.modules.requests": "Запити",
    "admin.modules.errors": "Помилки",
    "admin.modules.memory": "Пам'ять",
    "admin.modules.cycles": "Цикли",
    "admin.modules.chart": "Помилки по модулях",
    "admin.severity.info": "Інфо",
    "admin.severity.warning": "Попередження",
    "admin.severity.error": "Помилка",
    "admin.severity.critical": "Критична",

    // Admin panel tabs & UI
    "admin.panel.title": "Адмін панель",
    "admin.tab.overview": "Огляд",
    "admin.tab.users": "Користувачі",
    "admin.tab.disputes": "Диспути",
    "admin.tab.listings": "Оголошення",
    "admin.tab.audit": "Журнал аудиту",
    "admin.tab.settings": "Налаштування",
    "admin.tab.nav.label": "Навігація адміна",
    "admin.settings.adminOnly": "Лише адміни можуть керувати налаштуваннями.",
    "admin.listings.title": "Модерація оголошень",
    "admin.listings.noFlagged": "Немає позначених оголошень",
    "admin.listings.allClean": "Всі оголошення виглядають чисто.",
    "admin.listings.colTitle": "Назва",
    "admin.listings.colSeller": "Продавець",
    "admin.listings.colPrice": "Ціна",
    "admin.listings.colActions": "Дії",
    "admin.listings.remove": "Видалити",
    "admin.listings.removing": "Видалення…",
    "admin.signInDesc":
      "Увійдіть через Internet Identity для доступу до адмін панелі.",
    "admin.signIn": "Увійти через Internet Identity",

    // Admin user management
    "admin.users.title": "Управління користувачами",
    "admin.users.empty": "Користувачів не знайдено.",
    "admin.users.col.principal": "Principal",
    "admin.users.col.username": "Ім'я",
    "admin.users.col.role": "Роль",
    "admin.users.col.trust": "Довіра",
    "admin.users.col.status": "Статус",
    "admin.users.col.score": "Рейтинг",
    "admin.users.col.registered": "Зареєстрований",
    "admin.users.col.actions": "Дії",
    "admin.users.status.active": "Активний",
    "admin.users.status.suspended": "Призупинений",
    "admin.users.status.banned": "Заблокований",
    "admin.users.action.suspend": "Призупинити",
    "admin.users.action.ban": "Заблокувати",
    "admin.users.page": "Сторінка",
    "admin.users.of": "з",
    "admin.users.modal.ban": "Заблокувати користувача",
    "admin.users.modal.suspend": "Призупинити користувача",
    "admin.users.modal.promote": "Підвищити до модератора",
    "admin.users.modal.user": "Користувач:",
    "admin.users.modal.suspendDays": "Тривалість призупинення (дні)",
    "admin.users.modal.reason": "Причина",
    "admin.users.modal.reasonPlaceholder": "Вкажіть причину…",
    "admin.users.modal.promoteDesc":
      "Цей користувач зможе розглядати диспути та мати доступ до інструментів модерації.",
    "admin.users.modal.cancel": "Скасувати",
    "admin.users.modal.confirm": "Підтвердити",
    "admin.users.modal.processing": "Обробка…",
    "admin.users.banned": "Користувача заблоковано",
    "admin.users.banFailed": "Не вдалося заблокувати",
    "admin.users.suspended": "Користувача призупинено",
    "admin.users.suspendFailed": "Не вдалося призупинити",
    "admin.users.promoted": "Користувача підвищено до модератора",
    "admin.users.promoteFailed": "Не вдалося підвищити",

    // Sidebar
    "sidebar.toggle": "Перемкнути бічну панель",

    // Pagination
    "pagination.label": "навігація сторінками",
    "pagination.prev": "Перейти на попередню сторінку",
    "pagination.next": "Перейти на наступну сторінку",
    "pagination.previous": "Назад",
    "pagination.next.label": "Далі",
    "pagination.more": "Більше сторінок",

    // Juror Dashboard
    "jurors.pageTitle": "Журі",
    "jurors.pageSubtitle":
      "Допомагайте вирішувати спори справедливо та нарощуйте репутацію",
    "jurors.joinTitle": "Приєднатися до журі",
    "jurors.joinDesc":
      "Зареєстровані присяжні вивчають докази та голосують щодо спірних угод. Формуйте репутацію та підтримуйте чесність маркетплейсу.",
    "jurors.joinBtn": "Зареєструватись як присяжний",
    "jurors.joining": "Реєстрація…",
    "jurors.joinStakeLabel": "Сума стейку (необов'язково, покращує рейтинг)",
    "jurors.leavePool": "Покинути журі",
    "jurors.leaving": "Виходимо…",
    "jurors.leaveConfirm": "Покинути пул журі?",
    "jurors.leaveConfirmDesc":
      "Вас буде видалено зі всіх очікуваних справ. Зроблені голоси зберігаються.",
    "jurors.stats.title": "Ваша статистика",
    "jurors.stats.resolved": "Вирішено",
    "jurors.stats.successRate": "Успішність",
    "jurors.stats.active": "Активних справ",
    "jurors.activeCases": "Активні справи",
    "jurors.noCases": "Немає активних справ",
    "jurors.noCasesDesc":
      "Наразі у вас немає очікуваних диспутних справ. Перевірте пізніше.",
    "jurors.caseDispute": "Диспут",
    "jurors.caseTrade": "Угода",
    "jurors.caseDeadline": "Дедлайн",
    "jurors.caseStatus.pending": "Очікує голосу",
    "jurors.caseStatus.voted": "Проголосовано",
    "jurors.voteFor": "Голосувати",
    "jurors.voteBuyer": "За покупця",
    "jurors.voteSeller": "За продавця",
    "jurors.voteConfirmTitle": "Підтвердіть голос",
    "jurors.voteConfirmDesc":
      "Цю дію неможливо скасувати. Ваш голос буде записано в блокчейн.",
    "jurors.voteReasoning": "Обґрунтування",
    "jurors.voteReasoningPlaceholder":
      "Коротко поясніть своє рішення на основі доказів…",
    "jurors.submitVote": "Подати голос",
    "jurors.submitting": "Надсилання…",
    "jurors.voteSubmitted": "Голос подано",
    "jurors.consensus": "присяжних проголосували",
    "jurors.evidenceSummary": "Докази та опис",
    "jurors.noEvidence": "Доказів не надано.",
    "jurors.loadError": "Не вдалося завантажити дашборд",
    "jurors.voteError": "Не вдалося подати голос",
    "jurors.registrationError": "Не вдалося зареєструватись",
    "jurors.unregisterError": "Не вдалося покинути пул журі",
    "jurors.signInRequired": "Увійдіть для доступу до журі",
    "jurors.signInDesc":
      "Потрібна автентифікація через Internet Identity для участі.",
    "jurors.signIn": "Підключити Internet Identity",
    "jurors.adminTitle": "Пул журі — Адмін",
    "jurors.adminSubtitle":
      "Всі зареєстровані присяжні та їх статистика ефективності",
    "jurors.admin.principal": "Principal",
    "jurors.admin.resolved": "Вирішено",
    "jurors.admin.active": "Активних",
    "jurors.admin.successRate": "Успішність %",
    "jurors.admin.staked": "Стейк",
    "jurors.admin.registered": "Зареєстрований",
    "jurors.admin.remove": "Видалити",
    "jurors.admin.removing": "Видалення…",
    "jurors.admin.noJurors": "Немає зареєстрованих присяжних",
    "jurors.timeLeft": "Залишилось",
    "jurors.expired": "Прострочено",
    "jurors.expandCase": "Розгорнути деталі справи",
    "jurors.collapseCase": "Згорнути деталі справи",
    // Juror join feature highlights
    "jurors.feature.fairVoting": "Чесне голосування",
    "jurors.feature.onChain": "Результати в блокчейні",
    "jurors.feature.reputation": "Нарощуйте репутацію",
    // Vote live feedback
    "jurors.voteSubmittedLive": "Ваш голос успішно подано.",

    // Header balance (Phase 3)
    "header.balance": "Баланс",
    "header.balance.loading": "Завантаження…",
    "header.balance.error": "Недоступно",
    "header.balance.refreshing": "Оновлення…",

    // governance.* namespace (Phase 3)
    "governance.pageTitle": "Управління",
    "governance.pageSubtitle":
      "Голосуйте за пропозиції та формуйте майбутнє маркетплейсу",
    "governance.proposals.title": "Активні пропозиції",
    "governance.proposals.empty": "Немає активних пропозицій",
    "governance.proposals.emptyDesc":
      "Наразі немає пропозицій, відкритих для голосування.",
    "governance.proposals.create": "Створити пропозицію",
    "governance.proposals.id": "Пропозиція №",
    "governance.proposals.type": "Тип",
    "governance.proposals.status": "Статус",
    "governance.proposals.votes": "Голоси",
    "governance.proposals.deadline": "Дедлайн голосування",
    "governance.proposals.quorum": "Кворум",
    "governance.proposals.loading": "Завантаження пропозицій…",
    "governance.proposals.loadError": "Не вдалося завантажити пропозиції",
    "governance.vote.title": "Голосування",
    "governance.vote.for": "За",
    "governance.vote.against": "Проти",
    "governance.vote.abstain": "Утриматись",
    "governance.vote.confirm": "Підтвердити голос",
    "governance.vote.submitting": "Надсилання…",
    "governance.vote.submitted": "Голос подано",
    "governance.vote.alreadyVoted": "Ви вже проголосували",
    "governance.vote.notEligible": "Ви не маєте права голосу",
    "governance.vote.error": "Не вдалося подати голос",
    "governance.vote.reasoning": "Обґрунтування (необов'язково)",
    "governance.vote.reasoningPlaceholder": "Поясніть своє рішення…",
    "governance.create.title": "Створити пропозицію",
    "governance.create.typeLabel": "Тип пропозиції",
    "governance.create.type.feeChange": "Зміна комісії",
    "governance.create.type.paramUpdate": "Оновлення параметрів",
    "governance.create.type.treasuryWithdrawal": "Виведення з казни",
    "governance.create.type.emergencyPause": "Аварійна зупинка",
    "governance.create.type.resume": "Відновлення платформи",
    "governance.create.descLabel": "Опис",
    "governance.create.descPlaceholder": "Опишіть що змінює ця пропозиція…",
    "governance.create.amountLabel": "Сума (центи USD)",
    "governance.create.recipientLabel": "Адреса отримувача",
    "governance.create.submit": "Подати пропозицію",
    "governance.create.submitting": "Надсилання…",
    "governance.create.success": "Пропозицію подано",
    "governance.create.error": "Не вдалося створити пропозицію",
    "governance.treasury.title": "Казна",
    "governance.treasury.balance": "Загальний баланс",
    "governance.treasury.usdt": "Баланс USDT",
    "governance.treasury.usdc": "Баланс USDC",
    "governance.treasury.totalTrades": "Всього угод",
    "governance.treasury.fees": "Накопичені комісії",
    "governance.treasury.loading": "Завантаження даних казни…",
    "governance.treasury.error": "Не вдалося завантажити дані казни",
    "governance.history.title": "Історія виконання",
    "governance.history.empty": "Виконаних пропозицій ще немає",
    "governance.history.proposal": "Пропозиція",
    "governance.history.type": "Тип",
    "governance.history.executedAt": "Виконано",
    "governance.history.outcome": "Результат",
    "governance.history.loading": "Завантаження історії…",
    "governance.status.active": "Активна",
    "governance.status.passed": "Прийнята",
    "governance.status.rejected": "Відхилена",
    "governance.status.executed": "Виконана",
    "governance.status.expired": "Прострочена",
    "governance.status.pending": "Очікує",
    "governance.status.cancelled": "Скасована",

    // vault.balance / vault.chain namespaces (Phase 3)
    "vault.balance.title": "Баланси сховища",
    "vault.balance.usdt": "Баланс USDT",
    "vault.balance.usdc": "Баланс USDC",
    "vault.balance.total": "Разом (USD)",
    "vault.balance.loading": "Отримуємо on-chain баланси…",
    "vault.balance.error": "Баланс недоступний",
    "vault.balance.lastSync": "Остання синхронізація",
    "vault.chain.erc20": "Ethereum (ERC-20)",
    "vault.chain.bep20": "BNB Chain (BEP-20)",
    "vault.chain.trc20": "Tron (TRC-20)",
    "vault.chain.spl": "Solana (SPL)",
    "vault.chain.polygon": "Polygon",
    "vault.chain.avalanche": "Avalanche",

    // Vault
    "vault.title": "Мій Гаманець",
    "vault.subtitle": "Адреси депозиту, отримані з вашого Internet Identity",
    "vault.refreshAll": "Оновити все",
    "vault.disclaimer":
      "Ці адреси отримані з вашого Internet Identity. Надсилайте лише USDT або USDC — надсилання інших токенів може призвести до їх безповоротної втрати.",
    "vault.disclaimerLabel": "Важливе повідомлення про депозити",
    "vault.depositAddress": "Адреса депозиту",
    "vault.addressNotAvailable": "Адреса недоступна",
    "vault.copyAddress": "Скопіювати адресу",
    "vault.refreshBalance": "Оновити баланс",
    "vault.lastUpdated": "Оновлено",
    "vault.fetchError": "Не вдалося завантажити дані. Спробуйте ще раз.",
    "vault.balanceError": "Не вдалося завантажити баланс. Спробуйте ще раз.",
    "vault.autoRefreshNote": "Баланси оновлюються автоматично кожні 5 хвилин",
    "vault.signInRequired": "Увійдіть для доступу до гаманця",
    "vault.signInDesc":
      "Для перегляду адрес і балансів вашого гаманця необхідна автентифікація через Internet Identity.",
    "nav.vault": "Гаманець",
    "vault.rateLastUpdated": "Курс USDT: {rate} · Оновлено {age}",
    "vault.rateJustNow": "щойно",
    "vault.rateMinutesAgo": "{n} хв тому",
    "vault.rateNotAvailable": "Курси стейблкоїнів недоступні",

    // Governance (Ukrainian)
    "nav.governance": "Управління",
    "gov.pageTitle": "Управління платформою",
    "gov.pageSubtitle":
      "Голосуйте за пропозиції та стежте за скарбницею платформи",
    "gov.createProposal": "Нова пропозиція",
    "gov.tab.active": "Активні пропозиції",
    "gov.tab.history": "Історія виконання",
    "gov.tab.treasury": "Скарбниця",
    "gov.noActive": "Немає активних пропозицій",
    "gov.noActiveDesc": "Зараз немає пропозицій, відкритих для голосування.",
    "gov.voteBtn": "Голосувати",
    "gov.loginToVote": "Увійдіть для участі в управлінні",
    "gov.voteModalTitle": "Подати голос",
    "gov.currentTally": "Поточний підрахунок",
    "gov.voteYes": "За",
    "gov.voteNo": "Проти",
    "gov.yourVote": "Ваш голос",
    "gov.submitVote": "Підтвердити голос",
    "gov.submitting": "Надсилання…",
    "gov.cancel": "Скасувати",
    "gov.voteError": "Не вдалося подати голос. Спробуйте ще раз.",
    "gov.createModalTitle": "Створити пропозицію",
    "gov.proposalType": "Тип пропозиції",
    "gov.description": "Опис",
    "gov.descriptionPlaceholder":
      "Чітко та детально опишіть пропозицію (мінімум 20 символів)…",
    "gov.descriptionHint": "Мінімум 20 символів",
    "gov.submitProposal": "Надіслати пропозицію",
    "gov.createError": "Не вдалося створити пропозицію. Спробуйте ще раз.",
    "gov.type.ParameterChange": "Зміна параметра",
    "gov.type.TreasuryTransfer": "Переказ зі скарбниці",
    "gov.type.TextResolution": "Текстова резолюція",
    "gov.typeDesc.ParameterChange":
      "Змінити параметр конфігурації платформи (наприклад, розмір комісії, тайм-аут угоди).",
    "gov.typeDesc.TreasuryTransfer":
      "Перевести кошти зі скарбниці платформи на вказану адресу.",
    "gov.typeDesc.TextResolution":
      "Загальна резолюція або заява, записана в блокчейні.",
    "gov.status.active": "Активна",
    "gov.status.passed": "Прийнята",
    "gov.status.rejected": "Відхилена",
    "gov.status.executed": "Виконана",
    "gov.status.expired": "Прострочена",
    "gov.treasury.title": "Баланс скарбниці",
    "gov.treasury.balanceNote":
      "Накопичені комісії платформи від завершених угод",
    "gov.treasury.recentFees": "Останні надходження комісій",
    "gov.treasury.noFees": "Надходжень комісій ще не зафіксовано",
    "gov.treasury.colTradeId": "ID угоди",
    "gov.treasury.colAmount": "Сума",
    "gov.treasury.colDate": "Дата",
    "gov.history.title": "Історія виконання",
    "gov.history.empty": "Виконаних пропозицій ще немає",
    "gov.history.colType": "Тип",
    "gov.history.colDescription": "Опис",
    "gov.history.colStatus": "Статус",
    "gov.history.colDate": "Дата",

    // Onboarding
    "onboarding.title": "Створити профіль",
    "onboarding.subtitle":
      "Налаштуйте профіль, щоб розпочати купівлю та продаж на маркетплейсі.",
    "onboarding.anonymityNote":
      "Можна використовувати будь-який нікнейм — реальна ідентичність не потрібна. Internet Identity зберігає вашу анонімність.",
    "onboarding.field.displayName": "Відображуване ім'я",
    "onboarding.field.bio": "Про вас",
    "onboarding.optional": "необов'язково",
    "onboarding.placeholder.displayName": "напр. CryptoTrader_UA, Олексій тощо",
    "onboarding.placeholder.bio":
      "Розкажіть іншим трохи про себе — що продаєте, звідки ви…",
    "onboarding.avatar.optional": "необов'язково",
    "onboarding.avatar.change": "Змінити аватар",
    "onboarding.avatar.uploaded": "Аватар збережено",
    "onboarding.avatar.uploadFailed": "Не вдалося завантажити аватар",
    "onboarding.submit": "Створити профіль",
    "onboarding.submitting": "Створення…",
    "onboarding.success": "Профіль створено!",
    "onboarding.footerHint":
      "Ваше ім'я буде відображатись іншим користувачам в оголошеннях і угодах.",
    "onboarding.validation.usernameRequired": "Ім'я обов'язкове",
    "onboarding.validation.usernameMin": "Мінімум {min} символів",
    "onboarding.validation.usernameMax": "Максимум {max} символів",
    "onboarding.error.notAuthenticated": "Спочатку увійдіть",
    "onboarding.error.unauthorized": "Немає авторизації — увійдіть знову",
    "onboarding.error.saveFailed": "Не вдалося зберегти профіль",

    // Upload errors
    "upload.errorAuthRequired":
      "Для завантаження файлів необхідно увійти в систему.",
    "upload.errorFailed": "Не вдалося завантажити фото. Спробуйте ще раз.",
    "upload.errorInitStorage": "Помилка ініціалізації сховища: ",
    "upload.errorCertStorage": "Помилка сертифікації сховища",
    "upload.error403": "Сервер відхилив завантаження (403). Деталі: ",
    "upload.errorEmptyUrl": "getDirectURL повернув порожній URL",

    // Package details
    "listing.packageDetails": "Параметри посилки",
    "listing.packageWeight": "Вага (кг)",
    "listing.packageLength": "Довжина (см)",
    "listing.packageWidth": "Ширина (см)",
    "listing.packageHeight": "Висота (см)",
    "listing.packagePlaces": "Місця",
    "listing.packageVolumetric": "Об'ємна вага",
    "listing.packageWeightHint": "Макс. 30 кг",
    "listing.packageDimHint": "Макс. 120 см кожен розмір",
    "listing.validation.weightRequired": "Вага повинна бути більше 0",
    "listing.validation.weightMax": "Вага не може перевищувати 30 кг",
    "listing.validation.dimMax": "Кожен розмір не може перевищувати 120 см",

    // Nova Poshta config
    "listing.novaPoshtaConfig": "Налаштування Нової Пошти",
    "listing.novaPoshtaEnable": "Увімкнути доставку Новою Поштою",
    "listing.deliveryTypes": "Типи доставки",
    "listing.deliveryBranch": "Доставка у відділення",
    "listing.deliveryCourier": "Кур'єрська доставка",
    "listing.deliveryLocker": "Поштомат",
    "listing.senderBranch": "Відділення відправника",

    // Ukrposhta config
    "listing.ukrposhtaConfig": "Налаштування Укрпошти",
    "listing.ukrposhtaEnable": "Увімкнути доставку Укрпоштою",
    "listing.ukrposhtaDeliveryTypes": "Типи доставки",
    "listing.ukrposhtaBranchToOffice": "Відділення до відділення",
    "listing.ukrposhtaCourierToDoor": "Кур'єр до дверей",
    "listing.ukrposhtaOfficeSearch": "Відділення відправника",
    "listing.ukrposhtaOfficeSearchPlaceholder": "Пошук за містом або адресою…",
    "listing.ukrposhtaOfficeSelect": "Оберіть відділення",
    "listing.ukrposhtaOfficeLoading": "Завантаження відділень…",
    "listing.ukrposhtaOfficeNoResults": "Відділень не знайдено",

    // Meest config
    "listing.meestConfig": "Налаштування Meest Express",
    "listing.meestEnable": "Увімкнути доставку Meest Express",
    "listing.meestDeliveryTypes": "Типи доставки",
    "listing.meestPudoDelivery": "Пункт видачі PUDO",
    "listing.meestHomeDelivery": "Доставка додому",
    "listing.meestPudoSearch": "Пункт відправлення PUDO",
    "listing.meestPudoSearchPlaceholder": "Пошук за містом або адресою…",
    "listing.meestPudoSelect": "Оберіть пункт PUDO",
    "listing.meestPudoLoading": "Завантаження пунктів PUDO…",
    "listing.meestPudoNoResults": "Пунктів PUDO не знайдено",

    // Digital goods — create listing
    "digital.field.fileHash": "Хеш файлу (необов'язково)",
    "digital.field.fileHashPlaceholder":
      "SHA-256 хеш для доказової бази диспуту",
    "digital.field.passwordProtection": "Увімкнути захист паролем",
    "digital.field.password": "Пароль",

    // Digital delivery — trade detail
    "digital.delivery.title": "Доступ до цифрового товару",
    "digital.delivery.fileUrl": "URL файлу",
    "digital.delivery.copyUrl": "Копіювати URL",
    "digital.delivery.password": "Пароль",
    "digital.delivery.copyPassword": "Копіювати пароль",
    "digital.delivery.fileHash": "Хеш файлу (для перевірки)",
    "digital.delivery.hashNote":
      "Порівняйте цей хеш із завантаженим файлом для перевірки його цілісності.",
    "digital.delivery.inspectionCountdown":
      "У вас є {hours} год {minutes} хв, щоб відкрити диспут, якщо файл неправильний.",
    "digital.delivery.inspectionExpired":
      "Термін перевірки минув. Кошти передані продавцю.",

    // Digital dispute
    "digital.dispute.button": "Відкрити цифровий диспут",
    "digital.dispute.title": "Відкрити диспут",
    "digital.dispute.reasonItemDiffers": "Файл неправильний або відсутній",
    "digital.dispute.reasonOther": "Інша причина",
    "digital.dispute.submit": "Подати диспут",

    // Liability tracking
    "liability.balance.title": "Баланс відповідальності",
    "liability.balance.zero": "Немає заборгованості",
    "liability.balance.positive": "Кредит: ${{amount}}",
    "liability.balance.negative":
      "Заборгованість: ${{amount}}. Створення оголошень може бути обмежено.",
    "liability.history.title": "Історія заборгованості",
    "liability.history.empty": "Немає записів про заборгованість.",
    "liability.history.col.date": "Дата",
    "liability.history.col.amount": "Сума",
    "liability.history.col.reason": "Причина",
    "liability.history.col.trade": "Угода",
    "liability.create.blocked":
      "Створення оголошення заблоковано через заборгованість.",
    "liability.reason.dispute_lost": "Спір програно",
    "liability.reason.cancellation_fee": "Комісія за скасування",
    "liability.reason.cross_collateral_seizure": "Погашення заборгованості",

    // Jury dispute status (on TradeDetailPage)
    "disputes.jury.underReview": "На розгляді журі",
    "disputes.jury.deadline": "Термін журі",
    "disputes.jury.deadlineCountdown": "Термін: {{hours}} год залишилось",
    "disputes.jury.voteTally":
      "Голоси: {{buyer}} за покупця / {{seller}} за продавця",
    "disputes.jury.noConsensus": "Час вийшов — передано адміністратору",
    "disputes.jury.escalatedToAdmin": "Передано адміністратору",
    "disputes.jury.noVoteYet": "Ви ще не проголосували",
    "disputes.jury.yourVote": "Ваш голос: {{choice}}",
    "disputes.jury.reasoningPlaceholder": "Поясніть своє рішення (обов'язково)",
    "disputes.doNotRelease": "Не відпускайте кошти — угода на розгляді",
    "disputes.resolution.buyerWins": "Вирішено: Покупець переміг",
    "disputes.resolution.sellerWins": "Вирішено: Продавець переміг",
    "disputes.resolution.split": "Вирішено: Поділено порівну",
    "disputes.resolution.notes": "Примітки до рішення",

    // Navigation
    "nav.paymentMethods": "Способи оплати",

    // Payment method page
    "payment.title": "Додати спосіб оплати",
    "payment.addressLabel": "Адреса гаманця",
    "payment.selectToken": "Виберіть мережу/токен",
    "payment.save": "Зберегти адресу",
    "payment.saved": "Адресу збережено!",
    "payment.savedMethods": "Збережені способи оплати",
    "payment.noMethods": "Способи оплати ще не додано.",
    "payment.remove": "Видалити",
    "payment.scanQR": "Сканувати QR",
    "payment.scanInstructions": "Наведіть камеру на QR-код гаманця",
    "payment.cameraPermissionDenied":
      "Доступ до камери заборонено. Увімкніть його в налаштуваннях браузера.",
    "payment.scanningAddress": "Сканування...",
    "payment.detectedNetwork": "Виявлено адресу {label} — вибрано {token}",
    "payment.invalidAddress": "Невірний формат адреси для обраної мережі",
    "payment.validAddress": "Адреса коректна",
    "payment.qrNotSupported":
      "Ваш браузер не підтримує сканування QR-кодів. Будь ласка, вставте адресу вручну.",

    // Network hints
    "payment.hint.USDT_TRC20":
      "USDT-TRC20: Адреса повинна починатися з 'T' і бути 34 символи довжиною.",
    "payment.hint.USDT_BEP20":
      "USDT-BEP20: Стандартна адреса 0x... сумісна з Ethereum (42 символи).",
    "payment.hint.USDT_ERC20":
      "USDT-ERC20: Стандартна адреса Ethereum 0x... (42 символи).",
    "payment.hint.USDC_ERC20":
      "USDC-ERC20: Стандартна адреса Ethereum 0x... (42 символи).",
    "payment.hint.USDC_BEP20":
      "USDC-BEP20: Стандартна адреса 0x... сумісна з Ethereum (42 символи).",
    "payment.hint.USDC_POLYGON":
      "USDC-Polygon: Стандартна адреса 0x... для мережі Polygon (42 символи).",
    "payment.hint.USDC_AVALANCHE":
      "USDC-Avalanche: Стандартна адреса 0x... для мережі Avalanche (42 символи).",
    "payment.hint.USDC_SPL":
      "USDC-SPL: Адреса Solana у форматі base58 (32–44 символи).",

    // Address verification
    "payment.verifyButton": "Перевірити адресу",
    "payment.verifying": "Перевірка активності адреси...",
    "payment.verifiedActive": "Адреса активна ({{count}} транзакцій)",
    "payment.verifiedInactive":
      "Формат адреси правильний, активність не підтверджена",
    "payment.verificationFailed":
      "Перевірка не вдалась. Ви можете зберегти адресу.",
    "payment.badge.level2": "Рівень 2 підтверджено",
    "payment.badge.formatValid": "Формат правильний",
    "payment.badge.unverified": "Не перевірено",
    "payment.noPaymentMethods": "Методи оплати ще не додані.",

    // Global backend error messages
    "errors.rateLimited": "Забагато запитів. Будь ласка, зачекайте.",
    "errors.invalidInput":
      "Неправильні дані. Будь ласка, перевірте введені значення.",
    "errors.unauthorized": "Ви не авторизовані. Будь ласка, увійдіть.",
    "errors.anonymousNotAllowed": "Будь ласка, увійдіть для продовження.",
    // TODO: rename key when backend contract changes
    "errors.escrowError": "Помилка транзакції. Спробуйте ще раз.",
    "errors.reentrancyError": "Ця дія вже обробляється. Будь ласка, зачекайте.",
    "errors.generic": "Щось пішло не так. Спробуйте ще раз.",
    "errors.banned": "Ваш обліковий запис призупинено.",
    "errors.disputeAlreadyOpen": "Суперечку для цієї угоди вже відкрито.",

    // Toast actions
    "toast.view_trade": "Перейти до угоди",

    // Notifications
    "notification.trade_funded":
      "Угоду профінансовано. Очікується ваше підтвердження.",
    "notification.buyer_confirmed": "Покупець підтвердив відправлення платежу.",
    "notification.payment_verified": "Платіж верифіковано в блокчейні.",
    "notification.trade_complete": "Угоду завершено!",
    "notification.trade_disputed": "Відкрито суперечку по угоді",
    "notification.trade_refunded": "Угоду повернено.",
    "notification.new_message": "Нове повідомлення в угоді",
    "notification.shipping_in_transit": "Доставка оновлена: В дорозі",
    "notification.shipping_delivered": "Посилку доставлено!",
    "notification.deadline_pending_24h":
      "Угода очікує вже 24 год. Зробіть дію.",
    "notification.deadline_funded_48h":
      "Угода профінансована 48 год тому. Перевірте платіж.",
    "notification.deadline_jury_12h":
      "До дедлайну журі в угоді залишилось менше 12 годин.",

    // Profile public view
    "profile.notFound.title": "Продавця не знайдено",
    "profile.notFound.description":
      "Цього продавця не існує або його було видалено.",
    "profile.notFound.browseBtn": "Переглянути оголошення",
    "profile.invalidLink.title": "Неправильне посилання на продавця",
    "profile.invalidLink.description":
      "Посилання на продавця, за яким ви перейшли, недійсне.",
    "profile.invalidLink.browseBtn": "Переглянути оголошення",
    "profile.listings.inactiveHidden": "Неактивні оголошення приховані",
    "profile.anonymousSeller": "Продавець без імені",

    // Deactivate / Reactivate flow (TASK-004)
    "detail.reactivateListing": "Відновити оголошення",
    "detail.reactivateConfirm": "Відновити це оголошення?",
    "detail.reactivateDesc": "Оголошення знову стане видимим для покупців.",
    "detail.reactivateSuccess": "Оголошення відновлено",
    "detail.reactivateError": "Не вдалося відновити оголошення",
    "detail.inactiveBanner": "Це оголошення неактивне",
    "profile.tabs.active": "Активні",
    "profile.tabs.inactive": "Неактивні",
    "listings.inactiveBadge": "Неактивне",

    // Trade flow — manual confirmation steps (TASK-006)
    "trade.step.initiated": "Угоду розпочато",
    "trade.step.awaitingPayment": "Очікування оплати",
    "trade.step.buyerConfirmed": "Покупець підтвердив відправку оплати",
    "trade.step.awaitingSeller": "Очікування підтвердження продавця",
    "trade.step.sellerConfirmed": "Продавець підтвердив отримання оплати",
    "trade.step.complete": "Угоду завершено",
    "trade.action.buyerSent": "Я відправив оплату",
    "trade.action.sellerReceived": "Я отримав оплату",
    "trade.hint.sendOffChain":
      "Відправте стейблкоїн на адресу продавця поза додатком, потім натисніть кнопку нижче.",
    "trade.hint.verifyOffChain":
      "Перевірте оплату у своєму гаманці або на біржі, потім підтвердіть нижче.",
    "trade.cancel": "Скасувати угоду",

    // Dispute modal i18n (TASK-006)
    "dispute.reason.itemNotReceived": "Товар не отримано",
    "dispute.reason.itemDiffers": "Товар відрізняється від опису",
    "dispute.reason.itemDamaged": "Товар прийшов пошкодженим",
    "dispute.reason.sellerUnresponsive": "Продавець не відповідає",
    "dispute.reason.other": "Інше",
    "dispute.openedMessage": "Диспут відкрито. Модератор розгляне вашу справу.",
    "dispute.form.title": "Відкрити диспут",
    "dispute.form.reason": "Причина",
    "dispute.form.description": "Опис",

    // TASK-007: Trade detail UX hardening
    "trade.dispute.chatBanner":
      "Ця угода під диспутом. Використовуйте чат для надання доказів та спілкування з модератором.",
    "trade.cancelled.chatBanner":
      "Цю угоду скасовано. Чат залишається відкритим для довідки.",
    "trade.instructions.USDT_TRC20.title":
      "Надішліть USDT в мережі Tron (TRC20)",
    "trade.instructions.USDT_TRC20.body":
      "Використовуйте мережу TRC20. НЕ надсилайте TRC10 або будь-яку іншу мережу. Адреси Tron починаються з 'T'. Перевірте адресу з продавцем перед відправкою.",
    "trade.instructions.USDT_TRC20.warning":
      "Відправка в неправильній мережі призведе до безповоротної втрати коштів.",
    "trade.instructions.USDT_BEP20.title":
      "Надішліть USDT в мережі BSC (BEP20)",
    "trade.instructions.USDT_BEP20.body":
      "Використовуйте мережу BEP20 в Binance Smart Chain. Адреси BSC починаються з '0x'. Переконайтеся, що у вас є невелика кількість BNB для газу, якщо ви надсилаєте з власного гаманця.",
    "trade.instructions.USDT_BEP20.warning":
      "Відправка в неправильній мережі (наприклад, ERC20) призведе до безповоротної втрати коштів.",
    "trade.instructions.USDT_ERC20.title":
      "Надішліть USDT в мережі Ethereum (ERC20)",
    "trade.instructions.USDT_ERC20.body":
      "Використовуйте мережу ERC20 в Ethereum. Адреси починаються з '0x'. Переконайтеся, що у вас достатньо ETH для комісій. Транзакції Ethereum можуть підтвердитися за кілька хвилин.",
    "trade.instructions.USDT_ERC20.warning":
      "Відправка в неправильній мережі призведе до безповоротної втрати коштів.",
    "trade.instructions.USDC_ERC20.title":
      "Надішліть USDC в мережі Ethereum (ERC20)",
    "trade.instructions.USDC_ERC20.body":
      "Використовуйте мережу ERC20 в Ethereum. Адреси починаються з '0x'. Переконайтеся, що у вас достатньо ETH для комісій. Транзакції Ethereum можуть підтвердитися за кілька хвилин.",
    "trade.instructions.USDC_ERC20.warning":
      "Відправка в неправильній мережі призведе до безповоротної втрати коштів.",
    "trade.sellerReminder.title": "Перевірте оплату перед підтвердженням",
    "trade.sellerReminder.body":
      "Покупець стверджує, що відправив {amount} {token}. Перевірте свій гаманець або біржу на вхідну транзакцію перед підтвердженням отримання.",
    "trade.sellerReminder.warning":
      "Підтвердження отримання без фактичної оплати може призвести до втрати коштів.",

    // TASK-008: Boundary validation + admin scope
    "validation.title.min": "Заголовок має містити щонайменше 3 символи.",
    "validation.title.max": "Заголовок не може перевищувати 120 символів.",
    "validation.description.max": "Опис не може перевищувати 2000 символів.",
    "validation.price.range": "Ціна має бути від $0 до $1 000 000.",
    "validation.photos.max": "Ви можете завантажити не більше 10 фотографій.",
    "create.validation.photoType":
      "Непідтримуваний тип файлу. Використовуйте JPG, PNG, WEBP, HEIC або GIF.",
    "create.validation.photoSize":
      "Файл занадто великий. Максимальний розмір — 10 МБ.",
    "validation.location.max":
      "Місцезнаходження не може перевищувати 100 символів.",
    "validation.username.format":
      "Нікнейм може містити лише літери, цифри, пробіли та підкреслення.",
    "validation.bio.max": "Біо не може перевищувати 500 символів.",
    "admin.scope.note":
      "Обсяг стейблкоїнів обмежено затвердженим набором із 4 токенів.",
    "profile.avatar.sizeError": "Зображення аватару має бути менше 5 МБ.",

    // TASK-009: Shipping TTN fallback + tracking display + dispute improvements
    "shipping.manualTTN.label": "Введіть номер ТТН вручну",
    "shipping.manualTTN.placeholder": "Номер ТТН",
    "shipping.tracking.empty":
      "Ще немає оновлень відстеження. Якщо у вас є номер ТТН, введіть його вище.",
    "shipping.tracking.loading": "Завантаження оновлень відстеження…",
    "dispute.reason.notShipped": "Продавець не відправив товар",
    "dispute.reason.payment": "Проблема з оплатою",
    "dispute.alreadyOpened": "Диспут вже відкрито",
    // Upload errors — new keys
    "upload.error403Auth":
      "Помилка автентифікації сховища. Спробуйте оновити сторінку.",
    "upload.errorCanisterId":
      "Неможливо підключитись до сервера. Оновіть сторінку або спробуйте пізніше.",
    "upload.errorPreviewDeployment":
      "Завантаження файлів доступне лише в опублікованій версії.",
    "upload.errorNetwork":
      "Помилка мережі під час завантаження. Перевірте підключення.",
    "upload.previewBanner":
      "Завантаження фото доступне лише в опублікованій версії. Відкрийте live-версію, щоб додати фото.",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(locale: Locale, key: TranslationKey): string {
  return (
    (translations[locale] as Record<string, string>)[key] ??
    (translations.en as Record<string, string>)[key] ??
    key
  );
}
