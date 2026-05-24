import Time "mo:core/Time";
import Int "mo:core/Int";

module {

  // ─── Shared primitives ────────────────────────────────────────────────────

  public type UserId    = Principal;
  public type ListingId = Nat;
  public type TradeId   = Nat;
  public type DisputeId = Nat;
  public type MessageId = Nat;
  public type FeedbackId = Nat;
  public type Timestamp = Nat;   // nanoseconds since epoch (Candid-safe)

  /// Current time as a Candid-safe timestamp.
  public func now() : Timestamp {
    Time.now().toNat()
  };

  /// Maps absent optional Nat to 0 for Candid shared return types (Caffeine M0032).
  public func optNat(n : ?Nat) : Nat {
    switch (n) { case null 0; case (?v) v }
  };

  // ─── Payment tokens ───────────────────────────────────────────────────────

  public type TradeToken = {
    // ICP-native ICRC-1 stablecoins (on-chain escrow path)
    #ckUSDC;
    #ckUSDT;
    // External stablecoins (HTTP outcall verification path)
    #USDT_TRC20;
    #USDT_BEP20;
    #USDC_SPL;
    #USDT_ERC20;
    #USDC_ERC20;
    #USDT_POLYGON;
    #USDC_POLYGON;
    #USDT_AVAX;
    #USDC_AVAX;
  };

  // ─── Shipping ─────────────────────────────────────────────────────────────

  /// Weight in grams, dimensions in cm, declaredValue in kopiykas.
  public type PackageDetails = {
    weight       : Nat;
    length       : Nat;
    width        : Nat;
    height       : Nat;
    places       : Nat;   // number of packages, default 1
    declaredValue : Nat;  // kopiykas, for insurance
  };

  /// Nova Poshta seller configuration for a listing.
  public type NovaPoshtaConfig = {
    enabled       : Bool;
    deliveryTypes : [Text];    // e.g. ["branch", "courier", "locker"]
    senderBranchRef : Text;    // Nova Poshta warehouse Ref
  };

  /// Ukrposhta seller configuration for a listing.
  public type UkrposhtaConfig = {
    enabled          : Bool;
    deliveryTypes    : [Text];  // e.g. ["branch", "courier"]
    senderOfficeRef  : ?Text;   // Ukrposhta office index, e.g. "01001"
  };

  /// Meest Express seller configuration for a listing.
  public type MeestConfig = {
    enabled        : Bool;
    deliveryTypes  : [Text];  // e.g. ["pudo", "home_delivery"]
    senderPudoRef  : ?Text;   // Meest PUDO id, e.g. "UA001"
  };

  /// Buyer's shipping selection when initiating a trade.
  public type ShippingSelection = {
    provider     : Text;    // e.g. "nova_poshta"
    deliveryType : Text;    // e.g. "branch"
    branchRef    : ?Text;   // warehouse Ref if branch/locker delivery
    address      : ?Text;   // street address if courier delivery
    cost         : Nat;     // kopiykas
  };

  /// TTN (waybill) creation status for a trade.
  public type TTNStatus = {
    #Pending;
    #InProgress;
    #Success;
    #Failed;
  };

  /// A Nova Poshta branch (warehouse) returned by Address.getWarehouses.
  public type NovaPoshtaBranch = {
    ref      : Text;
    name     : Text;
    address  : Text;
    cityRef  : Text;
    schedule : ?Text;
  };

  public type ShippingCarrier = {
    #nova_poshta;
    #ukrposhta;
    #meest;
    #self_pickup;
    #digital;
  };

  public type ShippingServiceType = {
    #standard;
    #express;
  };

  public type ShippingMethod = {
    carrier       : ShippingCarrier;
    type_         : ShippingServiceType;
    estimatedDays : Nat;
  };

  /// Aggregated option for getShippingOptions — one entry per carrier.
  public type ShippingOption = {
    carrier      : ShippingCarrier;
    cost         : Float;    // DEPRECATED — use costNat instead. Kept for Candid backward compat. Value is always 0.0.
    costNat      : Nat;      // Cost in kopiykas (UAH × 100). Primary monetary field.
    deliveryDays : Nat;
    available    : Bool;
  };

  // ─── Address verification ─────────────────────────────────────────────────

  /// Level 2 on-chain address verification result.
  /// level: 1 = format only, 2 = on-chain verified (active transaction history)
  /// active: true if address has on-chain activity
  /// txCount: number of transactions found (0 = no activity or API unavailable)
  /// verifiedAt: when the verification was performed (nanoseconds)
  /// expiresAt: verifiedAt + 24h; after this the cached result is stale
  public type AddressVerification = {
    level      : Nat;        // 1 = format, 2 = on-chain
    active     : Bool;
    txCount    : Nat;
    verifiedAt : Nat;
    expiresAt  : Nat;  // verifiedAt + 24h in nanoseconds
  };

  /// A seller's saved payment method (crypto address for a specific stablecoin).
  /// Migrated from localStorage (seller_payment_methods) to backend persistence in Week 3.4.
  public type PaymentMethod = {
    token        : TradeToken;
    address      : Text;
    addedAt      : Nat;
    verification : ?AddressVerification;
    /// E4.S7 — optional link to a nonce-proof verified external wallet id (0 = none).
    walletLinkId : Nat;
  };

  // ─── External wallet linking (E4.S7 / FR-28) ─────────────────────────────

  public type WalletLinkPurpose = {
    #payout;
    #stake;
    #payment;
  };

  public type WalletChain = {
    #tron;
    #evm_bsc;
    #evm_eth;
  };

  public type WalletLinkChallengeView = {
    challengeId : Nat;
    message     : Text;
    expiresAt   : Nat;
    sessionId   : Text;
    chain       : WalletChain;
    address     : Text;
    purpose     : WalletLinkPurpose;
  };

  public type LinkedExternalWallet = {
    id          : Nat;
    chain       : WalletChain;
    address     : Text;
    purpose     : WalletLinkPurpose;
    linkedAt    : Nat;
    sessionId   : Text;
    messageHash : Text;
  };

  /// Immutable payout destination captured at PaymentIntent / fund lock (D-015).
  public type PayoutWalletSnapshot = {
    walletLinkId    : Nat;
    address         : Text;
    token           : TradeToken;
    chain           : WalletChain;
    snapshottedAt   : Nat;
  };

  // ─── Liability ────────────────────────────────────────────────────────────

  public type LiabilityReason = {
    #dispute_lost;
    #cancellation_fee;
    #seller_fault;
    #stake_seizure_residual;
    #buyer_cancel_compensation;
    #admin_adjustment;
  };

  public type LiabilityStatus = {
    #open;
    #partial;
    #cleared;
  };

  public type LiabilityAuditAction = {
    #created;
    #stake_applied;
    #partial_clear;
    #full_clear;
  };

  public type LiabilityAuditEntry = {
    action      : LiabilityAuditAction;
    amount      : Nat;       // USD cents affected
    performedBy : Principal;
    note        : Text;
    timestamp   : Nat;
  };

  /// Global liability record with unique ID (E6.S6 Wave 3 depth).
  public type LiabilityRecord = {
    id               : Nat;
    userId           : UserId;
    var originalAmount   : Nat;   // USD cents owed at creation
    var remainingBalance : Nat;   // USD cents still outstanding
    currency         : TradeToken;
    reason           : LiabilityReason;
    initiator        : Principal;
    tradeId          : ?TradeId;
    var status       : LiabilityStatus;
    createdAt        : Nat;
    var updatedAt    : Nat;
    var auditTrail   : [LiabilityAuditEntry];
  };

  /// Admin dashboard view — immutable snapshot.
  public type LiabilityRecordView = {
    id               : Nat;
    userId           : UserId;
    originalAmount   : Nat;
    remainingBalance : Nat;
    currency         : TradeToken;
    reason           : LiabilityReason;
    initiator        : Principal;
    tradeId          : ?TradeId;
    status           : LiabilityStatus;
    createdAt        : Nat;
    updatedAt        : Nat;
    auditTrail       : [LiabilityAuditEntry];
  };

  /// A single liability event recorded against a user (amount in USD cents).
  /// amount > 0 means the user owes money (liability increased).
  public type LiabilityEvent = {
    liabilityId : Nat;   // 0 = none
    amount        : Int;       // USD cents; positive = liability added
    reason        : Text;      // e.g. "dispute_lost", "cancellation_fee"
    tradeId       : Nat;     // 0 = none
    timestamp     : Nat;
  };

  /// Settlement path for seller-fault waterfall (E6.S7 / D-041).
  public type SettlementPath = {
    #manual;
    #on_chain_ck;
  };

  /// Honest buyer-facing copy tier after seller-fault waterfall (E6.S7).
  public type SettlementCopyTier = {
    #manual_restriction_only;
    #partial_recovery;
    #on_chain_recovery;
  };

  /// Buyer-facing seller-fault settlement summary (E6.S7).
  public type SellerFaultSettlementView = {
    tradeId                 : TradeId;
    liabilityId             : ?Nat;
    path                    : SettlementPath;
    copyTier                : SettlementCopyTier;
    buyerObligationCents    : Nat;
    stakeSeizedCents        : Nat;
    insurancePayoutId       : ?Nat;
    residualCents           : Nat;
    onChainRefundExpected   : Bool;
  };

  // ─── User ─────────────────────────────────────────────────────────────────

  public type UserRole = {
    #user;
    #moderator;
    #admin;
  };

  public type TrustLevel = {
    #new_;
    #bronze;
    #silver;
    #gold;
  };

  /// Optional KYC tier — admin-assigned in Phase 1; provider flow in Phase 3.
  public type KycTier = {
    #none;
    #verified;
  };

  public type User = {
    id              : UserId;
    var username    : Text;
    var bio         : Text;
    var avatarUrl   : Text;
    var role        : UserRole;
    createdAt       : Nat;
    var reputationScore    : Int;  // combined trust score (tier gates)
    var buyerScore         : Int;
    var sellerScore        : Int;
    var trustLevel         : TrustLevel;
    var kycTier            : KycTier;
    var isBanned           : Bool;
    var suspendedUntil     : ?Nat;
    var liabilityBalance   : Int;           // USD cents; negative = user owes the platform
    var liabilityHistory   : [LiabilityEvent];
    var paymentMethods     : [PaymentMethod];
    var linkedWallets      : [LinkedExternalWallet];
    var accountClosedAt    : ?Nat;    // set when user closes account (GDPR anonymize)
  };

  /// Public-facing subset — no mutable fields, safe to return over Candid
  public type UserProfile = {
    id              : UserId;
    username        : Text;
    bio             : Text;
    avatarUrl       : Text;
    role            : UserRole;
    createdAt       : Nat;
    reputationScore : Int;
    buyerScore      : Int;
    sellerScore     : Int;
    trustLevel      : TrustLevel;
    kycTier         : KycTier;
    isBanned        : Bool;
    suspendedUntil  : Nat;   // 0 = not suspended
    liabilityBalance : Int;
    liabilityHistory : [LiabilityEvent];
    paymentMethods   : [PaymentMethod];
    linkedWallets    : [LinkedExternalWallet];
    accountClosedAt  : Nat;  // 0 = open
  };

  // ─── Listing ──────────────────────────────────────────────────────────────

  public type CategoryId = Nat;

  /// OLX-aligned taxonomy node (static catalog in CategoryCatalog.mo).
  public type CategoryNode = {
    id : CategoryId;
    parentId : ?CategoryId;
    slug : Text;
    labelUk : Text;
    labelEn : Text;
    legacyCategory : ListingCategory;
  };

  /// Schema field for OLX-style vertical attributes (auto, real estate).
  public type CategoryAttributeField = {
    key : Text;
    labelEn : Text;
    labelUk : Text;
    fieldType : { #text; #number };
    required : Bool;
  };

  public type CategoryAttributeValue = {
    key : Text;
    value : Text;
  };

  public type ListingCategory = {
    #electronics;
    #clothing;
    #books;
    #services;
    #digital;
    #other;
  };

  public type ItemCondition = {
    #new_;
    #likeNew;
    #good;
    #fair;
    #poor;
  };

  public type ListingStatus = {
    #draft;
    #active;
    #inactive;
    #sold;
    #removed;
  };

  public type ListingStakeStatus = {
    #locked;
    #released;
    #seized;
  };

  public type ListingStakeRecord = {
    listingId : ListingId;
    seller : UserId;
    token : TradeToken;
    var amount : Nat;
    var status : ListingStakeStatus;
    lockedAt : Nat;
  };

  public type StakeBalance = {
    var available : Nat;
    var locked : Nat;
  };

  /// Candid-safe stake balance (no var fields).
  public type StakeBalanceView = {
    available : Nat;
    locked : Nat;
  };

  /// Candid-safe listing stake record (no var fields).
  public type ListingStakeView = {
    listingId : ListingId;
    seller : UserId;
    token : TradeToken;
    amount : Nat;
    status : ListingStakeStatus;
    lockedAt : Nat;
  };

  public type Listing = {
    id              : ListingId;
    seller          : UserId;
    var title       : Text;
    var description : Text;
    var category    : ListingCategory;
    var categoryId  : CategoryId;
    var priceAmount : Nat;
    var priceToken  : TradeToken;
    var condition   : ItemCondition;
    var photos      : [Text];
    var location    : Text;
    var shippingMethods : [ShippingMethod];
    isDigital       : Bool;
    var digitalFileUrl : ?Text;
    var status      : ListingStatus;
    createdAt       : Nat;
    var expiresAt   : Nat;
    var viewCount   : Nat;
    var packageDetails    : ?PackageDetails;
    var novaPoshtaConfig  : ?NovaPoshtaConfig;
    var ukrposhtaConfig   : ?UkrposhtaConfig;
    var meestConfig       : ?MeestConfig;
     var digitalFileHash           : ?Text;   // SHA-256 hash for dispute evidence (optional)
     var digitalPassword           : ?Text;   // Password revealed to buyer after payment (optional) — DEPRECATED, kept as fallback for pre-encryption data
     var digitalFileUrlEncrypted   : ?Text;   // XOR-encrypted digitalFileUrl (hex-encoded). Preferred over plain digitalFileUrl.
     var digitalPasswordEncrypted  : ?Text;   // XOR-encrypted digitalPassword (hex-encoded). Preferred over plain digitalPassword.
     var digitalFileAsset          : ?DigitalFileAsset; // E2.S11 immutable upload metadata
     var resolvedAt        : ?Nat;  // When listing entered resolved state (sold/deactivated/expired). null = active/reactivating
    var bumpedAt          : Nat;   // Last bump — used for OLX-style refresh ordering
    var promotedUntil     : ?Nat; // VIP/promoted window (admin)
    var attributes        : [CategoryAttributeValue];
  };

  /// Lightweight card for list views
  public type ListingCard = {
    id               : ListingId;
    title            : Text;
    description      : Text;
    priceAmount      : Nat;
    priceToken       : TradeToken;
    photos           : [Text];
    location         : Text;
    sellerUsername   : Text;
    sellerRating     : Int;
    sellerTrustLevel : TrustLevel;
    sellerPrincipal  : UserId;
    condition        : ItemCondition;
    shippingMethods  : [ShippingMethod];
    category         : ListingCategory;
    categoryId       : CategoryId;
    categorySlug     : Text;
    status           : ListingStatus;
    createdAt        : Nat;
    digitalFileUrl   : Text;
    isPromoted       : Bool;
    attributes       : [CategoryAttributeValue];
  };

  public type TrackingTimelineEntry = {
    timestamp : Nat;
    status : Text;
  };

  // ─── Engagement (Phase B — OLX parity) ────────────────────────────────────

  public type SavedSearchId = Nat;

  public type SavedSearch = {
    id            : SavedSearchId;
    owner         : UserId;
    name          : Text;
    paramsJson    : Text;
    createdAt     : Nat;
    alertsEnabled : Bool;
  };

  public type ListingInquiryId = Nat;

  public type ListingInquiry = {
    id        : ListingInquiryId;
    listingId : ListingId;
    buyer     : UserId;
    seller    : UserId;
    createdAt : Nat;
  };

  public type ListingInquiryMessageId = Nat;

  public type ListingInquiryMessage = {
    id        : ListingInquiryMessageId;
    inquiryId : ListingInquiryId;
    sender    : UserId;
    content   : Text;
    createdAt : Nat;
  };

  /// Moderation report stored on-chain (Caffeine draft compatibility).
  public type ListingReport = {
    id        : Nat;
    listingId : ListingId;
    reporter  : UserId;
    reason    : Text;
    details   : Text;
    createdAt : Nat;
  };

  // ─── Digital delivery ─────────────────────────────────────────────────────

  /// Immutable encrypted file metadata linked to a digital listing (E2.S11).
  public type DigitalFileAsset = {
    fileVersionId    : Nat;
    blobHash           : Text;   // sha256:… object-storage ciphertext hash
    mimeType           : Text;
    sizeBytes          : Nat;
    blobUrlEncrypted   : Text;   // encrypted download URL (hex)
    dekEncrypted       : Text;   // random per-listing DEK, encrypted at rest (hex)
    contentHash        : ?Text;  // SHA-256 of plaintext for dispute evidence
    registeredAt       : Nat;
  };

  /// Delivery record snapshot for Candid views (no optional Nat).
  public type DigitalDeliveryView = {
    fileUrl             : Text;
    fileHash            : ?Text;
    password            : ?Text;
    fileVersionId       : Nat;
    mimeType            : ?Text;
    dekHex              : ?Text;
    deliveryRecordAt    : Nat;
    revealedAt          : Nat;   // 0 = never
    inspectionDeadline  : Nat;   // 0 = unset
  };

  /// Delivery record created after funding — buyer decrypt key + inspection anchor.
  public type DigitalDelivery = {
    fileUrl             : Text;
    fileHash            : ?Text;
    password            : ?Text;
    fileVersionId       : Nat;
    mimeType            : ?Text;
    dekHex              : ?Text;       // buyer decrypt key (hex) — only after funding
    deliveryRecordAt    : Nat;   // E7.S2 inspection clock anchor
    var revealedAt          : ?Nat;
    var inspectionDeadline  : ?Nat;
  };

  // ─── Trade / Escrow ───────────────────────────────────────────────────────

  public type TradeStatus = {
    #awaiting_approval;  // ICRC-1 path: buyer needs to call icrc2_approve
    #awaiting_seller_handshake; // E3.S7: seller must confirm within 24h before payment
    #payment_intent;     // E3.S7/E3.S10: seller confirmed — buyer may pay
    #manual_payment_pending; // E3.S10: PaymentIntent issued — explorer verify pending
    #payment_intent_expired; // E3.S10: intent expired before verify (fail-closed)
    #cancelled_no_seller_response; // E3.S7: seller declined or 24h timeout — buyer 100%
    #pending;            // Legacy/manual: awaiting payment (pre-handshake trades)
    #funded;             // ICRC-1 path: tokens locked in canister escrow
    #buyer_confirmed;    // Manual path: buyer confirmed sending
    #payment_verified;   // Phase 2: automated blockchain verification succeeded
    #digital_delivered;  // E2.S11: auto-delivery complete — 24h inspection window active
    #fulfillment_pending; // E7.S3: physical goods — payment locked, awaiting valid NP TTN
    #shipped;            // E7.S3: valid TTN accepted by carrier
    #awaiting_receipt;   // E7.S3: in transit / delivered grace window
    #complete;
    #refunded;
    #disputed;       // legacy — treat as dispute_l1 in guards
    #dispute_l1;     // E6.S9 — L1 mediation, payout frozen
    #dispute_l2;     // E6.S9 — moderator queue, payout frozen
    #cancelled;
    #cancelled_buyer_pre_ship; // E3.S9: buyer unilateral cancel before shipment — 85/10/5
  };

  /// Penalty split when buyer cancels before shipment (E3.S9 / FR-21c / D-009, D-025).
  /// On-chain settlement operation queued until ICRC transfers succeed (E9.S3 / D-037).
  public type OnChainSettlementOp = {
    #releaseToSeller;
    #refundBuyer : { memo : Text };
    #buyerCancelSplit : BuyerCancelPenaltySplit;
    #disputeBuyerWins;
    #disputeSellerWins : { sellerHasNegativeRep : Bool };
    #disputeSplit : { sellerHasNegativeRep : Bool };
  };

  public type PendingOnChainSettlement = {
    op           : OnChainSettlementOp;
    targetStatus : TradeStatus;
    queuedAt     : Nat;
    attempts     : Nat;
    lastError    : ?Text;
  };

  /// Candid-safe pending settlement snapshot (alias — no var fields).
  public type PendingOnChainSettlementView = PendingOnChainSettlement;

  public type BuyerCancelPenaltySplit = {
    lockedAmount       : Nat;
    buyerRefund        : Nat;
    sellerCompensation : Nat;
    platformFee        : Nat;
  };

  /// Settlement path recorded on PaymentIntent (E3.S10 / D-016).
  public type PaymentSettlementPath = {
    #manual;
    #ck;
  };

  /// Immutable payment obligation after seller handshake (E3.S10 / FR-21b).
  public type PaymentIntent = {
    token       : TradeToken;
    network     : Text;
    exactAmount : Nat;
    recipient   : Text;
    expiry      : Nat;
    path        : PaymentSettlementPath;
    createdAt   : Nat;
  };

  /// Buyer-facing fee breakdown before trade commit (E3.S8 / FR-12).
  public type TradeFeeQuote = {
    itemPrice          : Nat;
    platformFeeAmount  : Nat;
    platformFeeBps     : Nat;
    totalBuyerAmount   : Nat;
    token              : TradeToken;
    usesDefaultFeeBps  : Bool;
  };

  /// On-chain escrow account — one per ICRC-1 trade.
  /// Tracks the locked funds and all parties needed for settlement.
  public type EscrowAccount = {
    tradeId          : TradeId;
    buyerPrincipal   : UserId;
    sellerPrincipal  : UserId;
    token            : TradeToken;
    amount           : Nat;       // in e8s (8 decimal places)
    fee              : Nat;       // 1% platform fee in e8s
    ledgerCanisterId : Principal; // ICRC-1 ledger canister
    lockedAt         : Nat;
    deadline         : Nat; // refund deadline
  };

  // ─── Payment verification (Phase 2) ──────────────────────────────────────

  public type PaymentVerificationStatus = {
    #verified;
    #pending;
    #failed;
  };

  public type PaymentVerificationResult = {
    status             : PaymentVerificationStatus;
    txHash             : Text;
    confirmedAmount    : Float;
    confirmedRecipient : Text;
    blockNumber        : Nat;
    errorReason        : ?Text;
  };

  public type Trade = {
    id            : TradeId;
    listing       : ListingId;
    buyer         : UserId;
    seller        : UserId;
    amount        : Nat;
    token         : TradeToken;
    var status    : TradeStatus;
    createdAt     : Nat;
    var fundedAt       : ?Nat;
    var confirmedAt    : ?Nat;
    var completedAt    : ?Nat;
    var refundDeadline : ?Nat;
    /// Seller must confirm/decline by this time (E3.S7 / FR-21a).
    var sellerResponseDeadline : ?Nat;
    /// Set when tokens are locked on-chain (ICRC-1 path only)
    var escrowAccount  : ?EscrowAccount;
    var shippingSelection   : ?ShippingSelection;
    var ttnNumber           : ?Text;
    var ttnCreationStatus   : TTNStatus;
    var digitalDelivery     : ?DigitalDelivery;
    /// E2.S11 / E7.S2 — persisted inspection clock anchor (nanoseconds).
    var deliveryRecordAt    : ?Nat;
    /// D-015 — payout wallet frozen at PaymentIntent / post-handshake lock.
    var payoutWalletSnapshot : ?PayoutWalletSnapshot;
    var payoutWalletHeld     : Bool;
    /// E3.S10 — post-handshake payment obligation (token, amount, recipient, expiry, path).
    var paymentIntent        : ?PaymentIntent;
    /// D-019 — seller must ship with valid NP TTN by this time (physical trades).
    var shipByDeadline       : ?Nat;
    /// When seller marked shipped with valid TTN.
    var shippedAt            : ?Nat;
    /// When NP tracking first reported delivered/вручено.
    var npDeliveredAt        : ?Nat;
    /// npDeliveredAt + 48h — auto-complete if no dispute (D-003).
    var npDeliveredGraceEndsAt : ?Nat;
    /// Gate C — ICRC settlement deferred until ledger success (E9.S3).
    var pendingOnChainSettlement : ?PendingOnChainSettlement;
  };

  /// Public-facing trade snapshot — no mutable fields, safe over Candid.
  public type TradeView = {
    id             : TradeId;
    listing        : ListingId;
    buyer          : UserId;
    seller         : UserId;
    amount         : Nat;
    token          : TradeToken;
    status         : TradeStatus;
    createdAt      : Nat;
    fundedAt       : Nat;
    confirmedAt    : Nat;
    completedAt    : Nat;
    refundDeadline : Nat;
    sellerResponseDeadline : Nat;
    escrowAccount  : ?EscrowAccount;
    shippingSelection  : ?ShippingSelection;
    ttnNumber          : ?Text;
    ttnCreationStatus  : TTNStatus;
    digitalDelivery    : ?DigitalDeliveryView;
    deliveryRecordAt   : Nat;
    payoutWalletSnapshot : ?PayoutWalletSnapshot;
    payoutWalletHeld     : Bool;
    paymentIntent        : ?PaymentIntent;
    shipByDeadline       : Nat;
    shippedAt            : Nat;
    npDeliveredAt        : Nat;
    npDeliveredGraceEndsAt : Nat;
    pendingOnChainSettlement : ?PendingOnChainSettlementView;
  };

  // ─── Dispute ──────────────────────────────────────────────────────────────

  public type DisputeReason = {
    #item_not_received;
    #item_damaged;
    #seller_unresponsive;
    #item_differs;
    #other;
  };

  public type DisputeStatus = {
    #draft;            // E6.S9 — evidence incomplete, trade not frozen
    #opened;           // E6.S9 L1 — party mediation
    #l2_queued;        // E6.S9 L2 — moderator queue
    #under_review;
    #resolved;
    #escalated_to_admin;
  };

  public type DisputeLevel = {
    #l1;
    #l2;
  };

  public type DisputeTradeKind = {
    #physical;
    #digital;
  };

  /// Structured evidence checklist for dispute playbook (E6.S9 / FR-41).
  public type DisputeEvidencePack = {
    ttnScreenshotUrl  : ?Text;
    packagePhotoUrls  : [Text];
    chatThreadLink    : ?Text;
    fileHash          : ?Text;
    downloadTimestamp : Nat;   // 0 = none
  };

  public type ResolutionOutcome = {
    #buyer_wins;
    #seller_wins;
    #split;
  };

  public type DisputeResolution = {
    outcome   : ResolutionOutcome;
    notes     : Text;
    resolvedBy : UserId;
  };

  public type Dispute = {
    id          : DisputeId;
    trade       : TradeId;
    initiator   : UserId;
    var reason      : DisputeReason;
    var description  : Text;
    var evidenceUrls : [Text];
    /// Rich media evidence attachments uploaded via object storage (v65+).
    var evidenceAttachments : [MediaAttachment];
    var status       : DisputeStatus;
    var resolution   : ?DisputeResolution;
    createdAt        : Nat;
    var resolvedAt   : ?Nat;
    var moderatorNotes : [Text];
    /// E6.S9 playbook — level, SLA anchors, evidence checklist.
    var level                : DisputeLevel;
    var tradeKind            : DisputeTradeKind;
    var evidencePack         : DisputeEvidencePack;
    var l1SlaDeadline        : Nat;
    var l2QueuedAt           : ?Nat;
    var l2TriageDeadline     : ?Nat;
    var l2DecisionDeadline   : ?Nat;
  };

  // ─── Jury pool ────────────────────────────────────────────────────────────

  public type JurorEntry = {
    principal         : Principal;
    stakedAmount      : Float;
    var activeDisputeIds : [Text];
    var resolvedCount : Nat;
    var successRate   : Float;
    var registeredAt  : Nat;
  };

  public type JurorVoteChoice = {
    #buyerWins;
    #sellerWins;
  };

  public type JurorVote = {
    jurorPrincipal : Principal;
    vote           : JurorVoteChoice;
    timestamp      : Int;
    reasoning      : Text;
  };

  public type JuryAssignment = {
    disputeId    : DisputeId;
    var jurorIds : [Principal];
    var votes    : [JurorVote];
    var deadline : Nat;
  };

  /// Public-facing juror info for the dashboard
  public type JurorDashboardEntry = {
    disputeId   : DisputeId;
    tradeId     : TradeId;
    reason      : DisputeReason;
    deadline    : Nat;
    hasVoted    : Bool;
    buyerVotes  : Nat;
    sellerVotes : Nat;
    totalJurors : Nat;
  };

  /// Public-facing juror stats (admin view)
  public type JurorStats = {
    principal     : Principal;
    stakedAmount  : Float;
    activeCount   : Nat;
    resolvedCount : Nat;
    successRate   : Float;
    registeredAt  : Nat;
  };

  /// Per-dispute jury view — votes redacted until resolved
  public type JuryView = {
    jurors   : [Principal];
    votes    : [JurorVote];   // empty until dispute resolved/escalated
    deadline : Nat;
  };



  // ─── Media attachments ───────────────────────────────────────────────────

  /// A rich media attachment on a chat message or dispute evidence upload.
  public type MediaAttachment = {
    url      : Text;
    mimeType : Text;
    fileName : Text;
    fileSize : Nat;
  };

  /// OpenGraph link preview fetched via HTTPS outcall, cached 24 h per URL.
  public type LinkPreview = {
    url         : Text;
    title       : ?Text;
    description : ?Text;
    imageUrl    : ?Text;
    siteName    : ?Text;
    fetchedAt   : Nat;
  };

  public type Message = {
    id            : MessageId;
    trade         : TradeId;
    sender        : UserId;
    content       : Text;
    sentAt        : Nat;
    /// Deprecated — kept for backward compat with stored messages created before v65.
    /// New messages always have attachmentUrl = null; use `attachments` instead.
    attachmentUrl : ?Text;
    attachments   : [MediaAttachment];
  };

  // ─── Feedback ─────────────────────────────────────────────────────────────

  public type Feedback = {
    id        : FeedbackId;
    trade     : TradeId;
    reviewer  : UserId;
    reviewed  : UserId;
    rating    : Nat;           // 1–5
    comment   : Text;
    createdAt : Nat;
  };

  /// Public-facing dispute view — no mutable fields, safe over Candid.
  /// moderatorNotes is empty for non-moderators (filtered at the lib layer).
  public type DisputeSlaFlags = {
    l1SlaOverdue       : Bool;
    l2TriageOverdue    : Bool;
    l2DecisionOverdue  : Bool;
  };

  public type DisputeView = {
    id                  : DisputeId;
    trade               : TradeId;
    initiator           : UserId;
    reason              : DisputeReason;
    description         : Text;
    evidenceUrls        : [Text];
    evidenceAttachments : [MediaAttachment];
    status              : DisputeStatus;
    resolution          : ?DisputeResolution;
    createdAt           : Nat;
    resolvedAt          : Nat;
    moderatorNotes      : [Text];
    jury                : ?JuryView;
    level               : DisputeLevel;
    tradeKind           : DisputeTradeKind;
    evidencePack        : DisputeEvidencePack;
    l1SlaDeadline       : Nat;
    l2QueuedAt          : Nat;
    l2TriageDeadline    : Nat;
    l2DecisionDeadline  : Nat;
    slaFlags            : DisputeSlaFlags;
  };

  // ─── Notifications ────────────────────────────────────────────────────────

  /// A notification event stored per-user, generated on trade/message/dispute changes.
  /// Capped at 100 per user (FIFO eviction — oldest dropped first).
  public type NotificationEvent = {
    id        : Nat;
    eventType : Text;      // e.g. "trade_status_change", "new_message", "dispute_opened"
    tradeId   : Nat;
    message   : Text;
    timestamp : Nat;
    read      : Bool;
  };

  // ─── Errors ───────────────────────────────────────────────────────────────

  public type Error = {
    #unauthorized;
    #not_found;
    #already_exists;
    #invalid_input : Text;
    #insufficient_funds;
    #escrow_error  : Text;
    #rate_limited;
    #banned;
    #dispute_already_open;
  };

  public type Result<T> = { #ok : T; #err : Error };

  // ─── GDPR export (Int timestamps — Caffeine M0032 shared-type compat) ───

  /// Candid-safe Nat for GDPR export (Caffeine M0032 rejects nested Nat in shared returns).
  public type ExportInt = Int;

  public func exportInt(n : Nat) : ExportInt {
    Int.fromNat(n)
  };

  public type AddressVerificationExport = {
    level      : ExportInt;
    active     : Bool;
    txCount    : ExportInt;
    verifiedAt : ExportInt;
    expiresAt  : ExportInt;
  };

  public type PaymentMethodExport = {
    token        : TradeToken;
    address      : Text;
    addedAt      : ExportInt;
    verification : ?AddressVerificationExport;
    walletLinkId : ExportInt;
  };

  public type LinkedExternalWalletExport = {
    id          : ExportInt;
    chain       : WalletChain;
    address     : Text;
    purpose     : WalletLinkPurpose;
    linkedAt    : ExportInt;
    sessionId   : Text;
    messageHash : Text;
  };

  public type LiabilityEventExport = {
    liabilityId : ExportInt;
    amount      : Int;
    reason      : Text;
    tradeId     : ExportInt;
    timestamp   : ExportInt;
  };

  public type UserProfileExport = {
    id               : UserId;
    username         : Text;
    bio              : Text;
    avatarUrl        : Text;
    role             : UserRole;
    createdAt        : ExportInt;
    reputationScore  : Int;
    buyerScore       : Int;
    sellerScore      : Int;
    trustLevel       : TrustLevel;
    kycTier          : KycTier;
    isBanned         : Bool;
    suspendedUntil   : ExportInt;
    liabilityBalance : Int;
    liabilityHistory : [LiabilityEventExport];
    paymentMethods   : [PaymentMethodExport];
    linkedWallets    : [LinkedExternalWalletExport];
    accountClosedAt  : ExportInt;
  };

  public type MediaAttachmentExport = {
    url      : Text;
    mimeType : Text;
    fileName : Text;
    fileSize : ExportInt;
  };

  /// GDPR export — one trade message tied to the requesting principal's trades.
  public type AccountMessageExport = {
    tradeId       : TradeId;
    messageId     : MessageId;
    sender        : UserId;
    content       : Text;
    sentAt        : ExportInt;
    attachmentUrl : ?Text;
    attachments   : [MediaAttachmentExport];
  };

  public type SavedSearchExport = {
    id            : SavedSearchId;
    owner         : UserId;
    name          : Text;
    paramsJson    : Text;
    createdAt     : ExportInt;
    alertsEnabled : Bool;
  };

  public type FeedbackExport = {
    id        : FeedbackId;
    trade     : TradeId;
    reviewer  : UserId;
    reviewed  : UserId;
    rating    : ExportInt;
    comment   : Text;
    createdAt : ExportInt;
  };

  public type ShippingMethodExport = {
    carrier       : ShippingCarrier;
    type_         : ShippingServiceType;
    estimatedDays : ExportInt;
  };

  public type ListingCardExport = {
    id               : ListingId;
    title            : Text;
    description      : Text;
    priceAmount      : ExportInt;
    priceToken       : TradeToken;
    photos           : [Text];
    location         : Text;
    sellerUsername   : Text;
    sellerRating     : Int;
    sellerTrustLevel : TrustLevel;
    sellerPrincipal  : UserId;
    condition        : ItemCondition;
    shippingMethods  : [ShippingMethodExport];
    category         : ListingCategory;
    categoryId       : CategoryId;
    categorySlug     : Text;
    listingStatus    : ListingStatus;
    createdAt        : ExportInt;
    digitalFileUrl   : Text;
    isPromoted       : Bool;
    attributes       : [CategoryAttributeValue];
  };

  public type DigitalDeliveryViewExport = {
    fileUrl            : Text;
    fileHash           : ?Text;
    password           : ?Text;
    fileVersionId      : ExportInt;
    mimeType           : ?Text;
    dekHex             : ?Text;
    deliveryRecordAt   : ExportInt;
    revealedAt         : ExportInt;
    inspectionDeadline : ExportInt;
  };

  public type ShippingSelectionExport = {
    provider     : Text;
    deliveryType : Text;
    branchRef    : ?Text;
    address      : ?Text;
    cost         : ExportInt;
  };

  public type EscrowAccountExport = {
    tradeId          : TradeId;
    buyerPrincipal   : UserId;
    sellerPrincipal  : UserId;
    token            : TradeToken;
    amount           : ExportInt;
    fee              : ExportInt;
    ledgerCanisterId : Principal;
    lockedAt         : ExportInt;
    deadline         : ExportInt;
  };

  public type PaymentIntentExport = {
    token       : TradeToken;
    network     : Text;
    exactAmount : ExportInt;
    recipient   : Text;
    expiry      : ExportInt;
    path        : PaymentSettlementPath;
    createdAt   : ExportInt;
  };

  public type PayoutWalletSnapshotExport = {
    walletLinkId  : ExportInt;
    address       : Text;
    token         : TradeToken;
    chain         : WalletChain;
    snapshottedAt : ExportInt;
  };

  public type BuyerCancelPenaltySplitExport = {
    lockedAmount       : ExportInt;
    buyerRefund        : ExportInt;
    sellerCompensation : ExportInt;
    platformFee        : ExportInt;
  };

  public type OnChainSettlementOpExport = {
    #releaseToSeller;
    #refundBuyer : { memo : Text };
    #buyerCancelSplit : BuyerCancelPenaltySplitExport;
    #disputeBuyerWins;
    #disputeSellerWins : { sellerHasNegativeRep : Bool };
    #disputeSplit : { sellerHasNegativeRep : Bool };
  };

  public type PendingOnChainSettlementExport = {
    op           : OnChainSettlementOpExport;
    targetStatus : TradeStatus;
    queuedAt     : ExportInt;
    attempts     : ExportInt;
    lastError    : ?Text;
  };

  public type TradeViewExport = {
    id                     : TradeId;
    listing                : ListingId;
    buyer                  : UserId;
    seller                 : UserId;
    amount                 : ExportInt;
    token                  : TradeToken;
    tradeStatus            : TradeStatus;
    createdAt              : ExportInt;
    fundedAt               : ExportInt;
    confirmedAt            : ExportInt;
    completedAt            : ExportInt;
    refundDeadline         : ExportInt;
    sellerResponseDeadline : ExportInt;
    escrowAccount          : ?EscrowAccountExport;
    shippingSelection      : ?ShippingSelectionExport;
    ttnNumber              : ?Text;
    ttnCreationStatus      : TTNStatus;
    digitalDelivery        : ?DigitalDeliveryViewExport;
    deliveryRecordAt       : ExportInt;
    payoutWalletSnapshot   : ?PayoutWalletSnapshotExport;
    payoutWalletHeld       : Bool;
    paymentIntent          : ?PaymentIntentExport;
    shipByDeadline         : ExportInt;
    shippedAt              : ExportInt;
    npDeliveredAt          : ExportInt;
    npDeliveredGraceEndsAt : ExportInt;
    pendingOnChainSettlement : ?PendingOnChainSettlementExport;
  };

  /// Machine-readable bundle for account data export (GDPR portability).
  public type AccountExportBundle = {
    exportedAt         : ExportInt;
    principal          : UserId;
    hasProfile         : Bool;
    profile            : UserProfileExport;
    listings           : [ListingCardExport];
    trades             : [TradeViewExport];
    messages           : [AccountMessageExport];
    savedSearches      : [SavedSearchExport];
    favoriteListingIds : [ListingId];
    feedback           : [FeedbackExport];
  };
}
