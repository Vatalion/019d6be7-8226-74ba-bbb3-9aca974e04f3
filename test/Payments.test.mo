/// Payments.test.mo — formatAmount precision tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Payments "../src/backend/lib/Payments";
import Types "../src/backend/types";

suite("Payments — formatAmount precision (6 decimals)", func() {
  test("1_000_000 with 6 decimals → '1.000000'", func() {
    expect.text(Payments.formatAmount(1_000_000, 6)).equal("1.000000");
  });

  test("1 with 6 decimals → '0.000001'", func() {
    expect.text(Payments.formatAmount(1, 6)).equal("0.000001");
  });

  test("500_000 with 6 decimals → '0.500000'", func() {
    expect.text(Payments.formatAmount(500_000, 6)).equal("0.500000");
  });

  test("1_500_000 with 6 decimals → '1.500000'", func() {
    expect.text(Payments.formatAmount(1_500_000, 6)).equal("1.500000");
  });

  test("0 with 6 decimals → '0.000000'", func() {
    expect.text(Payments.formatAmount(0, 6)).equal("0.000000");
  });

  test("100_000_000 with 6 decimals (100 USDT) → '100.000000'", func() {
    expect.text(Payments.formatAmount(100_000_000, 6)).equal("100.000000");
  });
});

suite("Payments — formatAmount precision (18 decimals — USDT_BEP20)", func() {
  test("1_000_000_000_000_000_000 with 18 decimals → '1.000000000000000000'", func() {
    expect.text(Payments.formatAmount(1_000_000_000_000_000_000, 18)).equal("1.000000000000000000");
  });

  test("1 with 18 decimals → '0.000000000000000001'", func() {
    expect.text(Payments.formatAmount(1, 18)).equal("0.000000000000000001");
  });
});

suite("Payments — formatAmount edge cases", func() {
  test("42 with 0 decimals → '42'", func() {
    expect.text(Payments.formatAmount(42, 0)).equal("42");
  });
});

suite("Payments — formatTokenAmount using token metadata", func() {
  test("USDT_TRC20 (6 dec): 1_000_000 → '1.000000'", func() {
    expect.text(Payments.formatTokenAmount(1_000_000, #USDT_TRC20)).equal("1.000000");
  });

  test("USDC_ERC20 (6 dec): 250_000 → '0.250000'", func() {
    expect.text(Payments.formatTokenAmount(250_000, #USDC_ERC20)).equal("0.250000");
  });

  test("USDT_BEP20 (18 dec): 1_000_000_000_000_000_000 → '1.000000000000000000'", func() {
    expect.text(Payments.formatTokenAmount(1_000_000_000_000_000_000, #USDT_BEP20)).equal("1.000000000000000000");
  });

  test("ckUSDC (6 dec): 5_000_000 → '5.000000'", func() {
    expect.text(Payments.formatTokenAmount(5_000_000, #ckUSDC)).equal("5.000000");
  });
});

suite("Payments — explorer response parsing", func() {
  test("parseTronGridResponse extracts recipient", func() {
    let json = "{\"data\":[{\"contract_address\":\"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\",\"to_address\":\"TXyz\",\"amount\":\"1000000\",\"blockNumber\":\"123\"}]}";
    switch (Payments.parseTronGridResponse(json)) {
      case (?p) {
        expect.text(p.recipient).equal("TXyz");
      };
      case null assert false;
    };
  });

  test("parseBscScanResponse accepts success status", func() {
    let json = "{\"status\":\"1\",\"result\":{\"status\":\"1\",\"blockNumber\":\"456\"}}";
    switch (Payments.parseBscScanResponse(json)) {
      case (?p) {
        expect.bool(p.success).equal(true);
        expect.nat(p.blockNumber).equal(456);
      };
      case null assert false;
    };
  });

  test("parseBscScanTokenTransfer extracts recipient and amount", func() {
    let json = "{\"status\":\"1\",\"result\":{\"status\":\"0x1\",\"blockNumber\":\"0x1a2\","
      # "\"logs\":[{\"topics\":[\"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163caa17373\","
      # "\"0x0000000000000000000000001111111111111111111111111111111111111111\","
      # "\"0x0000000000000000000000002222222222222222222222222222222222222222\"],"
      # "\"data\":\"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000\"}]}}";
    switch (Payments.parseBscScanTokenTransfer(json)) {
      case (?p) {
        expect.text(p.recipient).equal("0x2222222222222222222222222222222222222222");
        expect.nat(p.amountRaw).equal(1_000_000_000_000_000_000);
        expect.nat(p.blockNumber).equal(418);
      };
      case null assert false;
    };
  });

  test("parseBscScanTokenTransfer rejects wrong USDT contract via parseEvmTokenTransfer", func() {
    let json = "{\"status\":\"1\",\"result\":{\"status\":\"0x1\",\"blockNumber\":\"0x1a2\","
      # "\"logs\":[{\"address\":\"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef\","
      # "\"topics\":[\"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163caa17373\","
      # "\"0x0000000000000000000000001111111111111111111111111111111111111111\","
      # "\"0x0000000000000000000000002222222222222222222222222222222222222222\"],"
      # "\"data\":\"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000\"}]}}";
    switch (Payments.parseEvmTokenTransfer(json, Payments.USDT_BEP20_CONTRACT)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("parseEvmTokenTransfer accepts allowlisted USDT BEP20 contract", func() {
    let json = "{\"status\":\"1\",\"result\":{\"status\":\"0x1\",\"blockNumber\":\"0x1a2\","
      # "\"logs\":[{\"address\":\"0x55d398326f99059ff775485246999027b3197955\","
      # "\"topics\":[\"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163caa17373\","
      # "\"0x0000000000000000000000001111111111111111111111111111111111111111\","
      # "\"0x0000000000000000000000002222222222222222222222222222222222222222\"],"
      # "\"data\":\"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000\"}]}}";
    switch (Payments.parseEvmTokenTransfer(json, Payments.USDT_BEP20_CONTRACT)) {
      case (?p) {
        expect.text(p.recipient).equal("0x2222222222222222222222222222222222222222");
        expect.nat(p.amountRaw).equal(1_000_000_000_000_000_000);
      };
      case null assert false;
    };
  });
});

suite("Payments — validatePaymentAmount", func() {
  test("amount > 0 and >= min → #ok", func() {
    let result = Payments.validatePaymentAmount(100, 50);
    switch result {
      case (#ok(())) {};
      case (#err(_)) assert false;
    };
  });

  test("amount == 0 → #err", func() {
    let result = Payments.validatePaymentAmount(0, 0);
    switch result {
      case (#ok(())) assert false;
      case (#err(_)) {};
    };
  });

  test("amount < minTradeAmount → #err", func() {
    let result = Payments.validatePaymentAmount(10, 100);
    switch result {
      case (#ok(())) assert false;
      case (#err(_)) {};
    };
  });
});

suite("E13.S1 — LG-09 explorer verification guards", func() {
  let intent : Types.PaymentIntent = {
    token = #USDT_TRC20;
    network = "TRC20";
    exactAmount = 1_030_000;
    recipient = "TXyzSellerPayoutWallet123456789012";
    expiry = Types.now() + 86_400_000_000_000;
    path = #manual;
    createdAt = Types.now();
  };

  test("LG-09 wrong recipient rejected", func() {
    switch (Payments.validateExplorerMatch(intent, "TWrongRecipient123456789012345", 1_030_000)) {
      case (?_) {};
      case null assert false;
    };
  });

  test("LG-09 underpay rejected", func() {
    switch (Payments.validateExplorerMatch(intent, intent.recipient, 1_000_000)) {
      case (?_) {};
      case null assert false;
    };
  });

  test("LG-09 exact match accepted", func() {
    switch (Payments.validateExplorerMatch(intent, intent.recipient, 1_030_000)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("LG-09 reused tx hash rejected", func() {
    let used = Map.empty<Text, Types.TradeId>();
    used.add("abc123hash", 1);
    switch (Payments.validateTxHashNotReused(used, "abc123hash", 2)) {
      case (?_) {};
      case null assert false;
    };
    switch (Payments.validateTxHashNotReused(used, "abc123hash", 1)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("LG-09 applyExplorerVerificationGates rejects zero amount", func() {
    let intent : Types.PaymentIntent = {
      token = #USDT_BEP20;
      network = "BEP20";
      exactAmount = 1_030_000_000_000_000_000;
      recipient = "0x2222222222222222222222222222222222222222";
      expiry = Types.now() + 86_400_000_000_000;
      path = #manual;
      createdAt = Types.now();
    };
    let used = Map.empty<Text, Types.TradeId>();
    let base : Types.PaymentVerificationResult = {
      status = #verified;
      txHash = "0xabc";
      confirmedAmount = 0.0;
      confirmedRecipient = intent.recipient;
      blockNumber = 1;
      errorReason = null;
    };
    let gated = Payments.applyExplorerVerificationGates(
      intent, "0xabc", 1, used, intent.recipient, 0, base,
    );
    switch (gated.status) {
      case (#failed) {};
      case (_) assert false;
    };
  });
});

suite("E4.S8 — ERC20 manual explorer verification (W3-12)", func() {
  let usdcContract = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  let usdtContract = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  let erc20ReceiptJson = func(contract : Text) : Text {
    "{\"jsonrpc\":\"2.0\",\"result\":{\"status\":\"0x1\",\"blockNumber\":\"0x64\","
      # "\"logs\":[{\"address\":\"" # contract # "\",\"topics\":["
      # "\"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163caa17373\","
      # "\"0x0000000000000000000000001111111111111111111111111111111111111111\","
      # "\"0x0000000000000000000000002222222222222222222222222222222222222222\"],"
      # "\"data\":\"0x000000000000000000000000000000000000000000000000000000000f4240\"}]}}"
  };

  test("W3-12 USDC_ERC20 transfer parsed with correct contract", func() {
    switch (Payments.parseEvmTokenTransfer(erc20ReceiptJson(usdcContract), usdcContract)) {
      case (?p) {
        expect.text(p.recipient).equal("0x2222222222222222222222222222222222222222");
        expect.nat(p.amountRaw).equal(1_000_000);
        expect.nat(p.blockNumber).equal(100);
        expect.text(p.contract).equal("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
      };
      case null assert false;
    };
  });

  test("W3-12 wrong contract rejected", func() {
    switch (Payments.parseEvmTokenTransfer(erc20ReceiptJson(usdtContract), usdcContract)) {
      case null {};
      case (?_) assert false;
    };
  });

  test("expectedErc20Contract returns mainnet USDC address", func() {
    switch (Payments.expectedErc20Contract(#USDC_ERC20)) {
      case (?addr) {
        expect.text(addr).equal("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
      };
      case null assert false;
    };
  });

  test("evmConfirmationsSufficient requires 12 blocks", func() {
    expect.bool(Payments.evmConfirmationsSufficient(100, 111)).isTrue();
    expect.bool(Payments.evmConfirmationsSufficient(100, 110)).isFalse();
    expect.bool(Payments.evmConfirmationsSufficient(100, 100)).isFalse();
  });

  test("parseEthBlockNumberResponse extracts block", func() {
    switch (Payments.parseEthBlockNumberResponse("{\"result\":\"0x64\"}")) {
      case (?n) expect.nat(n).equal(100);
      case null assert false;
    };
  });
});
