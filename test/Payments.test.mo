/// Payments.test.mo — formatAmount precision tests

import { suite; test; expect } "mo:test";
import Payments "../src/backend/lib/Payments";

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
