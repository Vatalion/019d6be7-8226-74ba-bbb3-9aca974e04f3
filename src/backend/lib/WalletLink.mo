import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Types "../types";

/// External wallet nonce-proof linking — pure domain logic (E4.S7 / D-015).
module {

  public let NONCE_TTL_NS : Nat = 900_000_000_000; // 15 minutes

  public type ChallengeRecord = {
    id        : Nat;
    owner     : Types.UserId;
    chain     : Types.WalletChain;
    address   : Text;
    purpose   : Types.WalletLinkPurpose;
    sessionId : Text;
    message   : Text;
    messageHash : Text;
    expiresAt : Types.Timestamp;
    var used  : Bool;
  };

  public func chainForToken(token : Types.TradeToken) : ?Types.WalletChain {
    switch (token) {
      case (#USDT_TRC20) ?#tron;
      case (#USDT_BEP20) ?#evm_bsc;
      case (#USDT_ERC20 or #USDC_ERC20) ?#evm_eth;
      case (#ckUSDC or #ckUSDT) null;
      case (#USDC_SPL) null;
      case (#USDT_POLYGON or #USDC_POLYGON or #USDT_AVAX or #USDC_AVAX) ?#evm_eth;
    }
  };

  public func tokenToChain(token : Types.TradeToken) : Types.WalletChain {
    switch (token) {
      case (#USDT_TRC20) #tron;
      case (#USDT_BEP20) #evm_bsc;
      case (#USDT_ERC20 or #USDC_ERC20) #evm_eth;
      case (#USDT_POLYGON or #USDC_POLYGON) #evm_eth;
      case (#USDT_AVAX or #USDC_AVAX) #evm_eth;
      case (#USDC_SPL or #ckUSDC or #ckUSDT) #evm_eth;
    }
  };

  public func isWalletCompatible(token : Types.TradeToken, chain : Types.WalletChain) : Bool {
    switch (chainForToken(token), chain) {
      case (?#tron, #tron) true;
      case (?#evm_bsc, #evm_bsc) true;
      case (?#evm_eth, #evm_eth) true;
      case _ false;
    }
  };

  public func chainLabel(chain : Types.WalletChain) : Text {
    switch (chain) {
      case (#tron) "tron";
      case (#evm_bsc) "evm_bsc";
      case (#evm_eth) "evm_eth";
    }
  };

  public func purposeLabel(purpose : Types.WalletLinkPurpose) : Text {
    switch (purpose) {
      case (#payout) "payout";
      case (#stake) "stake";
      case (#payment) "payment";
    }
  };

  public func normalizeAddress(chain : Types.WalletChain, address : Text) : Text {
    let trimmed = address.trim(#char ' ');
    switch (chain) {
      case (#tron) trimmed;
      case (#evm_bsc or #evm_eth) lowercaseAscii(trimmed);
    }
  };

  func lowercaseAscii(t : Text) : Text {
    var out = "";
    for (c in t.chars()) {
      out #= switch c {
        case 'A' "a"; case 'B' "b"; case 'C' "c"; case 'D' "d";
        case 'E' "e"; case 'F' "f"; case 'G' "g"; case 'H' "h";
        case 'I' "i"; case 'J' "j"; case 'K' "k"; case 'L' "l";
        case 'M' "m"; case 'N' "n"; case 'O' "o"; case 'P' "p";
        case 'Q' "q"; case 'R' "r"; case 'S' "s"; case 'T' "t";
        case 'U' "u"; case 'V' "v"; case 'W' "w"; case 'X' "x";
        case 'Y' "y"; case 'Z' "z";
        case _ Text.fromChar(c);
      };
    };
    out
  };

  /// TronLink signMessageV2 — 65-byte secp256k1 sig as 130 hex chars (optional 0x).
  public func isValidTronSignatureFormat(signatureHex : Text) : Bool {
    let stripped = switch (signatureHex.stripStart(#text "0x")) {
      case (?s) s;
      case null signatureHex;
    };
    stripped.size() == 130
  };

  public func isValidAddressFormat(chain : Types.WalletChain, address : Text) : Bool {
    let a = address.trim(#char ' ');
    switch (chain) {
      case (#tron) {
        a.size() == 34 and a.startsWith(#text "T")
      };
      case (#evm_bsc or #evm_eth) {
        a.size() == 42 and a.startsWith(#text "0x") and a.size() > 2
      };
    }
  };

  /// Canonical binding message — must match frontend signing payload.
  public func buildChallengeMessage(
    owner     : Types.UserId,
    chain     : Types.WalletChain,
    address   : Text,
    purpose   : Types.WalletLinkPurpose,
    sessionId : Text,
    expiresAt : Types.Timestamp,
    nonce     : Nat,
  ) : Text {
    "CryptoMarket P2P wallet link\n" #
    "principal=" # owner.toText() # "\n" #
    "chain=" # chainLabel(chain) # "\n" #
    "address=" # normalizeAddress(chain, address) # "\n" #
    "purpose=" # purposeLabel(purpose) # "\n" #
    "session=" # sessionId # "\n" #
    "expires=" # expiresAt.toText() # "\n" #
    "nonce=" # nonce.toText()
  };

  /// Binding fingerprint — message text equality check on link submit.
  public func messageBindingHash(message : Text) : Text {
    message
  };

  public func challengeView(c : ChallengeRecord) : Types.WalletLinkChallengeView {
    {
      challengeId = c.id;
      message     = c.message;
      expiresAt   = c.expiresAt;
      sessionId   = c.sessionId;
      chain       = c.chain;
      address     = c.address;
      purpose     = c.purpose;
    }
  };

  public func createChallenge(
    challenges : Map.Map<Nat, ChallengeRecord>,
    nextId     : Nat,
    owner      : Types.UserId,
    chain      : Types.WalletChain,
    address    : Text,
    purpose    : Types.WalletLinkPurpose,
    sessionId  : Text,
    now        : Types.Timestamp,
  ) : Types.Result<Types.WalletLinkChallengeView> {
    if (not isValidAddressFormat(chain, address)) {
      return #err(#invalid_input("Invalid wallet address for selected chain."));
    };
    if (sessionId.size() == 0 or sessionId.size() > 128) {
      return #err(#invalid_input("sessionId must be 1–128 characters."));
    };
    let normalized = normalizeAddress(chain, address);
    let expiresAt = now + NONCE_TTL_NS;
    let message = buildChallengeMessage(owner, chain, normalized, purpose, sessionId, expiresAt, nextId);
    let record : ChallengeRecord = {
      id = nextId;
      owner;
      chain;
      address = normalized;
      purpose;
      sessionId;
      message;
      messageHash = messageBindingHash(message);
      expiresAt;
      var used = false;
    };
    challenges.add(nextId, record);
    #ok(challengeView(record))
  };

  public func validateChallenge(
    c   : ChallengeRecord,
    owner : Types.UserId,
    now : Types.Timestamp,
  ) : Types.Result<()> {
    if (not Principal.equal(c.owner, owner)) {
      return #err(#unauthorized);
    };
    if (c.used) {
      return #err(#invalid_input("Nonce already used."));
    };
    if (now > c.expiresAt) {
      return #err(#invalid_input("Nonce expired."));
    };
    #ok(())
  };

  public func findLinkedWallet(
    user : Types.User,
    walletLinkId : Nat,
  ) : ?Types.LinkedExternalWallet {
    for (w in user.linkedWallets.vals()) {
      if (w.id == walletLinkId) return ?w;
    };
    null
  };

  public func walletsForToken(user : Types.User, token : Types.TradeToken) : [Types.LinkedExternalWallet] {
    user.linkedWallets.filter(func(w : Types.LinkedExternalWallet) : Bool {
      isWalletCompatible(token, w.chain)
    })
  };

  public func appendLinkedWallet(
    user : Types.User,
    wallet : Types.LinkedExternalWallet,
  ) {
    user.linkedWallets := user.linkedWallets.concat([wallet]);
  };

  public func removeLinkedWallet(user : Types.User, walletLinkId : Nat) : Bool {
    let before = user.linkedWallets.size();
    user.linkedWallets := user.linkedWallets.filter(func(w : Types.LinkedExternalWallet) : Bool {
      w.id != walletLinkId
    });
    user.linkedWallets.size() < before
  };

  /// Trade has passed handshake / has funding obligation — snapshot must not mutate.
  public func isTradeFundedOrLocked(status : Types.TradeStatus) : Bool {
    switch (status) {
      case (#manual_payment_pending or #funded or #buyer_confirmed or #payment_verified or #complete) true;
      case (#disputed) true;
      case _ false;
    }
  };

  public func snapshotPayoutWallet(
    trade : Types.Trade,
    seller : Types.User,
    walletLinkId : Nat,
    now : Types.Timestamp,
  ) : Types.Result<Types.PayoutWalletSnapshot> {
    if (trade.payoutWalletSnapshot != null) {
      return #err(#invalid_input("Payout wallet already snapshotted for this trade."));
    };
    switch (findLinkedWallet(seller, walletLinkId)) {
      case null return #err(#invalid_input("Linked wallet not found."));
      case (?wallet) {
        if (not isWalletCompatible(trade.token, wallet.chain)) {
          return #err(#invalid_input("Wallet chain incompatible with trade token."));
        };
        if (wallet.purpose != #payout and wallet.purpose != #stake) {
          return #err(#invalid_input("Wallet purpose must be payout or stake."));
        };
        let snap : Types.PayoutWalletSnapshot = {
          walletLinkId;
          address = wallet.address;
          token = trade.token;
          chain = wallet.chain;
          snapshottedAt = now;
        };
        trade.payoutWalletSnapshot := ?snap;
        trade.payoutWalletHeld := false;
        #ok(snap)
      };
    }
  };

  /// D-015 — reject payout if seller changed/unlinked wallet after snapshot + lock.
  public func assertPayoutAllowed(
    trade : Types.Trade,
    seller : Types.User,
  ) : Types.Result<()> {
    switch (trade.payoutWalletSnapshot) {
      case null return #err(#invalid_input("Payout wallet not snapshotted."));
      case (?snap) {
        if (trade.payoutWalletHeld) {
          return #err(#escrow_error("Payout held — seller wallet changed after fund lock."));
        };
        switch (findLinkedWallet(seller, snap.walletLinkId)) {
          case null {
            trade.payoutWalletHeld := true;
            #err(#escrow_error("Payout wallet unlinked after snapshot."));
          };
          case (?w) {
            if (normalizeAddress(snap.chain, w.address) != normalizeAddress(snap.chain, snap.address)) {
              trade.payoutWalletHeld := true;
              #err(#escrow_error("Payout wallet address changed after snapshot."));
            } else {
              #ok(())
            };
          };
        };
      };
    }
  };

  public func holdPayoutOnWalletChange(
    trades : Map.Map<Types.TradeId, Types.Trade>,
    sellerId : Types.UserId,
    walletLinkId : Nat,
  ) {
    for ((_, trade) in trades.entries()) {
      if (Principal.equal(trade.seller, sellerId)) {
        switch (trade.payoutWalletSnapshot) {
          case (?snap) {
            if (snap.walletLinkId == walletLinkId and isTradeFundedOrLocked(trade.status)) {
              trade.payoutWalletHeld := true;
            };
          };
          case null {};
        };
      };
    };
  };

};
