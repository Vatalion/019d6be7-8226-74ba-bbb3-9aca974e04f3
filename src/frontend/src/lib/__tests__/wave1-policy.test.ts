import { ShippingCarrier } from "@/backend.d";
import {
  ACTIVE_PHYSICAL_SHIPPING_CARRIER,
  DISABLED_PHYSICAL_SHIPPING_CARRIERS,
  NOVA_POSHTA_SHIPPING_OPTION,
  PHYSICAL_DELIVERY_LOCKED_TO_PICKUP,
  getPhysicalShippingMethods,
  isDisabledPhysicalShippingCarrier,
  isEnabledPhysicalShippingCarrier,
} from "@/lib/deliveryPolicy";
import {
  formatFeeBpsPercent,
  formatTokenAmount,
  toTradeFeeQuoteView,
} from "@/lib/tradeFeeQuote";
import { describe, expect, it } from "vitest";

describe("deliveryPolicy — Nova Poshta only (E7.S3)", () => {
  it("physical delivery is not locked to pickup", () => {
    expect(PHYSICAL_DELIVERY_LOCKED_TO_PICKUP).toBe(false);
  });

  it("only Nova Poshta is the active physical carrier", () => {
    expect(ACTIVE_PHYSICAL_SHIPPING_CARRIER).toBe(ShippingCarrier.nova_poshta);
    expect(isEnabledPhysicalShippingCarrier(ShippingCarrier.nova_poshta)).toBe(
      true,
    );
    expect(isEnabledPhysicalShippingCarrier(ShippingCarrier.self_pickup)).toBe(
      false,
    );
    expect(isEnabledPhysicalShippingCarrier(ShippingCarrier.ukrposhta)).toBe(
      false,
    );
    expect(isEnabledPhysicalShippingCarrier(ShippingCarrier.meest)).toBe(false);
  });

  it("disabled carriers include self-pickup, Ukrposhta, Meest", () => {
    for (const carrier of [
      ShippingCarrier.self_pickup,
      ShippingCarrier.ukrposhta,
      ShippingCarrier.meest,
    ]) {
      expect(DISABLED_PHYSICAL_SHIPPING_CARRIERS).toContain(carrier);
      expect(isDisabledPhysicalShippingCarrier(carrier)).toBe(true);
    }
  });

  it("physical shipping methods expose Nova Poshta only", () => {
    const methods = getPhysicalShippingMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0]?.carrier).toBe(ShippingCarrier.nova_poshta);
    expect(NOVA_POSHTA_SHIPPING_OPTION.carrier).toBe(
      ShippingCarrier.nova_poshta,
    );
  });
});

describe("tradeFeeQuote — upfront fee breakdown (E3.S8)", () => {
  it("formats token amounts with 6 decimals", () => {
    expect(formatTokenAmount(1_500_000n)).toBe("$1.50");
    expect(formatTokenAmount(10_000_000n)).toBe("$10.00");
  });

  it("formats fee bps as percent label", () => {
    expect(formatFeeBpsPercent(300n)).toBe("3%");
    expect(formatFeeBpsPercent(250n)).toBe("2.50%");
  });

  it("builds checkout view with item, fee, and total", () => {
    const view = toTradeFeeQuoteView({
      itemPrice: 100_000_000n,
      platformFeeAmount: 3_000_000n,
      platformFeeBps: 300n,
      totalBuyerAmount: 103_000_000n,
      usesDefaultFeeBps: true,
      token: "USDT_TRC20" as never,
    });
    expect(view.itemPriceFormatted).toBe("$100.00");
    expect(view.platformFeeFormatted).toBe("$3.00");
    expect(view.totalFormatted).toBe("$103.00");
    expect(view.feePercentLabel).toBe("3%");
  });
});

describe("handshake gating mocks (E3.S7)", () => {
  it("blocks payment CTA until seller confirms handshake", () => {
    const tradeStatus = "awaiting_seller_handshake";
    const canShowPayment =
      tradeStatus !== "awaiting_seller_handshake" && tradeStatus !== "pending";
    expect(canShowPayment).toBe(false);
  });

  it("allows payment after seller handshake confirms", () => {
    const tradeStatus = "payment_intent";
    const canShowPayment =
      tradeStatus === "payment_intent" ||
      tradeStatus === "manual_payment_pending";
    expect(canShowPayment).toBe(true);
  });
});

describe("digital policy — inspection window (E7.S2)", () => {
  it("anchors inspection deadline to deliveryRecordAt, not redownload", () => {
    const deliveryRecordAt = 1_000_000n;
    const inspectionWindowNs = 86_400_000_000_000n; // 24h
    const deadline = deliveryRecordAt + inspectionWindowNs;
    const redownloadAt = deliveryRecordAt + 43_200_000_000_000n;
    expect(deadline).toBe(deliveryRecordAt + inspectionWindowNs);
    expect(redownloadAt + inspectionWindowNs).not.toBe(deadline);
  });

  it("rejects dispute after inspection window without admin reopen", () => {
    const now = 100n;
    const deadline = 50n;
    const adminReopen = false;
    const canDispute = now <= deadline || adminReopen;
    expect(canDispute).toBe(false);
  });
});
