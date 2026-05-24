/// Disputes.test.mo — E6.S9 playbook: L1/L2 freeze, SLA escalation, evidence

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Disputes "../src/backend/lib/Disputes";
import Types "../src/backend/types";

let alice = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob   = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let mod   = Principal.fromText("aaaaa-aa");
let charlie = Principal.fromText("rno2w-sqaaa-aaaaa-aaacq-cai");
let juror1 = Principal.fromText("xevnm-gaaaa-aaaar-qafnq-cai");

let makeTrade = func(
  id     : Nat,
  buyer  : Principal,
  seller : Principal,
  status : Types.TradeStatus,
  digital : Bool,
) : Types.Trade {
  {
    id;
    listing           = 0;
    buyer;
    seller;
    amount            = 1_000_000;
    token             = #USDT_TRC20;
    var status        = status;
    createdAt         = Types.now();
    var fundedAt      = null;
    var confirmedAt   = null;
    var completedAt   = null;
    var refundDeadline = null;
    var sellerResponseDeadline = null;
    var escrowAccount = null;
    var shippingSelection = null;
    var ttnNumber         = ?"20451234567890";
    var ttnCreationStatus = #Success;
    var digitalDelivery   = if (digital) {
      ?{
        fileUrl = "https://example.com/file";
        fileHash = ?"sha256:abc";
        password = null;
        fileVersionId = 1;
        mimeType = ?"application/pdf";
        dekHex = null;
        deliveryRecordAt = Types.now();
        var revealedAt = ?Types.now();
        var inspectionDeadline = null;
      }
    } else {
      null
    };
    var deliveryRecordAt  = if (digital) ?Types.now() else null;
    var payoutWalletSnapshot = null;
    var payoutWalletHeld     = false;
    var paymentIntent        = null;
    var shipByDeadline       = null;
    var shippedAt            = ?Types.now();
    var npDeliveredAt        = null;
    var npDeliveredGraceEndsAt = null;
    var pendingOnChainSettlement = null;
  }
};

let makeUser = func(id : Text, role : Types.UserRole) : Types.User {
  {
    id = Principal.fromText(id);
    var username = "user";
    var bio = "";
    var avatarUrl = "";
    var role = role;
    createdAt = Types.now();
    var reputationScore = 10;
    var buyerScore           = 0;
    var sellerScore          = 0;
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

let physicalEvidence = func() : Types.DisputeEvidencePack {
  {
    ttnScreenshotUrl  = ?"https://storage.example/ttn.png";
    packagePhotoUrls  = ["https://storage.example/p1.jpg", "https://storage.example/p2.jpg"];
    chatThreadLink    = ?"https://chat.example/thread/1";
    fileHash          = null;
    downloadTimestamp = 0;
  }
};

let digitalEvidence = func() : Types.DisputeEvidencePack {
  {
    ttnScreenshotUrl  = null;
    packagePhotoUrls  = [];
    chatThreadLink    = null;
    fileHash          = ?"sha256:abc";
    downloadTimestamp = Types.now();
  }
};

suite("Disputes — E6.S9 openDispute L1 freeze", func() {
  test("physical post-shipment opens L1 and freezes payout", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);

    let result = Disputes.openDispute(
      disputes, trades, 0, alice, 1, #item_not_received, "Damaged package",
      physicalEvidence(), [],
    );
    switch result {
      case (#ok(id)) {
        expect.nat(id).equal(0);
        switch (trades.get(1)) {
          case (?tr) {
            expect.text(debug_show(tr.status)).equal(debug_show(#dispute_l1));
            expect.bool(tr.payoutWalletHeld).isTrue();
          };
          case null assert false;
        };
        switch (disputes.get(0)) {
          case (?d) {
            expect.text(debug_show(d.status)).equal(debug_show(#opened));
            expect.text(debug_show(d.level)).equal(debug_show(#l1));
          };
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("digital post-delivery opens L1 with 6h SLA anchor", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(2, alice, bob, #digital_delivered, true);
    trades.add(2, t);
    let before = Types.now();

    let result = Disputes.openDispute(
      disputes, trades, 0, alice, 2, #item_differs, "Wrong file",
      digitalEvidence(), [],
    );
    switch result {
      case (#ok(_)) {
        switch (disputes.get(0)) {
          case (?d) {
            expect.text(debug_show(d.tradeKind)).equal(debug_show(#digital));
            expect.bool(d.l1SlaDeadline <= before + 21_600_000_000_000 + 1_000_000).isTrue();
          };
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("incomplete evidence saves draft without freezing trade", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(3, alice, bob, #awaiting_receipt, false);
    trades.add(3, t);

    let badPack : Types.DisputeEvidencePack = {
      ttnScreenshotUrl = null;
      packagePhotoUrls = [];
      chatThreadLink = null;
      fileHash = null;
      downloadTimestamp = 0;
    };

    let result = Disputes.openDispute(
      disputes, trades, 0, alice, 3, #item_damaged, "Incomplete",
      badPack, [],
    );
    switch result {
      case (#ok(_)) assert false;
      case (#err(#invalid_input(_))) {
        expect.nat(disputes.size()).equal(1);
        switch (disputes.get(0)) {
          case (?d) expect.text(debug_show(d.status)).equal(debug_show(#draft));
          case null assert false;
        };
        switch (trades.get(3)) {
          case (?tr) expect.text(debug_show(tr.status)).equal(debug_show(#awaiting_receipt));
          case null assert false;
        };
      };
      case _ assert false;
    };
  });
});

suite("Disputes — E6.S9 L2 escalation + SLA", func() {
  test("manual L1 → L2 escalation enters moderator queue", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);
    ignore Disputes.openDispute(
      disputes, trades, 0, alice, 1, #other, "Issue",
      physicalEvidence(), [],
    );

    let result = Disputes.escalateDisputeToL2(disputes, trades, alice, 0);
    switch result {
      case (#ok(())) {
        switch (disputes.get(0)) {
          case (?d) {
            expect.text(debug_show(d.status)).equal(debug_show(#l2_queued));
            expect.text(debug_show(d.level)).equal(debug_show(#l2));
            expect.bool(d.l2TriageDeadline != null).isTrue();
            expect.bool(d.l2DecisionDeadline != null).isTrue();
          };
          case null assert false;
        };
        switch (trades.get(1)) {
          case (?tr) expect.text(debug_show(tr.status)).equal(debug_show(#dispute_l2));
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };
  });

  test("L1 SLA expiry auto-escalates to L2 (W2-8)", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);
    ignore Disputes.openDispute(
      disputes, trades, 0, alice, 1, #other, "Issue",
      physicalEvidence(), [],
    );
    switch (disputes.get(0)) {
      case (?d) { d.l1SlaDeadline := Types.now() - 1 };
      case null assert false;
    };

    let count = Disputes.processL1SlaEscalations(disputes, trades);
    expect.nat(count).equal(1);
    switch (disputes.get(0)) {
      case (?d) expect.text(debug_show(d.status)).equal(debug_show(#l2_queued));
      case null assert false;
    };
  });
});

suite("Disputes — E6.S9 L2 resolve idempotent", func() {
  test("moderator resolves L2 once to terminal refunded", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #moderator));
    ignore Disputes.openDispute(
      disputes, trades, 0, alice, 1, #other, "Issue",
      physicalEvidence(), [],
    );
    ignore Disputes.escalateDisputeToL2(disputes, trades, alice, 0);

    let result = Disputes.resolveDispute(disputes, trades, users, mod, 0, #buyer_wins, "Buyer wins");
    switch result {
      case (#ok(())) {
        switch (trades.get(1)) {
          case (?tr) expect.text(debug_show(tr.status)).equal(debug_show(#refunded));
          case null assert false;
        };
      };
      case (#err(_)) assert false;
    };

    let again = Disputes.resolveDispute(disputes, trades, users, mod, 0, #buyer_wins, "repeat");
    switch again {
      case (#ok(())) {};
      case (#err(_)) assert false;
    };
  });

  test("cannot resolve from L1 without escalation", func() {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #moderator));
    ignore Disputes.openDispute(
      disputes, trades, 0, alice, 1, #other, "Issue",
      physicalEvidence(), [],
    );

    let result = Disputes.resolveDispute(disputes, trades, users, mod, 0, #seller_wins, "");
    switch result {
      case (#ok(_)) assert false;
      case (#err(#invalid_input(_))) {};
      case _ assert false;
    };
  });
});

suite("Disputes — query ACL (getDispute / getDisputesByTrade)", func() {
  func seedDispute() : (
    Map.Map<Types.DisputeId, Types.Dispute>,
    Map.Map<Types.TradeId, Types.Trade>,
    Map.Map<Types.UserId, Types.User>,
    Map.Map<Types.DisputeId, Types.JuryAssignment>,
  ) {
    let disputes = Map.empty<Types.DisputeId, Types.Dispute>();
    let trades = Map.empty<Types.TradeId, Types.Trade>();
    let users = Map.empty<Types.UserId, Types.User>();
    let juryMap = Map.empty<Types.DisputeId, Types.JuryAssignment>();
    let t = makeTrade(1, alice, bob, #awaiting_receipt, false);
    trades.add(1, t);
    users.add(mod, makeUser("aaaaa-aa", #moderator));
    users.add(alice, makeUser("un4fu-tqaaa-aaaab-qadjq-cai", #user));
    ignore Disputes.openDispute(
      disputes, trades, 0, alice, 1, #other, "Issue",
      physicalEvidence(), [],
    );
    switch (disputes.get(0)) {
      case (?d) { d.moderatorNotes := ["internal note"] };
      case null assert false;
    };
    juryMap.add(0, {
      disputeId = 0;
      var jurorIds = [juror1];
      var votes = ([] : [Types.JurorVote]);
      var deadline = Types.now() + 86_400_000_000_000;
    });
    (disputes, trades, users, juryMap)
  };

  test("stranger getDispute returns null", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    switch (Disputes.getDispute(disputes, trades, juryMap, users, charlie, 0)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("trade participant getDispute succeeds without mod notes", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    switch (Disputes.getDispute(disputes, trades, juryMap, users, bob, 0)) {
      case (?v) {
        expect.nat(v.id).equal(0);
        expect.nat(v.moderatorNotes.size()).equal(0);
      };
      case null assert false;
    };
  });

  test("active moderator getDispute includes mod notes", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    switch (Disputes.getDispute(disputes, trades, juryMap, users, mod, 0)) {
      case (?v) expect.nat(v.moderatorNotes.size()).equal(1);
      case null assert false;
    };
  });

  test("assigned juror getDispute succeeds", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    expect.bool(Disputes.getDispute(disputes, trades, juryMap, users, juror1, 0) != null).isTrue();
  });

  test("stranger getDisputesByTrade returns empty", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    expect.nat(Disputes.getDisputesByTrade(disputes, trades, juryMap, users, charlie, 1).size()).equal(0);
  });

  test("trade participant getDisputesByTrade returns disputes", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    expect.nat(Disputes.getDisputesByTrade(disputes, trades, juryMap, users, alice, 1).size()).equal(1);
  });

  test("juror getDisputesByTrade returns assigned dispute", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    expect.nat(Disputes.getDisputesByTrade(disputes, trades, juryMap, users, juror1, 1).size()).equal(1);
  });

  test("stranger getDisputeJurors returns null", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    switch (Disputes.getDisputeJurors(juryMap, disputes, trades, users, charlie, 0)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("trade participant getDisputeJurors succeeds", func() {
    let (disputes, trades, users, juryMap) = seedDispute();
    expect.bool(Disputes.getDisputeJurors(juryMap, disputes, trades, users, bob, 0) != null).isTrue();
  });
});

