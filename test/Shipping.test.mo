/// Shipping.test.mo — Nova Poshta TTN validation and status mapping (E7.S3)

import { suite; test; expect } "mo:test";
import Shipping "../src/backend/lib/Shipping";

suite("Shipping — escapeJsonString", func() {
  test("plain string is unchanged", func() {
    expect.text(Shipping.escapeJsonString("hello world")).equal("hello world");
  });

  test("double-quote is escaped to backslash-quote", func() {
    expect.text(Shipping.escapeJsonString("test\"quote")).equal("test\\\"quote");
  });

  test("backslash is escaped to double-backslash", func() {
    expect.text(Shipping.escapeJsonString("back\\slash")).equal("back\\\\slash");
  });

  test("newline is escaped to backslash-n", func() {
    expect.text(Shipping.escapeJsonString("new\nline")).equal("new\\nline");
  });

  test("carriage-return is escaped to backslash-r", func() {
    expect.text(Shipping.escapeJsonString("carriage\rreturn")).equal("carriage\\rreturn");
  });

  test("tab is escaped to backslash-t", func() {
    expect.text(Shipping.escapeJsonString("tab\there")).equal("tab\\there");
  });

  test("empty string stays empty", func() {
    expect.text(Shipping.escapeJsonString("")).equal("");
  });

  test("combined: double-quote and backslash (order matters: \\\\ before \\\")", func() {
    expect.text(Shipping.escapeJsonString("a\"b\\c")).equal("a\\\"b\\\\c");
  });

  test("combined: all control characters \\n\\r\\t", func() {
    expect.text(Shipping.escapeJsonString("\n\r\t")).equal("\\n\\r\\t");
  });

  test("city name with embedded quotes is safely escaped", func() {
    let city = "Kyiv \"Center\"";
    expect.text(Shipping.escapeJsonString(city)).equal("Kyiv \\\"Center\\\"");
  });

  test("alphanumeric with no special chars is unchanged", func() {
    let input = "NovaPoshtaCity123";
    expect.text(Shipping.escapeJsonString(input)).equal(input);
  });
});

suite("Shipping — Nova Poshta TTN validation (E7.S3)", func() {
  test("valid 14-digit TTN accepted", func() {
    expect.bool(Shipping.isValidNpTtnFormat("59000123456789")).isTrue();
  });

  test("valid 11-digit TTN accepted", func() {
    expect.bool(Shipping.isValidNpTtnFormat("59000123456")).isTrue();
  });

  test("too short TTN rejected", func() {
    expect.bool(Shipping.isValidNpTtnFormat("5900012345")).isFalse();
  });

  test("LG-10 invalid TTN rejected for ship gate", func() {
    expect.bool(Shipping.isValidNpTtnFormat("bad-ttn")).isFalse();
    expect.bool(Shipping.isValidNpTtnFormat("59000123456789")).isTrue();
  });

  test("too long TTN rejected", func() {
    expect.bool(Shipping.isValidNpTtnFormat("5900012345678901")).isFalse();
  });

  test("non-digit TTN rejected", func() {
    expect.bool(Shipping.isValidNpTtnFormat("5900012345678A")).isFalse();
  });

  test("empty TTN rejected", func() {
    expect.bool(Shipping.isValidNpTtnFormat("")).isFalse();
  });
});

suite("Shipping — unified status mapping (E7.S3)", func() {
  test("delivered / вручено maps to delivered", func() {
    expect.text(Shipping.mapToUnifiedStatus("Вручено одержувачу")).equal("delivered");
    expect.text(Shipping.mapToUnifiedStatus("Delivered to recipient")).equal("delivered");
  });

  test("arrived at branch is not delivered", func() {
    expect.text(Shipping.mapToUnifiedStatus("Arrived at branch")).equal("arrived_at_branch");
    expect.text(Shipping.mapToUnifiedStatus("Прибув на відділення")).equal("arrived_at_branch");
    expect.bool(Shipping.isNpDeliveredStatus("arrived_at_branch")).isFalse();
    expect.bool(Shipping.isNpArrivedAtBranchStatus("arrived_at_branch")).isTrue();
  });

  test("LG-11 arrived_at_branch completion job does not treat as delivered", func() {
    expect.bool(Shipping.isNpDeliveredStatus("arrived_at_branch")).isFalse();
    expect.text(Shipping.mapToUnifiedStatus("Arrived at branch")).equal("arrived_at_branch");
  });

  test("in transit maps correctly", func() {
    expect.text(Shipping.mapToUnifiedStatus("В дорозі до міста")).equal("in_transit");
  });
});

suite("Shipping — carrier TTN acceptance", func() {
  test("success tracking JSON accepted", func() {
    let json = "{\"success\":true,\"data\":[{\"StatusDescription\":\"В дорозі\"}]}";
    expect.bool(Shipping.carrierAcceptsTtn(json)).isTrue();
  });

  test("failed tracking JSON rejected", func() {
    let json = "{\"success\":false,\"errors\":[{\"errorDescription\":\"Not found\"}]}";
    expect.bool(Shipping.carrierAcceptsTtn(json)).isFalse();
  });
});
