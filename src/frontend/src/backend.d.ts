import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MeestConfig {
    senderPudoRef?: string;
    enabled: boolean;
    deliveryTypes: Array<string>;
}
export type Result_2 = {
    __kind__: "ok";
    ok: PaymentVerificationResult;
} | {
    __kind__: "err";
    err: Error_;
};
export interface VaultAddressView {
    chain: ChainType;
    network: string;
    tokenSymbol: string;
    address: string;
    derivedAt: bigint;
}
export type ProposalType = {
    __kind__: "TextResolution";
    TextResolution: {
        description: string;
    };
} | {
    __kind__: "TreasuryTransfer";
    TreasuryTransfer: {
        recipient: Principal;
        amount: bigint;
    };
} | {
    __kind__: "ParameterChange";
    ParameterChange: {
        key: string;
        value: string;
    };
};
export interface ListingCard {
    id: ListingId;
    title: string;
    sellerPrincipal: UserId;
    priceAmount: bigint;
    shippingMethods: Array<ShippingMethod>;
    createdAt: Timestamp;
    description: string;
    sellerTrustLevel: TrustLevel;
    sellerRating: bigint;
    priceToken: TradeToken;
    category: ListingCategory;
    sellerUsername: string;
    location: string;
    photos: Array<string>;
    digitalFileUrl: string;
    condition: ItemCondition;
}
export interface MetricsSummary {
    totalTrades: bigint;
    totalVolume: bigint;
    p95LatencyMs: bigint;
    errorRate: number;
    memoryUsage: bigint;
    activeTrades: bigint;
    avgTradeValue: bigint;
    disputeRate: number;
    totalRevenue: bigint;
    cyclesBalance: bigint;
}
export interface Feedback {
    id: FeedbackId;
    trade: TradeId;
    createdAt: Timestamp;
    comment: string;
    rating: bigint;
    reviewed: UserId;
    reviewer: UserId;
}
export interface AuditEntry {
    id: bigint;
    action: string;
    actorId: Principal;
    timestamp: Timestamp;
    details: string;
    targetId?: string;
}
export type Result_5 = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TxHistoryFilter {
    to?: Timestamp;
    status?: TradeStatus;
    token?: TradeToken;
    from?: Timestamp;
}
export interface PackageDetails {
    weight: bigint;
    height: bigint;
    places: bigint;
    length: bigint;
    declaredValue: bigint;
    width: bigint;
}
export interface NovaPoshtaBranch {
    ref: string;
    cityRef: string;
    name: string;
    address: string;
    schedule?: string;
}
export interface NotificationEvent {
    id: bigint;
    read: boolean;
    tradeId: bigint;
    message: string;
    timestamp: Timestamp;
    eventType: string;
}
export interface ComplianceNote {
    id: bigint;
    note: string;
    actorId: Principal;
    timestamp: Timestamp;
}
export interface EscrowAccount {
    fee: bigint;
    sellerPrincipal: UserId;
    token: TradeToken;
    ledgerCanisterId: Principal;
    deadline: Timestamp;
    tradeId: TradeId;
    lockedAt: Timestamp;
    buyerPrincipal: UserId;
    amount: bigint;
}
export interface Page {
    totalCount: bigint;
    offset: bigint;
    limit: bigint;
    items: Array<TradeView>;
}
export interface AddressVerification {
    active: boolean;
    expiresAt: Timestamp;
    level: bigint;
    txCount: bigint;
    verifiedAt: Timestamp;
}
export interface PlatformMetrics {
    totalTrades: bigint;
    activeUsersLast30d: bigint;
    avgTradeCompletionMs: bigint;
    totalListings: bigint;
    tradesByToken: Array<[TradeToken, bigint]>;
    disputeRatePct: bigint;
}
export type Result_7 = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: Error_;
};
export interface PlatformMetrics__1 {
    totalTrades: bigint;
    activeUsersLast24h: bigint;
    totalVolume: number;
    monthlyActiveUsers: bigint;
    completedTrades: bigint;
    avgSettlementTimeMin: number;
    disputeRate: number;
    swapSuccessRate: number;
}
export interface UserFilter {
    roleFilter?: UserRole;
    bannedFilter?: boolean;
}
export interface ShippingMethod {
    type: ShippingServiceType;
    estimatedDays: bigint;
    carrier: ShippingCarrier;
}
export type Result_6 = {
    __kind__: "ok";
    ok: Message;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TokenInfo {
    decimals: bigint;
    token: TradeToken;
    name: string;
    network: string;
    isNative: boolean;
    priority: bigint;
    symbol: string;
}
export type TradeId = bigint;
export interface DisputeView {
    id: DisputeId;
    evidenceUrls: Array<string>;
    status: DisputeStatus;
    trade: TradeId;
    evidenceAttachments: Array<MediaAttachment>;
    initiator: UserId;
    jury?: JuryView;
    createdAt: Timestamp;
    description: string;
    resolution?: DisputeResolution;
    moderatorNotes: Array<string>;
    resolvedAt?: Timestamp;
    reason: DisputeReason;
}
export interface CyclesStatus {
    isWarning: boolean;
    currentBalance: bigint;
    warningThreshold: bigint;
    estimatedDailyBurn: bigint;
}
export type Error_ = {
    __kind__: "insufficient_funds";
    insufficient_funds: null;
} | {
    __kind__: "rate_limited";
    rate_limited: null;
} | {
    __kind__: "dispute_already_open";
    dispute_already_open: null;
} | {
    __kind__: "not_found";
    not_found: null;
} | {
    __kind__: "banned";
    banned: null;
} | {
    __kind__: "invalid_input";
    invalid_input: string;
} | {
    __kind__: "escrow_error";
    escrow_error: string;
} | {
    __kind__: "already_exists";
    already_exists: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface TradePaymentStatus {
    status: TradeStatus;
    isManual: boolean;
    token: TradeToken;
    formattedAmount: string;
    tradeId: TradeId;
    tokenInfo?: TokenInfo;
    amount: bigint;
    verificationResult?: PaymentVerificationResult;
}
export type Result_9 = {
    __kind__: "ok";
    ok: DisputeId;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_12 = {
    __kind__: "ok";
    ok: {
        status: string;
        trackingNumber: string;
        estimatedDelivery?: string;
        statusHistory: Array<{
            status: string;
            timestamp: bigint;
        }>;
        isDelivered: boolean;
        carrier: string;
    };
} | {
    __kind__: "err";
    err: Error_;
};
export type ProposalId = bigint;
export interface HttpHeader {
    value: string;
    name: string;
}
export interface ErrorLogEntry {
    id: bigint;
    functionName: string;
    moduleName: string;
    errorMessage: string;
    userPrincipal?: Principal;
    timestamp: bigint;
    severity: ErrorSeverity;
}
export type UserId = Principal;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_10 = {
    __kind__: "ok";
    ok: FeedbackId;
} | {
    __kind__: "err";
    err: Error_;
};
export type MessageId = bigint;
export type Result_8 = {
    __kind__: "ok";
    ok: boolean;
} | {
    __kind__: "err";
    err: Error_;
};
export interface PagedResult_1 {
    page: bigint;
    totalCount: bigint;
    pageSize: bigint;
    items: Array<UserProfile>;
}
export interface JurorVote {
    vote: JurorVoteChoice;
    reasoning: string;
    timestamp: bigint;
    jurorPrincipal: Principal;
}
export interface UserProfile {
    id: UserId;
    bio: string;
    reputationScore: bigint;
    username: string;
    createdAt: Timestamp;
    trustLevel: TrustLevel;
    role: UserRole;
    liabilityBalance: bigint;
    avatarUrl: string;
    liabilityHistory: Array<LiabilityEvent>;
    isBanned: boolean;
    suspendedUntil?: Timestamp;
    paymentMethods: Array<PaymentMethod>;
}
export interface ShippingOption {
    cost: number;
    deliveryDays: bigint;
    available: boolean;
    carrier: ShippingCarrier;
    costNat: bigint;
}
export interface PaymentVerificationResult {
    status: PaymentVerificationStatus;
    blockNumber: bigint;
    confirmedAmount: number;
    confirmedRecipient: string;
    txHash: string;
    errorReason?: string;
}
export type Timestamp = bigint;
export interface PagedResult {
    page: bigint;
    totalCount: bigint;
    pageSize: bigint;
    items: Array<AuditEntry>;
}
export type Result_17 = {
    __kind__: "ok";
    ok: Array<JurorDashboardEntry>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_13 = {
    __kind__: "ok";
    ok: Array<{
        name: string;
        address: string;
        index: string;
    }>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_25 = {
    __kind__: "ok";
    ok: PaymentMethod;
} | {
    __kind__: "err";
    err: Error_;
};
export interface PaymentMethod {
    token: TradeToken;
    addedAt: Timestamp;
    address: string;
    verification?: AddressVerification;
}
export interface BalanceView {
    chain: ChainType;
    error?: string;
    usdtBalance: bigint;
    usdcBalance: bigint;
    lastChecked: bigint;
}
export type Result_16 = {
    __kind__: "ok";
    ok: Array<NovaPoshtaBranch>;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_1 = {
    __kind__: "ok";
    ok: {
        active: boolean;
        txCount: bigint;
        verifiedAt: Timestamp;
    };
} | {
    __kind__: "err";
    err: Error_;
};
export interface DigitalDelivery {
    inspectionDeadline?: Timestamp;
    password?: string;
    fileHash?: string;
    revealedAt?: Timestamp;
    fileUrl: string;
}
export type Result_22 = {
    __kind__: "ok";
    ok: ProposalId;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_11 = {
    __kind__: "ok";
    ok: TradeId;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ReputationStats {
    reputationScore: bigint;
    trustLevel: TrustLevel;
    averageRating: number;
    completedTrades: bigint;
    disputeRate: number;
}
export type ListingId = bigint;
export interface LinkPreview {
    url: string;
    title?: string;
    fetchedAt: Timestamp;
    description?: string;
    siteName?: string;
    imageUrl?: string;
}
export interface JuryView {
    jurors: Array<Principal>;
    votes: Array<JurorVote>;
    deadline: Timestamp;
}
export type Result_19 = {
    __kind__: "ok";
    ok: LinkPreview;
} | {
    __kind__: "err";
    err: Error_;
};
export interface JurorDashboardEntry {
    deadline: Timestamp;
    tradeId: TradeId;
    sellerVotes: bigint;
    hasVoted: boolean;
    totalJurors: bigint;
    buyerVotes: bigint;
    reason: DisputeReason;
    disputeId: DisputeId;
}
export interface AuditFilter {
    targetFilter?: string;
    actionFilter?: string;
    actorFilter?: Principal;
}
export type Result_24 = {
    __kind__: "ok";
    ok: ProposalStatus;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_14 = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "err";
    err: Error_;
};
export interface LiabilityEvent {
    tradeId?: bigint;
    timestamp: Timestamp;
    amount: bigint;
    reason: string;
}
export type FeedbackId = bigint;
export interface ProposalView {
    id: ProposalId;
    status: ProposalStatus;
    noVotes: bigint;
    executedAt?: Timestamp;
    yesVotes: bigint;
    createdAt: Timestamp;
    description: string;
    deadline: Timestamp;
    proposalType: ProposalType;
    proposer: UserId;
    voterCount: bigint;
}
export interface WithdrawalRecord {
    id: bigint;
    executedAt: Timestamp;
    recipient: Principal;
    amount: bigint;
    proposalId: bigint;
}
export interface UkrposhtaConfig {
    enabled: boolean;
    senderOfficeRef?: string;
    deliveryTypes: Array<string>;
}
export interface JurorStats {
    principal: Principal;
    successRate: number;
    activeCount: bigint;
    stakedAmount: number;
    registeredAt: Timestamp;
    resolvedCount: bigint;
}
export interface ShippingSelection {
    provider: string;
    branchRef?: string;
    cost: bigint;
    deliveryType: string;
    address?: string;
}
export type Result_21 = {
    __kind__: "ok";
    ok: DigitalDelivery;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ModuleMetricsView {
    memoryUsedBytes: bigint;
    cyclesConsumed: bigint;
    moduleName: string;
    lastUpdated: bigint;
    errorCount: bigint;
    requestCount: bigint;
}
export interface RateCacheEntry {
    rateInCents: bigint;
    fetchedAt: bigint;
}
export interface MediaAttachment {
    url: string;
    mimeType: string;
    fileName: string;
    fileSize: bigint;
}
export type DisputeId = bigint;
export type Result_18 = {
    __kind__: "ok";
    ok: Array<{
        id: string;
        name: string;
        type: string;
        address: string;
    }>;
} | {
    __kind__: "err";
    err: Error_;
};
export interface HttpResponse {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type Result_23 = {
    __kind__: "ok";
    ok: ListingCard;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_15 = {
    __kind__: "ok";
    ok: Array<DisputeView>;
} | {
    __kind__: "err";
    err: Error_;
};
export interface NovaPoshtaConfig {
    enabled: boolean;
    senderBranchRef: string;
    deliveryTypes: Array<string>;
}
export interface Message {
    id: MessageId;
    attachmentUrl?: string;
    trade: TradeId;
    content: string;
    sender: UserId;
    sentAt: Timestamp;
    attachments: Array<MediaAttachment>;
}
export interface CarrierInfo {
    displayName: string;
    description: string;
    carrier: ShippingCarrier;
}
export interface DisputeResolution {
    notes: string;
    outcome: ResolutionOutcome;
    resolvedBy: UserId;
}
export type Result_20 = {
    __kind__: "ok";
    ok: Array<JurorStats>;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TradeView {
    id: TradeId;
    escrowAccount?: EscrowAccount;
    status: TradeStatus;
    completedAt?: Timestamp;
    listing: ListingId;
    token: TradeToken;
    ttnNumber?: string;
    createdAt: Timestamp;
    confirmedAt?: Timestamp;
    seller: UserId;
    shippingSelection?: ShippingSelection;
    refundDeadline?: Timestamp;
    fundedAt?: Timestamp;
    buyer: UserId;
    amount: bigint;
    digitalDelivery?: DigitalDelivery;
    ttnCreationStatus: TTNStatus;
}
export enum ChainType {
    SPL = "SPL",
    BEP20 = "BEP20",
    TRC20 = "TRC20",
    Polygon = "Polygon",
    ERC20 = "ERC20",
    Avalanche = "Avalanche"
}
export enum DisputeReason {
    other = "other",
    item_damaged = "item_damaged",
    seller_unresponsive = "seller_unresponsive",
    item_differs = "item_differs",
    item_not_received = "item_not_received"
}
export enum DisputeStatus {
    resolved = "resolved",
    opened = "opened",
    escalated_to_admin = "escalated_to_admin",
    under_review = "under_review"
}
export enum ErrorSeverity {
    warning = "warning",
    info = "info",
    error = "error",
    critical = "critical"
}
export enum ItemCondition {
    new_ = "new",
    fair = "fair",
    good = "good",
    poor = "poor",
    likeNew = "likeNew"
}
export enum JurorVoteChoice {
    sellerWins = "sellerWins",
    buyerWins = "buyerWins"
}
export enum ListingCategory {
    clothing = "clothing",
    other = "other",
    books = "books",
    digital = "digital",
    services = "services",
    electronics = "electronics"
}
export enum PaymentVerificationStatus {
    verified = "verified",
    pending = "pending",
    failed = "failed"
}
export enum ProposalStatus {
    active = "active",
    expired = "expired",
    rejected = "rejected",
    executed = "executed",
    passed = "passed"
}
export enum ResolutionOutcome {
    buyer_wins = "buyer_wins",
    split = "split",
    seller_wins = "seller_wins"
}
export enum ShippingCarrier {
    meest = "meest",
    nova_poshta = "nova_poshta",
    self_pickup = "self_pickup",
    digital = "digital",
    ukrposhta = "ukrposhta"
}
export enum ShippingServiceType {
    express = "express",
    standard = "standard"
}
export enum TTNStatus {
    Failed = "Failed",
    Success = "Success",
    InProgress = "InProgress",
    Pending = "Pending"
}
export enum TradeStatus {
    payment_verified = "payment_verified",
    cancelled = "cancelled",
    disputed = "disputed",
    pending = "pending",
    refunded = "refunded",
    funded = "funded",
    buyer_confirmed = "buyer_confirmed",
    complete = "complete",
    awaiting_approval = "awaiting_approval"
}
export enum TradeToken {
    USDT_ERC20 = "USDT_ERC20",
    USDT_AVAX = "USDT_AVAX",
    USDC_ERC20 = "USDC_ERC20",
    USDT_BEP20 = "USDT_BEP20",
    USDC_AVAX = "USDC_AVAX",
    ckUSDC = "ckUSDC",
    ckUSDT = "ckUSDT",
    USDC_SPL = "USDC_SPL",
    USDT_TRC20 = "USDT_TRC20",
    USDC_POLYGON = "USDC_POLYGON",
    USDT_POLYGON = "USDT_POLYGON"
}
export enum TrustLevel {
    new_ = "new",
    bronze = "bronze",
    gold = "gold",
    silver = "silver"
}
export enum UserRole {
    admin = "admin",
    moderator = "moderator",
    user = "user"
}
export enum Variant_all_seller_buyer {
    all = "all",
    seller = "seller",
    buyer = "buyer"
}
export interface backendInterface {
    addComplianceNote(target: UserId, note: string): Promise<void>;
    addEvidence(disputeId: DisputeId, evidenceAttachments: Array<MediaAttachment>): Promise<Result>;
    addModeratorNote(disputeId: DisputeId, note: string): Promise<Result>;
    addPaymentMethod(token: TradeToken, address: string, autoVerify: boolean): Promise<Result_25>;
    adminGetAllTrades(): Promise<Array<TradeView>>;
    adminRemoveListing(id: ListingId, reason: string): Promise<Result>;
    appealDispute(disputeId: DisputeId, reason: string): Promise<Result>;
    assignJurors(disputeId: DisputeId): Promise<Result>;
    banUser(target: UserId, reason: string): Promise<void>;
    calculateShippingCost(senderCity: string, recipientCity: string, weightKg: number, serviceType: ShippingServiceType): Promise<{
        __kind__: "ok";
        ok: {
            transitDays: bigint;
            costUAH: bigint;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    canConfirmDelivery(tradeId: TradeId): Promise<boolean>;
    castJurorVote(disputeId: DisputeId, vote: JurorVoteChoice, reasoning: string): Promise<Result>;
    checkAndExpireTimeouts(): Promise<bigint>;
    checkDigitalInspectionDeadline(tradeId: TradeId): Promise<Result_8>;
    checkJuryDeadlines(): Promise<bigint>;
    cleanupResolvedListings(): Promise<{
        deletedCount: bigint;
        skippedByDispute: bigint;
        photosToDelete: Array<string>;
    }>;
    closeProposal(proposalId: ProposalId): Promise<Result_24>;
    confirmPaymentReceived(tradeId: TradeId): Promise<Result>;
    confirmPaymentSent(tradeId: TradeId): Promise<Result>;
    createListing(title: string, description: string, category: ListingCategory, priceAmount: bigint, priceToken: TradeToken, condition: ItemCondition, photos: Array<string>, location: string, shippingMethods: Array<ShippingMethod>, isDigital: boolean, digitalFileUrl: string | null, digitalFileHash: string | null, digitalPassword: string | null, packageDetails: PackageDetails | null, novaPoshtaConfig: NovaPoshtaConfig | null, ukrposhtaConfig: UkrposhtaConfig | null, meestConfig: MeestConfig | null): Promise<Result_23>;
    createMeestTTN(tradeId: TradeId): Promise<Result_7>;
    createMeestWaybill(senderCity: string, recipientCity: string, weightKg: number, description: string, cost: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createNovaPoshtaTTN(tradeId: TradeId): Promise<Result_7>;
    createProposal(proposalType: ProposalType, description: string): Promise<Result_22>;
    createUkrPoshtaWaybill(senderCity: string, recipientCity: string, weightKg: number, description: string, cost: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createUkrposhtaTTN(tradeId: TradeId): Promise<Result_7>;
    createWaybill(senderCity: string, recipientCity: string, weightKg: number, description: string, cost: bigint, serviceType: ShippingServiceType): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deactivateListing(id: ListingId): Promise<Result>;
    debugGetCertifiedData(): Promise<Uint8Array | null>;
    /**
     * / This canister's own principal — used as the escrow recipient in ICRC-2 transfers.
     */
    demoteFromModerator(target: UserId): Promise<void>;
    estimateTokenAmount(usdCents: bigint, token: TradeToken): Promise<bigint | null>;
    executeProposal(proposalId: ProposalId): Promise<Result>;
    getAllUsers(page: bigint, pageSize: bigint, filter: UserFilter): Promise<PagedResult_1>;
    getAuditLog(page: bigint, pageSize: bigint, filter: AuditFilter): Promise<PagedResult>;
    getCachedRate(token: TradeToken): Promise<RateCacheEntry | null>;
    getComplianceNotes(target: UserId): Promise<Array<ComplianceNote>>;
    getCyclesStatus(): Promise<CyclesStatus>;
    getDashboardMetrics(): Promise<PlatformMetrics__1>;
    getDigitalDelivery(tradeId: TradeId): Promise<Result_21>;
    getDispute(disputeId: DisputeId): Promise<DisputeView | null>;
    getDisputeJurors(disputeId: DisputeId): Promise<JuryView | null>;
    getDisputesByTrade(tradeId: TradeId): Promise<Array<DisputeView>>;
    getEndpointErrorRate(endpoint: string, windowHours: bigint): Promise<number>;
    getErrorLog(limit: bigint, severityFilter: string | null): Promise<Array<ErrorLogEntry>>;
    getExecutionHistory(): Promise<Array<ProposalView>>;
    getExpiredListings(offset: bigint, limit: bigint): Promise<Array<ListingCard>>;
    getFeedbackForTrade(tradeId: TradeId): Promise<Array<Feedback>>;
    getJurorDashboard(): Promise<Array<JurorDashboardEntry>>;
    getJuryPool(): Promise<Result_20>;
    getLinkPreview(url: string): Promise<Result_19>;
    getListing(id: ListingId): Promise<ListingCard | null>;
    getListingsByUser(userId: UserId, offset: bigint, limit: bigint): Promise<Array<ListingCard>>;
    getMeestPUDOs(cityName: string, searchString: string | null, limit: bigint | null): Promise<Result_18>;
    getMetricsSummary(): Promise<MetricsSummary>;
    getModeratorThread(tradeId: TradeId): Promise<Array<Message>>;
    getModuleMetrics(): Promise<Array<ModuleMetricsView>>;
    getMyDisputes(): Promise<Array<DisputeView>>;
    getMyFeedback(): Promise<Array<Feedback>>;
    getMyJurorDashboard(): Promise<Result_17>;
    getMyListings(offset: bigint, limit: bigint): Promise<Array<ListingCard>>;
    getMyPaymentMethods(): Promise<Array<PaymentMethod>>;
    getMyProfile(): Promise<UserProfile | null>;
    getMyTrades(role: Variant_all_seller_buyer): Promise<Array<TradeView>>;
    getMyTransactionHistory(filter: TxHistoryFilter, offset: bigint, limit: bigint): Promise<Page>;
    getNovaPoshtaBranches(cityName: string, searchString: string | null, limit: bigint | null): Promise<Result_16>;
    getNovaPoshtaCityRef(cityName: string): Promise<Result_7>;
    getOpenDisputeQueue(offset: bigint, limit: bigint): Promise<Result_15>;
    getP95Latency(endpoint: string, windowHours: bigint): Promise<bigint>;
    getPaymentMethods(): Promise<Array<PaymentMethod>>;
    getPaymentVerificationStatus(tradeId: TradeId): Promise<PaymentVerificationResult | null>;
    getPlatformMetrics(): Promise<PlatformMetrics>;
    getProposal(proposalId: ProposalId): Promise<ProposalView | null>;
    getProposals(statusFilter: ProposalStatus | null): Promise<Array<ProposalView>>;
    getRequestRate(endpoint: string, windowHours: bigint): Promise<bigint>;
    getSellerLiability(p: Principal): Promise<Result_14>;
    getShippingOptions(weight: number, fromCity: string, toCity: string): Promise<{
        __kind__: "ok";
        ok: Array<ShippingOption>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getSupportedCarriers(): Promise<Array<CarrierInfo>>;
    getSupportedTokens(): Promise<Array<TokenInfo>>;
    getSystemSettings(): Promise<{
        maxListingPriceUSD: bigint;
        paymentTimeoutHours: bigint;
        allowedTokens: Array<TradeToken>;
        cyclesBalanceThreshold: bigint;
        minTradeAmountUSD: bigint;
        errorRateThreshold: number;
    }>;
    getTokenInfo(token: TradeToken): Promise<TokenInfo | null>;
    getTrade(tradeId: TradeId): Promise<TradeView | null>;
    /**
     * / Rolling request metrics log — FIFO, capacity 10 000.
     */
    getTradeMessages(tradeId: TradeId, offset: bigint, limit: bigint): Promise<Array<Message>>;
    getTradeNotifications(): Promise<Array<NotificationEvent>>;
    getTradePaymentStatus(tradeId: TradeId): Promise<TradePaymentStatus | null>;
    getTradesByListing(listingId: ListingId): Promise<Array<TradeView>>;
    getTradesPerDay(days: bigint): Promise<Array<{
        date: string;
        count: bigint;
    }>>;
    getTreasuryBalance(): Promise<bigint>;
    getTreasuryWithdrawals(): Promise<Array<WithdrawalRecord>>;
    getUkrposhtaOffices(cityName: string, searchString: string | null, limit: bigint | null): Promise<Result_13>;
    getUnifiedTrackingInfo(tradeId: TradeId): Promise<Result_12>;
    getUnreadCount(): Promise<Array<[TradeId, bigint]>>;
    getUserFeedback(userId: UserId): Promise<Array<Feedback>>;
    getUserProfile(userId: Principal): Promise<UserProfile | null>;
    getUserReputationStats(userId: UserId): Promise<ReputationStats | null>;
    getVaultAddresses(): Promise<Array<VaultAddressView>>;
    getVaultBalance(chain: ChainType): Promise<BalanceView | null>;
    incrementListingView(id: ListingId): Promise<void>;
    initiateOnChainTrade(listingId: ListingId, token: TradeToken, shippingSelection: ShippingSelection | null): Promise<Result_11>;
    initiateTrade(listingId: ListingId, token: TradeToken, shippingSelection: ShippingSelection | null): Promise<Result_11>;
    leaveFeedback(tradeId: TradeId, reviewed: UserId, rating: bigint, comment: string): Promise<Result_10>;
    markAllNotificationsRead(): Promise<Result>;
    markNotificationRead(notificationId: bigint): Promise<Result>;
    markTradeAsRead(tradeId: TradeId): Promise<void>;
    openDigitalDispute(tradeId: TradeId, reason: string): Promise<Result_9>;
    openDispute(tradeId: TradeId, reason: DisputeReason, description: string): Promise<Result_9>;
    promoteToModerator(target: UserId): Promise<void>;
    proposeCancelTrade(tradeId: TradeId): Promise<Result_8>;
    reactivateListing(id: ListingId): Promise<Result>;
    recordRequest(endpoint: string, durationMs: bigint, status: bigint): Promise<void>;
    recordTreasuryFee(tradeId: TradeId, amount: bigint, token: TradeToken): Promise<void>;
    refreshRates(): Promise<bigint>;
    refreshVaultBalance(chain: ChainType): Promise<BalanceView>;
    registerAsJuror(stake: number): Promise<Result>;
    removeListingByAdmin(listingId: ListingId, reason: string): Promise<void>;
    reopenDispute(disputeId: DisputeId): Promise<Result>;
    requestRefund(tradeId: TradeId): Promise<Result>;
    resolveDispute(disputeId: DisputeId, outcome: ResolutionOutcome, notes: string): Promise<Result>;
    resolveDisputeEscrow(disputeId: DisputeId, outcome: ResolutionOutcome): Promise<Result>;
    retryMeestTTNCreation(tradeId: TradeId): Promise<Result_7>;
    retryTTNCreation(tradeId: TradeId): Promise<Result_7>;
    retryUkrposhtaTTNCreation(tradeId: TradeId): Promise<Result_7>;
    searchListings(query: string | null, category: ListingCategory | null, priceMin: bigint | null, priceMax: bigint | null, location: string | null, condition: ItemCondition | null, shippingCarrier: ShippingCarrier | null, offset: bigint, limit: bigint): Promise<Array<ListingCard>>;
    sendMessage(tradeId: TradeId, content: string, attachments: Array<MediaAttachment>): Promise<Result_6>;
    setAvalancheApiKey(apiKey: string): Promise<void>;
    setBscScanApiKey(apiKey: string): Promise<void>;
    setDisputeUnderReview(disputeId: DisputeId): Promise<Result>;
    setInfuraApiKey(apiKey: string): Promise<void>;
    setMeestApiKey(apiKey: string): Promise<void>;
    setMyProfile(username: string, bio: string, avatarUrl: string, email: string | null): Promise<Result_5>;
    setNovaPoshtaApiKey(apiKey: string): Promise<void>;
    setPolygonApiKey(apiKey: string): Promise<void>;
    setSolanaRpcUrl(url: string): Promise<void>;
    setTronGridApiKey(apiKey: string): Promise<void>;
    setUkrPoshtaApiKey(apiKey: string): Promise<void>;
    submitJurorVote(disputeId: DisputeId, vote: JurorVoteChoice, reasoning: string): Promise<Result>;
    suspendUser(target: UserId, until: Timestamp, reason: string): Promise<void>;
    trackMeestShipment(trackingNumber: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    trackShipment(trackingNumber: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    trackUkrPoshtaShipment(barcode: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transformPaymentResponse(raw: {
        context: Uint8Array;
        response: HttpResponse;
    }): Promise<HttpResponse>;
    unbanUser(target: UserId): Promise<void>;
    unregisterJuror(): Promise<Result>;
    updateListing(id: ListingId, title: string, description: string, category: ListingCategory, priceAmount: bigint, priceToken: TradeToken, condition: ItemCondition, photos: Array<string>, location: string, shippingMethods: Array<ShippingMethod>, digitalFileUrl: string | null, digitalFileHash: string | null, digitalPassword: string | null, packageDetails: PackageDetails | null, novaPoshtaConfig: NovaPoshtaConfig | null, ukrposhtaConfig: UkrposhtaConfig | null, meestConfig: MeestConfig | null): Promise<Result>;
    updateSystemSettings(minTradeAmountUSD: bigint, paymentTimeoutHours: bigint, allowedTokens: Array<TradeToken>, maxListingPriceUSD: bigint, cyclesBalanceThreshold: bigint, errorRateThreshold: number): Promise<void>;
    verifyEvmAddress(address: string, network: string): Promise<Result_1>;
    verifyPayment(tradeId: TradeId, txHash: string, network: TradeToken): Promise<Result_2>;
    verifySolanaAddress(address: string): Promise<Result_1>;
    verifyTradePayment(tradeId: TradeId, txHash: string, network: string): Promise<Result_2>;
    verifyTronAddress(address: string): Promise<Result_1>;
    voteOnProposal(proposalId: ProposalId, voteYes: boolean): Promise<Result>;
}
