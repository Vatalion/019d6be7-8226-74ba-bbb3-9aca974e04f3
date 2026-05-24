/// WalletLink.test.mo — E4.S7 nonce proof, snapshot immutability, payout hold

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import WalletLink "../src/backend/lib/WalletLink";
import EvmWalletSig "../src/backend/lib/EvmWalletSig";
import TronWalletSig "../src/backend/lib/TronWalletSig";
import Types "../src/backend/types";

let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");

func makeUser() : Types.User {
  {
    id = alice;
    var username = "alice";
    var bio = "";
    var avatarUrl = "";
    var role = #user;
    createdAt = 0;
    var reputationScore = 0;
    var buyerScore = 0;
    var sellerScore = 0;
    var trustLevel = #new_;
    var kycTier = #none;
    var isBanned = false;
    var suspendedUntil = null;
    var liabilityBalance = 0;
    var liabilityHistory = [];
    var paymentMethods = [];
    var linkedWallets = [];
    var accountClosedAt = null;
  }
};

func makeTrade(id : Nat, seller : Principal, status : Types.TradeStatus) : Types.Trade {
  {
    id;
    listing = 1;
    buyer = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    seller;
    amount = 100_000_000;
    token = #USDT_BEP20;
    var status = status;
    createdAt = 0;
    var fundedAt = null;
    var confirmedAt = null;
    var completedAt = null;
    var refundDeadline = null;
    var sellerResponseDeadline = null;
    var escrowAccount = null;
    var shippingSelection = null;
    var ttnNumber = null;
    var ttnCreationStatus = #Pending;
    var digitalDelivery = null;
    var deliveryRecordAt = null;
    var payoutWalletSnapshot = null;
    var payoutWalletHeld = false;
    var paymentIntent = null;
    var shipByDeadline = null;
    var shippedAt = null;
    var npDeliveredAt = null;
    var npDeliveredGraceEndsAt = null;
    var pendingOnChainSettlement = null;
  }
};

suite("WalletLink — nonce lifecycle", func() {
  test("rejects expired challenge", func() {
    let challenges = Map.empty<Nat, WalletLink.ChallengeRecord>();
    ignore WalletLink.createChallenge(
      challenges, 1, alice, #evm_bsc, "0x0000000000000000000000000000000000000001",
      #payout, "sess-1", 0,
    );
    switch (challenges.get(1)) {
      case (?c) {
        let result = WalletLink.validateChallenge(c, alice, c.expiresAt + 1);
        switch (result) {
          case (#err(#invalid_input(msg))) expect.text(msg).equal("Nonce expired.");
          case _ assert false;
        };
      };
      case null assert false;
    };
  });

  test("rejects replayed challenge", func() {
    let challenges = Map.empty<Nat, WalletLink.ChallengeRecord>();
    ignore WalletLink.createChallenge(
      challenges, 2, alice, #tron, "TLa2f6VPqDgRE67v1736s7bJ8Ray5wrZ5L",
      #payout, "sess-2", 0,
    );
    switch (challenges.get(2)) {
      case (?c) {
        c.used := true;
        let result = WalletLink.validateChallenge(c, alice, 0);
        switch (result) {
          case (#err(#invalid_input(msg))) expect.text(msg).equal("Nonce already used.");
          case _ assert false;
        };
      };
      case null assert false;
    };
  });
});

suite("WalletLink — crypto helpers", func() {
  test("EVM address normalization is case-insensitive", func() {
    expect.bool(
      EvmWalletSig.addressesMatch(
        #evm_eth,
        "0xAbCdEf0000000000000000000000000000000001",
        "0xabcdef0000000000000000000000000000000001",
      ),
    ).isTrue();
  });

  test("Tron base58 derivation from EVM hex is deterministic", func() {
    let tron = TronWalletSig.evmHexToTronBase58("0x0000000000000000000000000000000000000001");
    expect.bool(tron.size() == 34 and tron.startsWith(#text "T")).isTrue();
  });
});

suite("WalletLink — payout snapshot D-015", func() {
  test("snapshot is immutable once set", func() {
    let user = makeUser();
    let wallet : Types.LinkedExternalWallet = {
      id = 1;
      chain = #evm_bsc;
      address = "0x0000000000000000000000000000000000000001";
      purpose = #payout;
      linkedAt = 0;
      sessionId = "s";
      messageHash = "h";
    };
    WalletLink.appendLinkedWallet(user, wallet);
    var trade = makeTrade(10, alice, #pending);
    switch (WalletLink.snapshotPayoutWallet(trade, user, 1, 100)) {
      case (#ok(_)) {};
      case _ assert false;
    };
    switch (WalletLink.snapshotPayoutWallet(trade, user, 1, 200)) {
      case (#err(#invalid_input(msg))) expect.text(msg).equal("Payout wallet already snapshotted for this trade.");
      case _ assert false;
    };
  });

  test("unlink after funded trade holds payout", func() {
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let user = makeUser();
    let wallet : Types.LinkedExternalWallet = {
      id = 5;
      chain = #evm_bsc;
      address = "0x0000000000000000000000000000000000000001";
      purpose = #payout;
      linkedAt = 0;
      sessionId = "s";
      messageHash = "h";
    };
    WalletLink.appendLinkedWallet(user, wallet);
    let trade = makeTrade(11, alice, #payment_verified);
    ignore WalletLink.snapshotPayoutWallet(trade, user, 5, 1);
    trades.add(11, trade);
    ignore WalletLink.removeLinkedWallet(user, 5);
    WalletLink.holdPayoutOnWalletChange(trades, alice, 5);
    switch (trades.get(11)) {
      case (?t) expect.bool(t.payoutWalletHeld).isTrue();
      case null assert false;
    };
  });

  test("filters wallets by token chain", func() {
    let user = makeUser();
    WalletLink.appendLinkedWallet(user, {
      id = 1;
      chain = #tron;
      address = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuW9";
      purpose = #payout;
      linkedAt = 0;
      sessionId = "a";
      messageHash = "h";
    });
    WalletLink.appendLinkedWallet(user, {
      id = 2;
      chain = #evm_bsc;
      address = "0x0000000000000000000000000000000000000001";
      purpose = #payout;
      linkedAt = 0;
      sessionId = "b";
      messageHash = "h";
    });
    expect.nat(WalletLink.walletsForToken(user, #USDT_TRC20).size()).equal(1);
    expect.nat(WalletLink.walletsForToken(user, #USDT_BEP20).size()).equal(1);
  });
});
