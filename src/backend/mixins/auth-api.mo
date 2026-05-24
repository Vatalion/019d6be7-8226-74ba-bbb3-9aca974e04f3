import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Blob "mo:core/Blob";
import Time "mo:core/Time";
import Types "../types";
import AuthLib "../lib/Auth";
import RateLimiter "../lib/RateLimiter";
import WalletLink "../lib/WalletLink";
import EvmWalletSig "../lib/EvmWalletSig";
import TronWalletSig "../lib/TronWalletSig";
import HttpJsonRpc "../lib/HttpJsonRpc";
import Admin "../lib/Admin";

/// Auth mixin — exposes public user/profile endpoints to the actor.
mixin (
  users             : Map.Map<Principal, Types.User>,
  rateLimitMap      : Map.Map<Principal, (Nat, Types.Timestamp)>,
  listings          : Map.Map<Types.ListingId, Types.Listing>,
  trades            : Map.Map<Types.TradeId, Types.Trade>,
  messages          : Map.Map<Types.MessageId, Types.Message>,
  tradeIndex        : Map.Map<Types.TradeId, List.List<Types.MessageId>>,
  savedSearches     : Map.Map<Types.UserId, List.List<Types.SavedSearch>>,
  favorites         : Map.Map<Types.UserId, Set.Set<Types.ListingId>>,
  feedbacks         : Map.Map<Types.FeedbackId, Types.Feedback>,
  userFeedbackIndex : Map.Map<Types.UserId, List.List<Types.FeedbackId>>,
  notifications     : Map.Map<Principal, List.List<Types.NotificationEvent>>,
  walletLinkChallenges : Map.Map<Nat, WalletLink.ChallengeRecord>,
  nextWalletChallengeId : { var value : Nat },
  nextLinkedWalletId    : { var value : Nat },
  auditLog              : List.List<Admin.AuditEntry>,
  nextAuditId           : { var value : Nat },
  systemSettings        : Admin.SystemSettings,
) {

  // ─── Profile ──────────────────────────────────────────────────────────────

  /// Returns the caller's own profile including all private fields,
  /// or null if not registered.
  public shared query ({ caller }) func getMyProfile() : async ?Types.UserProfile {
    switch (AuthLib.getUser(users, caller)) {
      case (?u) ?AuthLib.toProfile(u);
      case null null;
    };
  };

  /// Returns the caller's own payment methods.
  /// Blocks anonymous callers.
  public shared query ({ caller }) func getMyPaymentMethods() : async [Types.PaymentMethod] {
    AuthLib.assertNotAnonymous(caller);
    switch (AuthLib.getUser(users, caller)) {
      case (?u) u.paymentMethods;
      case null [];
    };
  };

  /// Creates or updates the caller's profile.
  /// Blocks anonymous callers and validates inputs.
  public shared ({ caller }) func setMyProfile(
    username  : Text,
    bio       : Text,
    avatarUrl : Text,
    email     : ?Text,
  ) : async Types.Result<Types.UserProfile> {
    AuthLib.assertNotAnonymous(caller);

    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };

    AuthLib.upsertUser(users, caller, username, bio, avatarUrl, email)
  };

  /// Returns a public profile by principal.
  /// Private fields (paymentMethods, liabilityBalance, liabilityHistory) are
  /// stripped for non-owner callers.
  public shared query ({ caller }) func getUserProfile(
    userId : Principal,
  ) : async ?Types.UserProfile {
    switch (AuthLib.getUser(users, userId)) {
      case (?u) {
        if (caller == userId) {
          ?AuthLib.toProfile(u)
        } else {
          ?AuthLib.toPublicProfile(u)
        };
      };
      case null null;
    };
  };

  // ─── GDPR export / account closure ────────────────────────────────────────

  /// Returns a machine-readable bundle of the caller's account data.
  public shared query ({ caller }) func exportMyAccountData() : async Types.AccountExportBundle {
    AuthLib.assertNotAnonymous(caller);
    AuthLib.buildAccountExport(
      users,
      listings,
      trades,
      messages,
      tradeIndex,
      savedSearches,
      favorites,
      feedbacks,
      userFeedbackIndex,
      caller,
    )
  };

  /// Anonymizes profile PII and deactivates active listings after confirmation.
  public shared ({ caller }) func deleteMyAccount(
    confirmation : Text,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);

    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };

    AuthLib.deleteMyAccount(
      users,
      listings,
      trades,
      savedSearches,
      favorites,
      notifications,
      caller,
      confirmation,
    )
  };

  // ─── External wallet linking (E4.S7) ─────────────────────────────────────

  /// Strip response headers for consensus-safe JSON-RPC outcalls.
  public query func transformJsonRpcResponse(
    args : { response : HttpJsonRpc.HttpResponse; context : Blob },
  ) : async HttpJsonRpc.HttpResponse {
    { status = args.response.status; headers = []; body = args.response.body }
  };

  func jsonRpcTransform() : HttpJsonRpc.JsonRpcTransform {
    { function = transformJsonRpcResponse; context = Blob.fromArray([]) }
  };

  func logWalletAudit(actorId : Principal, action : Text, details : Text) {
    let entry : Admin.AuditEntry = {
      id = nextAuditId.value;
      action;
      actorId;
      targetId = null;
      timestamp = Types.now();
      details;
    };
    auditLog.add(entry);
    nextAuditId.value += 1;
  };

  /// Issue a single-use nonce challenge for wallet linking.
  public shared ({ caller }) func requestWalletLinkNonce(
    chain     : Types.WalletChain,
    address   : Text,
    purpose   : Types.WalletLinkPurpose,
    sessionId : Text,
  ) : async Types.Result<Types.WalletLinkChallengeView> {
    AuthLib.assertNotAnonymous(caller);
    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };
    switch (AuthLib.getUser(users, caller)) {
      case null return #err(#not_found);
      case (?_) {};
    };
    let challengeId = nextWalletChallengeId.value;
    nextWalletChallengeId.value += 1;
    WalletLink.createChallenge(
      walletLinkChallenges,
      challengeId,
      caller,
      chain,
      address,
      purpose,
      sessionId,
      Types.now(),
    )
  };

  /// Submit signed wallet proof and bind wallet to II principal.
  public shared ({ caller }) func linkExternalWallet(
    challengeId   : Nat,
    signatureHex  : Text,
    signedMessage : Text,
  ) : async Types.Result<Types.LinkedExternalWallet> {
    AuthLib.assertNotAnonymous(caller);
    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };
    if (signatureHex.size() < 64) {
      return #err(#invalid_input("Invalid signature."));
    };
    let now = Types.now();
    switch (walletLinkChallenges.get(challengeId)) {
      case null return #err(#not_found);
      case (?challenge) {
        switch (WalletLink.validateChallenge(challenge, caller, now)) {
          case (#err(e)) {
            logWalletAudit(caller, "walletLinkRejected", "challenge=" # challengeId.toText());
            return #err(e);
          };
          case (#ok(_)) {};
        };
        if (signedMessage != challenge.message) {
          logWalletAudit(caller, "walletLinkRejected", "message_mismatch challenge=" # challengeId.toText());
          return #err(#invalid_input("Signed message does not match challenge."));
        };
        // Consume the nonce before external RPC verification so concurrent
        // submissions cannot reuse the same challenge across await boundaries.
        challenge.used := true;
        switch (challenge.chain) {
          case (#evm_bsc or #evm_eth) {
            if (not EvmWalletSig.isValidEvmSignatureFormat(signatureHex)) {
              logWalletAudit(caller, "walletLinkRejected", "evm_sig_format challenge=" # challengeId.toText());
              return #err(#invalid_input("Invalid EVM signature format."));
            };
            let verified = await EvmWalletSig.verifyPersonalSign(
              challenge.chain,
              challenge.address,
              signedMessage,
              signatureHex,
              systemSettings.infuraApiKey,
              systemSettings.bscScanApiKey,
              ?jsonRpcTransform(),
            );
            if (not verified) {
              logWalletAudit(caller, "walletLinkRejected", "evm_sig_crypto challenge=" # challengeId.toText());
              return #err(#invalid_input("Signature does not match wallet address."));
            };
          };
          case (#tron) {
            if (not WalletLink.isValidTronSignatureFormat(signatureHex)) {
              logWalletAudit(caller, "walletLinkRejected", "tron_sig_format challenge=" # challengeId.toText());
              return #err(#invalid_input("Invalid Tron signature format."));
            };
            let verified = await TronWalletSig.verifyTronSignMessage(
              systemSettings.tronGridApiKey,
              challenge.address,
              signedMessage,
              signatureHex,
              ?jsonRpcTransform(),
            );
            if (not verified) {
              logWalletAudit(caller, "walletLinkRejected", "tron_sig_crypto challenge=" # challengeId.toText());
              return #err(#invalid_input("Signature does not match wallet address."));
            };
          };
        };
        switch (AuthLib.getUser(users, caller)) {
          case null return #err(#not_found);
          case (?user) {
            let walletId = nextLinkedWalletId.value;
            nextLinkedWalletId.value += 1;
            let linked : Types.LinkedExternalWallet = {
              id = walletId;
              chain = challenge.chain;
              address = challenge.address;
              purpose = challenge.purpose;
              linkedAt = now;
              sessionId = challenge.sessionId;
              messageHash = challenge.messageHash;
            };
            WalletLink.appendLinkedWallet(user, linked);
            logWalletAudit(
              caller,
              "walletLinked",
              "walletId=" # walletId.toText() # " chain=" # WalletLink.chainLabel(challenge.chain),
            );
            #ok(linked)
          };
        };
      };
    }
  };

  public shared query ({ caller }) func getLinkedWallets() : async [Types.LinkedExternalWallet] {
    AuthLib.assertNotAnonymous(caller);
    switch (AuthLib.getUser(users, caller)) {
      case (?u) u.linkedWallets;
      case null [];
    };
  };

  public shared query ({ caller }) func getLinkedWalletsForToken(
    token : Types.TradeToken,
  ) : async [Types.LinkedExternalWallet] {
    AuthLib.assertNotAnonymous(caller);
    switch (AuthLib.getUser(users, caller)) {
      case (?u) WalletLink.walletsForToken(u, token);
      case null [];
    };
  };

  /// Unlink wallet — holds payout on active funded trades using snapshot (D-015).
  public shared ({ caller }) func unlinkExternalWallet(
    walletLinkId : Nat,
  ) : async Types.Result<()> {
    AuthLib.assertNotAnonymous(caller);
    if (not RateLimiter.checkDefault(caller, rateLimitMap)) {
      return #err(#rate_limited);
    };
    switch (AuthLib.getUser(users, caller)) {
      case null return #err(#not_found);
      case (?user) {
        if (not WalletLink.removeLinkedWallet(user, walletLinkId)) {
          return #err(#not_found);
        };
        WalletLink.holdPayoutOnWalletChange(trades, caller, walletLinkId);
        logWalletAudit(caller, "walletUnlinked", "walletId=" # walletLinkId.toText());
        #ok(())
      };
    }
  };

  /// Snapshot seller payout wallet on trade (PaymentIntent / post-handshake).
  public shared ({ caller }) func snapshotPayoutWallet(
    tradeId      : Types.TradeId,
    walletLinkId : Nat,
  ) : async Types.Result<Types.PayoutWalletSnapshot> {
    AuthLib.assertNotAnonymous(caller);
    switch (trades.get(tradeId)) {
      case null return #err(#not_found);
      case (?trade) {
        if (not Principal.equal(trade.seller, caller)) {
          return #err(#unauthorized);
        };
        switch (AuthLib.getUser(users, caller)) {
          case null return #err(#not_found);
          case (?seller) {
            WalletLink.snapshotPayoutWallet(trade, seller, walletLinkId, Types.now())
          };
        };
      };
    }
  };

  /// Recovery flow — new signed proof; does not mutate funded trade snapshots.
  public shared ({ caller }) func recoverWalletLink(
    challengeId   : Nat,
    signatureHex  : Text,
    signedMessage : Text,
  ) : async Types.Result<Types.LinkedExternalWallet> {
    let result = await linkExternalWallet(challengeId, signatureHex, signedMessage);
    switch (result) {
      case (#ok(w)) #ok(w);
      case (#err(e)) #err(e);
    }
  };
}
