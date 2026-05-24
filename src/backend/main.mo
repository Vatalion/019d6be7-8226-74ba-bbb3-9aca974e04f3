import Map "mo:core/Map";
import List "mo:core/List";
import Queue "mo:core/Queue";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Types "types";
import MessagingLib "lib/Messaging";
import Admin "lib/Admin";
import Obs "lib/Observability";
import GovernanceLib "lib/Governance";
import TreasuryLib "lib/Treasury";
import InsuranceReserveLib "lib/InsuranceReserve";
import PaymentsLib "lib/Payments";






import AuthMixin "mixins/auth-api";
import MarketplaceMixin "mixins/marketplace-api";
import EscrowMixin "mixins/escrow-api";
import ReputationMixin "mixins/reputation-api";
import DisputesMixin "mixins/disputes-api";
import PaymentsMixin "mixins/payments-api";
import AdminMixin "mixins/admin-api";
import ShippingMixin "mixins/shipping-api";
import MessagingMixin "mixins/messaging-api";
import GovernanceMixin "mixins/governance-api";
import InsuranceMixin "mixins/insurance-api";
import VaultMixin "mixins/vault-api";
import VaultLib "lib/Vault";
import VaultBalances "lib/VaultBalances";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Migration "migration";
import EngagementMixin "mixins/engagement-api";
import WalletLink "lib/WalletLink";
import StakeLib "lib/Stake";
import StakeMixin "mixins/stake-api";






(with migration = Migration.run)
persistent actor self {

  // ─── Stable state ─────────────────────────────────────────────────────────
  // Enhanced orthogonal persistence — no `stable` keyword needed.

  let users       = Map.empty<Types.UserId, Types.User>();

  // Security domain — rate limiter state (per-principal sliding window)
  let rateLimitState = Map.empty<Principal, (Nat, Types.Timestamp)>();

  // Per-endpoint rate limit maps
  let rateLimitCreateListing    = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitSendMessage      = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitInitiateTrade    = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitConfirmPayment   = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitOpenDispute      = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitAddEvidence      = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitListingMutations = Map.empty<Principal, (Nat, Types.Timestamp)>();

  // Reentrancy guard for escrow operations (tradeId → processing flag)
  let processingTrades = Map.empty<Types.TradeId, Bool>();

  // Marketplace domain
  let listings    = Map.empty<Types.ListingId, Types.Listing>();
  let spamTracker = Map.empty<Types.UserId, Types.Timestamp>();
  let nextListingId = { var value : Nat = 0 };
  // Listing reports (stable — kept for Caffeine upgrade compatibility)
  let nextReportId = { var value : Nat = 0 };
  let reports      = Map.empty<Nat, Types.ListingReport>();

  // Escrow domain
  let trades          = Map.empty<Types.TradeId, Types.Trade>();
  let cancelProposals = Map.empty<Types.TradeId, Set.Set<Principal>>();
  let nextTradeId     = { var value : Nat = 0 };
  /// Treasury principal — receives 1% platform fee on every ICRC-1 trade.
  /// Defaults to anonymous() until admin sets it.
  let treasuryId      = { var value : Principal = Principal.anonymous() };
  /// This canister's own principal — used as the escrow recipient in ICRC-2 transfers.
  let selfPrincipal   = { var value : Principal = Principal.fromActor(self) };

  // Reputation domain
  let feedbacks         = Map.empty<Types.FeedbackId, Types.Feedback>();
  let userFeedbackIndex = Map.empty<Types.UserId, List.List<Types.FeedbackId>>();
  let nextFeedbackId    = { var value : Nat = 0 };
  let liabilityRecords  = Map.empty<Nat, Types.LiabilityRecord>();
  let nextLiabilityId   = { var value : Nat = 1 };

  // Disputes domain
  let disputes      = Map.empty<Types.DisputeId, Types.Dispute>();
  let jurors        = Map.empty<Principal, Types.JurorEntry>();
  let juryMap       = Map.empty<Types.DisputeId, Types.JuryAssignment>();
  let nextDisputeId = { var value : Nat = 0 };

  // Shipping domain
  let shippingCache    = Map.empty<Text, (Text, Types.Timestamp)>();
  let nextWaybillSeed  = { var value : Nat = 0 };
  let trackingTimelines = Map.empty<Types.TradeId, [Types.TrackingTimelineEntry]>();

  // Messaging domain
  let messages      = Map.empty<Types.MessageId, Types.Message>();
  let nextMessageId = { var value : Nat = 0 };
  let tradeIndex    = Map.empty<Types.TradeId, List.List<Types.MessageId>>();
  let lastReadPtrs  = Map.empty<MessagingLib.ReadKey, Types.Timestamp>();
  // Notifications domain — per-user event store (capped at 100 FIFO)
  let notifications     = Map.empty<Principal, List.List<Types.NotificationEvent>>();
  let nextNotificationId = { var value : Nat = 0 };
  // Link preview cache — keyed by URL, 24h TTL
  let linkPreviewCache = Map.empty<Text, Types.LinkPreview>();

  // Admin domain
  let complianceNotes : Map.Map<Types.UserId, List.List<Admin.ComplianceNote>> =
    Map.empty<Types.UserId, List.List<Admin.ComplianceNote>>();

  let auditLog : List.List<Admin.AuditEntry> =
    List.empty<Admin.AuditEntry>();

  let systemSettings : Admin.SystemSettings = {
    var minTradeAmountUSD   = 1;
    var paymentTimeoutHours = 24;
    var allowedTokens       = [#USDT_TRC20, #USDT_BEP20, #USDT_ERC20, #USDC_ERC20];
    var maxListingPriceUSD  = 1_000_000;
    var novaPoshtaApiKey    = "";
    var ukrPoshtaApiKey     = "";
    var meestApiKey         = "";
    var tronGridApiKey      = "";
    var bscScanApiKey       = "";
    var infuraApiKey        = "";
    var solanaRpcUrl        = "";
    var polygonApiKey       = "";
    var avalancheApiKey     = "";
    var ckUsdcLedgerId      = "xevnm-gaaaa-aaaar-qafnq-cai";   // ICP mainnet ckUSDC ledger
    var ckUsdtLedgerId      = "cngnf-vqaaa-aaaar-qag4q-cai";   // ICP mainnet ckUSDT ledger
    var trustlessEscrowEnabled = false;
    var gateCTestnetE2ePassed = false;
    var gateCRollbackTestsPassed = false;
    var gateCSubaccountDesignReviewed = false;
    var gateCBetaCapsConfigured = false;
    var gateCSecuritySignOffRef = "";
    var ckOnChainBetaCapUsdCents = 50_000; // 500 USDT (D-034)
    var platformFeeBps         = 0;                  // 0 = unset → 3% default (D-001)
    var stakeOnChainEnabled    = false;              // ck stake ICRC path (E6.S8 depth)
    var cyclesBalanceThreshold = 1_000_000_000_000;  // 1T cycles default
    var errorRateThreshold     = 5.0;                // 5% default
  };

  let nextAuditId = { var value : Nat = 0 };
  let nextNoteId  = { var value : Nat = 0 };

  // Payments domain — verification rate limits and error ring buffer
  // rateLimitVerify: tradeId -> (callCount, windowStartNs)
  let rateLimitVerify = Map.empty<Types.TradeId, (Nat, Types.Timestamp)>();
  // paymentErrorLog: capped ring buffer (last 500 errors)
  let paymentErrorLog = Queue.empty<Admin.PaymentVerificationError>();
  // rateCache: CoinGecko price oracle cache (TradeToken → RateCacheEntry)
  let rateCache = Map.empty<Types.TradeToken, PaymentsLib.RateCacheEntry>();
  // addressVerifyCache: on-chain address verification results (address#network → AddressVerification)
  let addressVerifyCache = Map.empty<Text, Types.AddressVerification>();
  // usedPaymentTxHashes: txHash → tradeId (LG-09 reuse guard)
  let usedPaymentTxHashes = Map.empty<Text, Types.TradeId>();

  // Observability domain (Phase 2)
  let errorLog      : List.List<Obs.ErrorLogEntry>        = List.empty<Obs.ErrorLogEntry>();
  let moduleMetrics : Map.Map<Text, Obs.ModuleMetrics>    = Map.empty<Text, Obs.ModuleMetrics>();
  let nextErrorId   = { var value : Nat = 0 };
  /// Rolling request metrics log — FIFO, capacity 10 000.
  let requestLog    : List.List<Obs.RequestMetric>        = List.empty<Obs.RequestMetric>();

  // Governance domain
  let proposals           : List.List<GovernanceLib.Proposal>          = List.empty<GovernanceLib.Proposal>();
  let govRateLimitMap     : Map.Map<Principal, (Nat, Types.Timestamp)> = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let nextProposalId      = { var value : Nat = 0 };
  let treasuryFees        : Map.Map<Types.TradeId, TreasuryLib.FeeRecord>   = Map.empty<Types.TradeId, TreasuryLib.FeeRecord>();
  let treasuryWithdrawals : List.List<TreasuryLib.WithdrawalRecord>         = List.empty<TreasuryLib.WithdrawalRecord>();
  let nextWithdrawalId    = { var value : Nat = 0 };

  // Insurance reserve domain (E10.S4) — separate from operating treasury
  let insuranceLedger         = { var value : Nat = 0 };
  let insuranceAccruals       = Map.empty<Types.TradeId, InsuranceReserveLib.AccrualRecord>();
  let insurancePayouts        = Map.empty<Nat, InsuranceReserveLib.PayoutRequest>();
  let insuranceDailyPaid      = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let nextInsurancePayoutId   = { var value : Nat = 0 };

  // Vault domain — cross-chain stablecoin deposit address derivation + balance cache
  let vaultAddressCache : Map.Map<VaultLib.CacheKey, VaultLib.VaultAddress> =
    Map.empty<VaultLib.CacheKey, VaultLib.VaultAddress>();
  let vaultBalanceCache : Map.Map<VaultBalances.BalanceCacheKey, VaultBalances.BalanceResult> =
    Map.empty<VaultBalances.BalanceCacheKey, VaultBalances.BalanceResult>();

  // Engagement domain (OLX Phase B)
  let favorites         = Map.empty<Types.UserId, Set.Set<Types.ListingId>>();
  let savedSearches     = Map.empty<Types.UserId, List.List<Types.SavedSearch>>();
  let nextSavedSearchId = { var value : Nat = 0 };
  let inquiries         = Map.empty<Types.ListingInquiryId, Types.ListingInquiry>();
  let inquiryIndex      = Map.empty<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>();
  let inquiryKeyIndex     = Map.empty<Text, Types.ListingInquiryId>();
  let inquiryMessages     = Map.empty<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>();
  let nextInquiryId       = { var value : Nat = 0 };
  let nextInquiryMsgId    = { var value : Nat = 0 };
  let rateLimitInquiry    = Map.empty<Principal, (Nat, Types.Timestamp)>();

  // Wallet link domain (E4.S7)
  let walletLinkChallenges = Map.empty<Nat, WalletLink.ChallengeRecord>();
  let nextWalletChallengeId = { var value : Nat = 0 };
  let nextLinkedWalletId    = { var value : Nat = 0 };

  // Stake domain (E6.S8)
  let stakeBalances = Map.empty<StakeLib.StakeKey, Types.StakeBalance>();
  let listingStakes = Map.empty<Types.ListingId, Types.ListingStakeRecord>();
  let rateLimitStakeOps = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let rateLimitDigitalUpload = Map.empty<Principal, (Nat, Types.Timestamp)>();
  let nextDigitalFileVersionId = { var value : Nat = 1 };

  // ─── Mixin composition ────────────────────────────────────────────────────

  include AuthMixin(
    users, rateLimitState,
    listings, trades, messages, tradeIndex,
    savedSearches, favorites, feedbacks, userFeedbackIndex, notifications,
    walletLinkChallenges, nextWalletChallengeId, nextLinkedWalletId,
    auditLog, nextAuditId,
    systemSettings,
  );

  include MarketplaceMixin(
    listings, users, spamTracker, nextListingId,
    rateLimitCreateListing, rateLimitListingMutations,
    auditLog, nextAuditId, selfPrincipal,
    savedSearches, notifications, nextNotificationId,
    stakeBalances, listingStakes, trades,
    nextDigitalFileVersionId, rateLimitDigitalUpload,
    liabilityRecords,
  );
  include EscrowMixin(users, listings, trades, listingStakes, cancelProposals, nextTradeId, treasuryId, selfPrincipal, disputes, nextDisputeId, processingTrades, rateLimitInitiateTrade, rateLimitConfirmPayment, systemSettings, liabilityRecords, nextLiabilityId);
  include ReputationMixin(users, trades, feedbacks, userFeedbackIndex, nextFeedbackId);
  include DisputesMixin(
    disputes,
    trades,
    users,
    jurors,
    juryMap,
    nextDisputeId,
    selfPrincipal,
    rateLimitOpenDispute,
    rateLimitAddEvidence,
    liabilityRecords,
    nextLiabilityId,
    stakeBalances,
    listingStakes,
    insuranceLedger,
    insuranceAccruals,
    insurancePayouts,
    insuranceDailyPaid,
    nextInsurancePayoutId,
  );
  include PaymentsMixin(trades, listings, users, systemSettings, rateLimitVerify, paymentErrorLog, errorLog, moduleMetrics, nextErrorId, rateCache, addressVerifyCache, usedPaymentTxHashes, selfPrincipal);
  include ShippingMixin(systemSettings, shippingCache, nextWaybillSeed, trades, listings, trackingTimelines);
  include MessagingMixin(messages, tradeIndex, trades, users, lastReadPtrs, nextMessageId, notifications, nextNotificationId, rateLimitSendMessage, linkPreviewCache);
  include AdminMixin(
    users,
    listings,
    trades,
    disputes,
    complianceNotes,
    auditLog,
    systemSettings,
    nextAuditId,
    nextNoteId,
    errorLog,
    moduleMetrics,
    nextErrorId,
    requestLog,
    liabilityRecords,
    nextLiabilityId,
  );
  include GovernanceMixin(
    proposals,
    users,
    govRateLimitMap,
    nextProposalId,
    treasuryFees,
    treasuryWithdrawals,
    nextWithdrawalId,
    systemSettings,
    insuranceLedger,
    insuranceAccruals,
    selfPrincipal,
  );
  include InsuranceMixin(
    users,
    trades,
    auditLog,
    nextAuditId,
    insuranceLedger,
    insuranceAccruals,
    insurancePayouts,
    insuranceDailyPaid,
    nextInsurancePayoutId,
  );
  include VaultMixin(users, vaultAddressCache, vaultBalanceCache, systemSettings);
  include MixinObjectStorage();

  include EngagementMixin(
    listings,
    users,
    favorites,
    savedSearches,
    nextSavedSearchId,
    inquiries,
    inquiryIndex,
    inquiryKeyIndex,
    inquiryMessages,
    nextInquiryId,
    nextInquiryMsgId,
    rateLimitInquiry,
  );

  include StakeMixin(
    users,
    stakeBalances,
    listingStakes,
    listings,
    trades,
    rateLimitStakeOps,
    systemSettings,
    selfPrincipal,
    treasuryId,
  );

}
