#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
writeFileSync(
	path.join(root, "src/backend/migration.mo"),
`import Map "mo:core/Map";
import List "mo:core/List";
import Queue "mo:core/Queue";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Types "types";
import Admin "lib/Admin";
import MessagingLib "lib/Messaging";
import GovernanceLib "lib/Governance";
import TreasuryLib "lib/Treasury";
import InsuranceReserveLib "lib/InsuranceReserve";
import WalletLink "lib/WalletLink";
import StakeLib "lib/Stake";
import Legacy "migration-legacy-types";

/// Pre-alpha nuclear reset: discard deployed canister state on upgrade.
module {

  type OldAuditEntry = {
    id : Nat;
    action : Text;
    actorId : Principal;
    targetId : ?Text;
    timestamp : Legacy.Timestamp;
    details : Text;
  };

  type OldComplianceNote = {
    id : Nat;
    note : Text;
    actorId : Principal;
    timestamp : Legacy.Timestamp;
  };

  type OldPaymentVerificationError = {
    tradeId : Legacy.TradeId;
    txHash : Text;
    network : Text;
    reason : Text;
    timestamp : Legacy.Timestamp;
  };

  type OldProposalType = {
    #ParameterChange : { key : Text; value : Text };
    #TreasuryTransfer : { amount : Nat; recipient : Principal };
    #TextResolution : { description : Text };
  };

  type OldProposalStatus = {
    #active;
    #passed;
    #rejected;
    #executed;
    #expired;
  };

  type OldProposal = {
    id : Nat;
    proposer : Legacy.UserId;
    proposalType : OldProposalType;
    description : Text;
    var yesVotes : Nat;
    var noVotes : Nat;
    voters : Map.Map<Legacy.UserId, Bool>;
    var status : OldProposalStatus;
    createdAt : Legacy.Timestamp;
    deadline : Legacy.Timestamp;
    var executedAt : ?Legacy.Timestamp;
  };

  type OldFeeRecord = {
    tradeId : Legacy.TradeId;
    amount : Nat;
    token : Legacy.TradeToken;
    recordedAt : Legacy.Timestamp;
  };

  type OldWithdrawalRecord = {
    id : Nat;
    proposalId : Nat;
    recipient : Principal;
    amount : Nat;
    executedAt : Legacy.Timestamp;
  };

  type OldSystemSettings = {
    var minTradeAmountUSD : Nat;
    var paymentTimeoutHours : Nat;
    var allowedTokens : [Legacy.TradeToken];
    var maxListingPriceUSD : Nat;
    var novaPoshtaApiKey : Text;
    var ukrPoshtaApiKey : Text;
    var meestApiKey : Text;
    var tronGridApiKey : Text;
    var bscScanApiKey : Text;
    var infuraApiKey : Text;
    var solanaRpcUrl : Text;
    var polygonApiKey : Text;
    var avalancheApiKey : Text;
    var ckUsdcLedgerId : Text;
    var ckUsdtLedgerId : Text;
    var cyclesBalanceThreshold : Nat;
    var errorRateThreshold : Float;
  };

  type OldChainType = { #Avalanche; #BEP20; #ERC20; #Polygon; #SPL; #TRC20 };

  type OldErrorSeverity = { #info; #warning; #error; #critical };

  type OldErrorLogEntry = {
    errorMessage : Text;
    functionName : Text;
    id : Nat;
    moduleName : Text;
    severity : OldErrorSeverity;
    timestamp : Int;
    userPrincipal : ?Principal;
  };

  type OldModuleMetrics = {
    var cyclesConsumed : Nat;
    var errorCount : Nat;
    var lastUpdated : Int;
    var memoryUsedBytes : Nat;
    moduleName : Text;
    var requestCount : Nat;
  };

  type OldRequestMetric = {
    durationMs : Nat;
    endpoint : Text;
    status : Nat;
    timestamp : Legacy.Timestamp;
  };

  type OldRateCacheEntry = {
    fetchedAt : Int;
    rateInCents : Nat;
  };

  type OldPaymentVerificationResult = {
    blockNumber : Nat;
    confirmedAmount : Float;
    confirmedRecipient : Text;
    errorReason : ?Text;
    status : Legacy.PaymentVerificationStatus;
    txHash : Text;
  };

  type OldVaultAddress = {
    address : Text;
    chain : OldChainType;
    derivationPath : [Blob];
    derivedAt : Int;
    network : Text;
    tokenSymbol : Text;
  };

  type OldBalanceResult = {
    chain : OldChainType;
    error : ?Text;
    lastChecked : Int;
    usdcBalance : Nat;
    usdtBalance : Nat;
  };

  type OldActor = {
    ADDRESS_VERIFY_TTL_NS : Int;
    INSPECTION_PERIOD_NS : Int;
    LINK_PREVIEW_TTL_NS : Int;
    MAX_NOTIFICATIONS : Nat;
    MAX_URL_LENGTH : Nat;
    UNIFIED_CACHE_TTL : Int;
    addressVerifyCache : Map.Map<Text, Legacy.AddressVerification>;
    auditLog : List.List<OldAuditEntry>;
    cancelProposals : Map.Map<Legacy.TradeId, Set.Set<Principal>>;
    complianceNotes : Map.Map<Legacy.UserId, List.List<OldComplianceNote>>;
    disputes : Map.Map<Legacy.DisputeId, Legacy.Dispute>;
    errorLog : List.List<OldErrorLogEntry>;
    feedbacks : Map.Map<Legacy.FeedbackId, Legacy.Feedback>;
    favorites : Map.Map<Legacy.UserId, Set.Set<Legacy.ListingId>>;
    govRateLimitMap : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    hexChars : [Char];
    inquiries : Map.Map<Legacy.ListingInquiryId, Legacy.ListingInquiry>;
    inquiryIndex : Map.Map<Legacy.ListingInquiryId, List.List<Legacy.ListingInquiryMessageId>>;
    inquiryKeyIndex : Map.Map<Text, Legacy.ListingInquiryId>;
    inquiryMessages : Map.Map<Legacy.ListingInquiryMessageId, Legacy.ListingInquiryMessage>;
    jurors : Map.Map<Principal, Legacy.JurorEntry>;
    juryMap : Map.Map<Legacy.DisputeId, Legacy.JuryAssignment>;
    lastReadPtrs : Map.Map<MessagingLib.ReadKey, Legacy.Timestamp>;
    linkPreviewCache : Map.Map<Text, Legacy.LinkPreview>;
    listings : Map.Map<Legacy.ListingId, Legacy.Listing>;
    messages : Map.Map<Legacy.MessageId, Legacy.Message>;
    moduleMetrics : Map.Map<Text, OldModuleMetrics>;
    nextAuditId : { var value : Nat };
    nextDisputeId : { var value : Nat };
    nextErrorId : { var value : Nat };
    nextFeedbackId : { var value : Nat };
    nextListingId : { var value : Nat };
    nextMessageId : { var value : Nat };
    nextNoteId : { var value : Nat };
    nextNotificationId : { var value : Nat };
    nextInquiryId : { var value : Nat };
    nextInquiryMsgId : { var value : Nat };
    nextProposalId : { var value : Nat };
    nextReportId : { var value : Nat };
    nextSavedSearchId : { var value : Nat };
    nextTradeId : { var value : Nat };
    nextWaybillSeed : { var value : Nat };
    nextWithdrawalId : { var value : Nat };
    notifications : Map.Map<Principal, List.List<Legacy.NotificationEvent>>;
    objectStorageLiveBlobs : Map.Map<Text, { hash : Text; createdAt : Int }>;
    objectStoragePendingDelete : Set.Set<Text>;
    paymentErrorLog : Queue.Queue<OldPaymentVerificationError>;
    processingTrades : Map.Map<Legacy.TradeId, Bool>;
    proposals : List.List<OldProposal>;
    rateCache : Map.Map<Legacy.TradeToken, OldRateCacheEntry>;
    rateLimitAddEvidence : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitConfirmPayment : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitCreateListing : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitInitiateTrade : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitInquiry : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitListingMutations : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitOpenDispute : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitSendMessage : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitState : Map.Map<Principal, (Nat, Legacy.Timestamp)>;
    rateLimitVerify : Map.Map<Legacy.TradeId, (Nat, Legacy.Timestamp)>;
    reports : Map.Map<Nat, Legacy.ListingReport>;
    requestLog : List.List<OldRequestMetric>;
    savedSearches : Map.Map<Legacy.UserId, List.List<Legacy.SavedSearch>>;
    selfPrincipal : { var value : Principal };
    shippingCache : Map.Map<Text, (Text, Legacy.Timestamp)>;
    spamTracker : Map.Map<Legacy.UserId, Legacy.Timestamp>;
    systemSettings : OldSystemSettings;
    tradeIndex : Map.Map<Legacy.TradeId, List.List<Legacy.MessageId>>;
    trades : Map.Map<Legacy.TradeId, Legacy.Trade>;
    treasuryFees : Map.Map<Legacy.TradeId, OldFeeRecord>;
    treasuryId : { var value : Principal };
    treasuryWithdrawals : List.List<OldWithdrawalRecord>;
    userFeedbackIndex : Map.Map<Legacy.UserId, List.List<Legacy.FeedbackId>>;
    users : Map.Map<Legacy.UserId, Legacy.User>;
    vaultAddressCache : Map.Map<Text, OldVaultAddress>;
    vaultBalanceCache : Map.Map<Text, OldBalanceResult>;
    verificationResults : Map.Map<Legacy.TradeId, OldPaymentVerificationResult>;
  };

  type NewActor = {
    addressVerifyCache : Map.Map<Text, Types.AddressVerification>;
    auditLog : List.List<Admin.AuditEntry>;
    complianceNotes : Map.Map<Types.UserId, List.List<Admin.ComplianceNote>>;
    disputes : Map.Map<Types.DisputeId, Types.Dispute>;
    favorites : Map.Map<Types.UserId, Set.Set<Types.ListingId>>;
    feedbacks : Map.Map<Types.FeedbackId, Types.Feedback>;
    govRateLimitMap : Map.Map<Principal, (Nat, Types.Timestamp)>;
    inquiries : Map.Map<Types.ListingInquiryId, Types.ListingInquiry>;
    inquiryIndex : Map.Map<Types.ListingInquiryId, List.List<Types.ListingInquiryMessageId>>;
    inquiryKeyIndex : Map.Map<Text, Types.ListingInquiryId>;
    inquiryMessages : Map.Map<Types.ListingInquiryMessageId, Types.ListingInquiryMessage>;
    insuranceAccruals : Map.Map<Types.TradeId, InsuranceReserveLib.AccrualRecord>;
    insuranceDailyPaid : Map.Map<Principal, (Nat, Types.Timestamp)>;
    insuranceLedger : { var value : Nat };
    insurancePayouts : Map.Map<Nat, InsuranceReserveLib.PayoutRequest>;
    jurors : Map.Map<Principal, Types.JurorEntry>;
    juryMap : Map.Map<Types.DisputeId, Types.JuryAssignment>;
    lastReadPtrs : Map.Map<MessagingLib.ReadKey, Types.Timestamp>;
    liabilityRecords : Map.Map<Nat, Types.LiabilityRecord>;
    linkPreviewCache : Map.Map<Text, Types.LinkPreview>;
    listingStakes : Map.Map<Types.ListingId, Types.ListingStakeRecord>;
    listings : Map.Map<Types.ListingId, Types.Listing>;
    messages : Map.Map<Types.MessageId, Types.Message>;
    nextDigitalFileVersionId : { var value : Nat };
    nextInquiryId : { var value : Nat };
    nextInquiryMsgId : { var value : Nat };
    nextInsurancePayoutId : { var value : Nat };
    nextLiabilityId : { var value : Nat };
    nextLinkedWalletId : { var value : Nat };
    nextReportId : { var value : Nat };
    nextSavedSearchId : { var value : Nat };
    nextWalletChallengeId : { var value : Nat };
    notifications : Map.Map<Principal, List.List<Types.NotificationEvent>>;
    paymentErrorLog : Queue.Queue<Admin.PaymentVerificationError>;
    proposals : List.List<GovernanceLib.Proposal>;
    rateLimitAddEvidence : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitConfirmPayment : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitCreateListing : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitDigitalUpload : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitInitiateTrade : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitInquiry : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitListingMutations : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitOpenDispute : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitSendMessage : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitStakeOps : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitState : Map.Map<Principal, (Nat, Types.Timestamp)>;
    rateLimitVerify : Map.Map<Types.TradeId, (Nat, Types.Timestamp)>;
    reports : Map.Map<Nat, Types.ListingReport>;
    savedSearches : Map.Map<Types.UserId, List.List<Types.SavedSearch>>;
    shippingCache : Map.Map<Text, (Text, Types.Timestamp)>;
    spamTracker : Map.Map<Types.UserId, Types.Timestamp>;
    stakeBalances : Map.Map<StakeLib.StakeKey, Types.StakeBalance>;
    systemSettings : Admin.SystemSettings;
    trackingTimelines : Map.Map<Types.TradeId, [Types.TrackingTimelineEntry]>;
    trades : Map.Map<Types.TradeId, Types.Trade>;
    treasuryFees : Map.Map<Types.TradeId, TreasuryLib.FeeRecord>;
    treasuryWithdrawals : List.List<TreasuryLib.WithdrawalRecord>;
    usedPaymentTxHashes : Map.Map<Text, Types.TradeId>;
    users : Map.Map<Types.UserId, Types.User>;
    walletLinkChallenges : Map.Map<Nat, WalletLink.ChallengeRecord>;
  };

  func freshSystemSettings() : Admin.SystemSettings {
    {
      var minTradeAmountUSD = 1;
      var paymentTimeoutHours = 24;
      var allowedTokens = [#USDT_TRC20, #USDT_BEP20, #USDT_ERC20, #USDC_ERC20];
      var maxListingPriceUSD = 1_000_000;
      var novaPoshtaApiKey = "";
      var ukrPoshtaApiKey = "";
      var meestApiKey = "";
      var tronGridApiKey = "";
      var bscScanApiKey = "";
      var infuraApiKey = "";
      var solanaRpcUrl = "";
      var polygonApiKey = "";
      var avalancheApiKey = "";
      var ckUsdcLedgerId = "xevnm-gaaaa-aaaar-qafnq-cai";
      var ckUsdtLedgerId = "cngnf-vqaaa-aaaar-qag4q-cai";
      var trustlessEscrowEnabled = false;
      var gateCTestnetE2ePassed = false;
      var gateCRollbackTestsPassed = false;
      var gateCSubaccountDesignReviewed = false;
      var gateCBetaCapsConfigured = false;
      var gateCSecuritySignOffRef = "";
      var ckOnChainBetaCapUsdCents = 50_000;
      var platformFeeBps = 0;
      var stakeOnChainEnabled = false;
      var cyclesBalanceThreshold = 1_000_000_000_000;
      var errorRateThreshold = 5.0;
    }
  };

  func freshState() : NewActor {
    {
      addressVerifyCache = Map.empty();
      auditLog = List.empty();
      complianceNotes = Map.empty();
      disputes = Map.empty();
      favorites = Map.empty();
      feedbacks = Map.empty();
      govRateLimitMap = Map.empty();
      inquiries = Map.empty();
      inquiryIndex = Map.empty();
      inquiryKeyIndex = Map.empty();
      inquiryMessages = Map.empty();
      insuranceAccruals = Map.empty();
      insuranceDailyPaid = Map.empty();
      insuranceLedger = { var value = 0 };
      insurancePayouts = Map.empty();
      jurors = Map.empty();
      juryMap = Map.empty();
      lastReadPtrs = Map.empty();
      liabilityRecords = Map.empty();
      linkPreviewCache = Map.empty();
      listingStakes = Map.empty();
      listings = Map.empty();
      messages = Map.empty();
      nextDigitalFileVersionId = { var value = 1 };
      nextInquiryId = { var value = 0 };
      nextInquiryMsgId = { var value = 0 };
      nextInsurancePayoutId = { var value = 0 };
      nextLiabilityId = { var value = 1 };
      nextLinkedWalletId = { var value = 0 };
      nextReportId = { var value = 0 };
      nextSavedSearchId = { var value = 0 };
      nextWalletChallengeId = { var value = 0 };
      notifications = Map.empty();
      paymentErrorLog = Queue.empty();
      proposals = List.empty();
      rateLimitAddEvidence = Map.empty();
      rateLimitConfirmPayment = Map.empty();
      rateLimitCreateListing = Map.empty();
      rateLimitDigitalUpload = Map.empty();
      rateLimitInitiateTrade = Map.empty();
      rateLimitInquiry = Map.empty();
      rateLimitListingMutations = Map.empty();
      rateLimitOpenDispute = Map.empty();
      rateLimitSendMessage = Map.empty();
      rateLimitStakeOps = Map.empty();
      rateLimitState = Map.empty();
      rateLimitVerify = Map.empty();
      reports = Map.empty();
      savedSearches = Map.empty();
      shippingCache = Map.empty();
      spamTracker = Map.empty();
      stakeBalances = Map.empty();
      systemSettings = freshSystemSettings();
      trackingTimelines = Map.empty();
      trades = Map.empty();
      treasuryFees = Map.empty();
      treasuryWithdrawals = List.empty();
      usedPaymentTxHashes = Map.empty();
      users = Map.empty();
      walletLinkChallenges = Map.empty();
    }
  };

  public func run(_old : OldActor) : NewActor {
    ignore (
      _old.ADDRESS_VERIFY_TTL_NS,
      _old.INSPECTION_PERIOD_NS,
      _old.LINK_PREVIEW_TTL_NS,
      _old.MAX_NOTIFICATIONS,
      _old.MAX_URL_LENGTH,
      _old.addressVerifyCache.size(),
      _old.auditLog.size(),
      _old.complianceNotes.size(),
      _old.disputes.size(),
      _old.favorites.size(),
      _old.feedbacks.size(),
      _old.govRateLimitMap.size(),
      _old.inquiries.size(),
      _old.inquiryIndex.size(),
      _old.inquiryKeyIndex.size(),
      _old.inquiryMessages.size(),
      _old.jurors.size(),
      _old.juryMap.size(),
      _old.lastReadPtrs.size(),
      _old.linkPreviewCache.size(),
      _old.listings.size(),
      _old.messages.size(),
      _old.notifications.size(),
      _old.paymentErrorLog.size(),
      _old.proposals.size(),
      _old.rateLimitAddEvidence.size(),
      _old.rateLimitConfirmPayment.size(),
      _old.rateLimitCreateListing.size(),
      _old.rateLimitInitiateTrade.size(),
      _old.rateLimitInquiry.size(),
      _old.rateLimitListingMutations.size(),
      _old.rateLimitOpenDispute.size(),
      _old.rateLimitSendMessage.size(),
      _old.rateLimitState.size(),
      _old.rateLimitVerify.size(),
      _old.reports.size(),
      _old.savedSearches.size(),
      _old.shippingCache.size(),
      _old.spamTracker.size(),
      _old.systemSettings.minTradeAmountUSD,
      _old.trades.size(),
      _old.treasuryFees.size(),
      _old.treasuryWithdrawals.size(),
      _old.users.size(),
    );
    freshState()
  };

};
`,
);
