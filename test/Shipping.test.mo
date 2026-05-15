/// Shipping.test.mo — escapeJsonString tests
///
/// escapeJsonString was made public in lib/Shipping.mo so it can be tested directly.

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
    // Input:  a"b\c
    // Step 1 (escape \\): a"b\\c
    // Step 2 (escape \"): a\"b\\c
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
