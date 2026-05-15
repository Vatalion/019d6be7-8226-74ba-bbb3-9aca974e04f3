import Time "mo:core/Time";

module {

  // ─── Shared primitives ────────────────────────────────────────────────────

  public type UserId    = Principal;
  public type ListingId = Nat;
  public type TradeId   = Nat;
  public type DisputeId = Nat;
  public type MessageId = Nat;
  public type FeedbackId = Nat;
  public type Timestamp = Time.Time;   // Int (nanoseconds)

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
    verifiedAt : Timestamp;
    expiresAt  : Timestamp;  // verifiedAt + 24h in nanoseconds
  };

  /// A seller's saved payment method (crypto address for a specific stablecoin).
  /// Migrated from localStorage (seller_payment_methods) to backend persistence in Week 3.4.
  public type PaymentMethod = {
    token        : TradeToken;
    address      : Text;
    addedAt      : Timestamp;
    verification : ?AddressVerification;
  };

  // ─── Liability ────────────────────────────────────────────────────────────

  /// A single liability event recorded against a user (amount in USD cents).
  /// amount > 0 means the user owes money (liability increased).
  public type LiabilityEvent = {
    amount    : Int;       // USD cents; positive = liability added
    reason    : Text;      // e.g. "dispute_lost", "cancellation_fee", "cross_collateral_seizure"
    tradeId   : ?Nat;
    timestamp : Timestamp;
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

  public type User = {
    id              : UserId;
    var username    : Text;
    var bio         : Text;
    var avatarUrl   : Text;
    var role        : UserRole;
    createdAt       : Timestamp;
    var reputationScore    : Int;
    var trustLevel         : TrustLevel;
    var isBanned           : Bool;
    var suspendedUntil     : ?Timestamp;
    var liabilityBalance   : Int;           // USD cents; negative = user owes the platform
    var liabilityHistory   : [LiabilityEvent];
    var paymentMethods     : [PaymentMethod];
  };

  /// Public-facing subset — no mutable fields, safe to return over Candid
  public type UserProfile = {
    id              : UserId;
    username        : Text;
    bio             : Text;
    avatarUrl       : Text;
    role            : UserRole;
    createdAt       : Timestamp;
    reputationScore : Int;
    trustLevel      : TrustLevel;
    isBanned        : Bool;
    suspendedUntil  : ?Timestamp;
    liabilityBalance : Int;
    liabilityHistory : [LiabilityEvent];
    paymentMethods   : [PaymentMethod];
  };

  // ─── Listing ──────────────────────────────────────────────────────────────

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
    #active;
    #inactive;
    #sold;
    #removed;
  };

  public type Listing = {
    id              : ListingId;
    seller          : UserId;
    var title       : Text;
    var description : Text;
    var category    : ListingCategory;
    var priceAmount : Nat;
    var priceToken  : TradeToken;
    var condition   : ItemCondition;
    var photos      : [Text];
    var location    : Text;
    var shippingMethods : [ShippingMethod];
    isDigital       : Bool;
    var digitalFileUrl : ?Text;
    var status      : ListingStatus;
    createdAt       : Timestamp;
    var expiresAt   : Timestamp;
    var viewCount   : Nat;
    var packageDetails    : ?PackageDetails;
    var novaPoshtaConfig  : ?NovaPoshtaConfig;
    var ukrposhtaConfig   : ?UkrposhtaConfig;
    var meestConfig       : ?MeestConfig;
     var digitalFileHash   : ?Text;   // SHA-256 hash for dispute evidence (optional)
     var digitalPassword   : ?Text;   // Password revealed to buyer after payment (optional)
     var resolvedAt        : ?Timestamp;  // When listing entered resolved state (sold/deactivated/expired). null = active/reactivating
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
    createdAt        : Timestamp;
    digitalFileUrl   : Text;
  };

  // ─── Digital delivery ─────────────────────────────────────────────────────

  /// Delivery record created when a digital trade reaches #complete.
  /// Stores the revealed file URL, optional hash for evidence, optional password,
  /// and the 24-hour inspection deadline.
  public type DigitalDelivery = {
    fileUrl             : Text;
    fileHash            : ?Text;       // SHA-256 hash for buyer verification (evidence only)
    password            : ?Text;       // Revealed password, if seller enabled password protection
    revealedAt          : ?Timestamp;
    inspectionDeadline  : ?Timestamp;  // revealedAt + 24h in nanoseconds
  };

  // ─── Trade / Escrow ───────────────────────────────────────────────────────

  public type TradeStatus = {
    #awaiting_approval;  // ICRC-1 path: buyer needs to call icrc2_approve
    #pending;            // Manual/off-chain path: trade created, awaiting payment
    #funded;             // ICRC-1 path: tokens locked in canister escrow
    #buyer_confirmed;    // Manual path: buyer confirmed sending
    #payment_verified;   // Phase 2: automated blockchain verification succeeded
    #complete;
    #refunded;
    #disputed;
    #cancelled;
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
    lockedAt         : Timestamp;
    deadline         : Timestamp; // refund deadline
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
    createdAt     : Timestamp;
    var fundedAt       : ?Timestamp;
    var confirmedAt    : ?Timestamp;
    var completedAt    : ?Timestamp;
    var refundDeadline : ?Timestamp;
    /// Set when tokens are locked on-chain (ICRC-1 path only)
    var escrowAccount  : ?EscrowAccount;
    var shippingSelection   : ?ShippingSelection;
    var ttnNumber           : ?Text;
    var ttnCreationStatus   : TTNStatus;
    var digitalDelivery     : ?DigitalDelivery;
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
    createdAt      : Timestamp;
    fundedAt       : ?Timestamp;
    confirmedAt    : ?Timestamp;
    completedAt    : ?Timestamp;
    refundDeadline : ?Timestamp;
    escrowAccount  : ?EscrowAccount;
    shippingSelection  : ?ShippingSelection;
    ttnNumber          : ?Text;
    ttnCreationStatus  : TTNStatus;
    digitalDelivery    : ?DigitalDelivery;
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
    #opened;
    #under_review;
    #resolved;
    #escalated_to_admin;
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
    reason      : DisputeReason;
    var description  : Text;
    var evidenceUrls : [Text];
    /// Rich media evidence attachments uploaded via object storage (v65+).
    var evidenceAttachments : [MediaAttachment];
    var status       : DisputeStatus;
    var resolution   : ?DisputeResolution;
    createdAt        : Timestamp;
    var resolvedAt   : ?Timestamp;
    var moderatorNotes : [Text];
  };

  // ─── Jury pool ────────────────────────────────────────────────────────────

  public type JurorEntry = {
    principal         : Principal;
    stakedAmount      : Float;
    var activeDisputeIds : [Text];
    var resolvedCount : Nat;
    var successRate   : Float;
    var registeredAt  : Timestamp;
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
    var deadline : Timestamp;
  };

  /// Public-facing juror info for the dashboard
  public type JurorDashboardEntry = {
    disputeId   : DisputeId;
    tradeId     : TradeId;
    reason      : DisputeReason;
    deadline    : Timestamp;
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
    registeredAt  : Timestamp;
  };

  /// Per-dispute jury view — votes redacted until resolved
  public type JuryView = {
    jurors   : [Principal];
    votes    : [JurorVote];   // empty until dispute resolved/escalated
    deadline : Timestamp;
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
    fetchedAt   : Timestamp;
  };

  public type Message = {
    id            : MessageId;
    trade         : TradeId;
    sender        : UserId;
    content       : Text;
    sentAt        : Timestamp;
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
    createdAt : Timestamp;
  };

  /// Public-facing dispute view — no mutable fields, safe over Candid.
  /// moderatorNotes is empty for non-moderators (filtered at the lib layer).
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
    createdAt           : Timestamp;
    resolvedAt          : ?Timestamp;
    moderatorNotes      : [Text];
    jury                : ?JuryView;
  };

  // ─── Notifications ────────────────────────────────────────────────────────

  /// A notification event stored per-user, generated on trade/message/dispute changes.
  /// Capped at 100 per user (FIFO eviction — oldest dropped first).
  public type NotificationEvent = {
    id        : Nat;
    eventType : Text;      // e.g. "trade_status_change", "new_message", "dispute_opened"
    tradeId   : Nat;
    message   : Text;
    timestamp : Timestamp;
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
}
