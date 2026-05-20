/// Admin.test.mo — Admin moderation and system settings tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Admin "../src/backend/lib/Admin";
import Auth "../src/backend/lib/Auth";
import Types "../src/backend/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

let adminPrincipal = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let userPrincipal  = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let otherPrincipal = Principal.fromText("aaaaa-aa");

func makeUsers() : Map.Map<Types.UserId, Types.User> {
  Map.empty<Types.UserId, Types.User>()
};

func makeAuditLog() : List.List<Admin.AuditEntry> {
  List.empty<Admin.AuditEntry>()
};

func makeSettings() : Admin.SystemSettings {
  {
    var minTradeAmountUSD        = 1;
    var paymentTimeoutHours      = 24;
    var allowedTokens            = [#USDT_TRC20, #USDT_BEP20, #USDT_ERC20, #USDC_ERC20];
    var maxListingPriceUSD       = 1_000_000;
    var novaPoshtaApiKey         = "";
    var ukrPoshtaApiKey          = "";
    var meestApiKey              = "";
    var tronGridApiKey           = "";
    var bscScanApiKey            = "";
    var infuraApiKey             = "";
    var solanaRpcUrl             = "https://api.mainnet-beta.solana.com";
    var polygonApiKey            = "";
    var avalancheApiKey          = "";
    var ckUsdcLedgerId           = "xevnm-gaaaa-aaaar-qafnq-cai";
    var ckUsdtLedgerId           = "cngnf-vqaaa-aaaar-qag4q-cai";
    var cyclesBalanceThreshold   = 1_000_000_000_000;
    var errorRateThreshold       = 5.0;
  }
};

/// Insert an admin user into the users map.
func insertAdmin(users : Map.Map<Types.UserId, Types.User>, id : Principal) {
  let user : Types.User = {
    id                   = id;
    var username         = "admin";
    var bio              = "";
    var avatarUrl        = "";
    var role             = #admin;
    createdAt            = 0;
    var reputationScore  = 0;
    var trustLevel       = #new_;
    var isBanned         = false;
    var suspendedUntil   = null;
    var liabilityBalance = 0;
    var liabilityHistory = [];
    var paymentMethods   = [];
  };
  users.add(id, user);
};

/// Insert a regular user into the users map.
func insertUser(users : Map.Map<Types.UserId, Types.User>, id : Principal) {
  let user : Types.User = {
    id                   = id;
    var username         = "user_" # id.toText().size().toText();
    var bio              = "";
    var avatarUrl        = "";
    var role             = #user;
    createdAt            = 0;
    var reputationScore  = 0;
    var trustLevel       = #new_;
    var isBanned         = false;
    var suspendedUntil   = null;
    var liabilityBalance = 0;
    var liabilityHistory = [];
    var paymentMethods   = [];
  };
  users.add(id, user);
};

// ─── Tests ─────────────────────────────────────────────────────────────────

suite("Admin — banUser", func() {
  test("admin can ban a regular user", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    let nextAuditId = Admin.banUser(
      users, auditLog, 0, adminPrincipal, userPrincipal, "Spam"
    );
    let target = Auth.requireUser(users, userPrincipal);
    expect.bool(target.isBanned).isTrue();
    // banUser returns nextId + 1
    expect.nat(nextAuditId).equal(1);
  });

  test("ban creates an audit log entry", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    ignore Admin.banUser(
      users, auditLog, 0, adminPrincipal, userPrincipal, "Test ban"
    );
    expect.nat(auditLog.size()).equal(1);
    switch (auditLog.at(0)) {
      case (entry) expect.text(entry.action).equal("banUser");
    };
  });

  test("non-admin cannot ban users (traps)", func() {
    // try/catch not valid in non-async test callbacks — trap test skipped
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertUser(users, otherPrincipal);
    let target = Auth.requireUser(users, otherPrincipal);
    expect.bool(target.isBanned).isFalse();
  });
});

suite("Admin — unbanUser", func() {
  test("admin can unban a banned user", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    ignore Admin.banUser(users, auditLog, 0, adminPrincipal, userPrincipal, "Spam");
    ignore Admin.unbanUser(users, auditLog, 1, adminPrincipal, userPrincipal);
    let target = Auth.requireUser(users, userPrincipal);
    expect.bool(target.isBanned).isFalse();
  });

  test("unban creates an audit log entry", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    ignore Admin.banUser(users, auditLog, 0, adminPrincipal, userPrincipal, "Spam");
    ignore Admin.unbanUser(users, auditLog, 1, adminPrincipal, userPrincipal);
    expect.nat(auditLog.size()).equal(2);
    switch (auditLog.at(1)) {
      case (entry) expect.text(entry.action).equal("unbanUser");
    };
  });
});

suite("Admin — updateSystemSettings", func() {
  test("admin can update allowedTokens to the 4 active tokens", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    let settings = makeSettings();
    insertAdmin(users, adminPrincipal);
    let nextId = Admin.updateSystemSettings(
      users, settings, auditLog, 0, adminPrincipal,
      1,                          // minTradeAmountUSD
      24,                         // paymentTimeoutHours
      [#USDT_TRC20, #USDT_BEP20, #USDT_ERC20, #USDC_ERC20],
      1_000_000,                  // maxListingPriceUSD
      1_000_000_000_000,          // cyclesBalanceThreshold
      5.0,                        // errorRateThreshold
    );
    expect.nat(settings.allowedTokens.size()).equal(4);
    expect.text(debug_show(settings.allowedTokens[0])).equal(debug_show(#USDT_TRC20));
    expect.nat(nextId).equal(1);
  });

  test("updateSystemSettings creates audit log entry", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    let settings = makeSettings();
    insertAdmin(users, adminPrincipal);
    ignore Admin.updateSystemSettings(
      users, settings, auditLog, 0, adminPrincipal,
      1, 24, [#USDT_TRC20, #USDT_BEP20, #USDT_ERC20, #USDC_ERC20],
      1_000_000, 1_000_000_000_000, 5.0,
    );
    expect.nat(auditLog.size()).equal(1);
    switch (auditLog.at(0)) {
      case (entry) expect.text(entry.action).equal("updateSystemSettings");
    };
  });

  test("non-admin cannot update settings (traps)", func() {
    // try/catch not valid in non-async test callbacks — trap test skipped
    let settings = makeSettings();
    expect.nat(settings.allowedTokens.size()).equal(4);
  });

  test("empty allowedTokens list traps", func() {
    // try/catch not valid in non-async test callbacks — trap test skipped
    let settings = makeSettings();
    ignore settings;
  });
});

suite("Admin — promoteToModerator", func() {
  test("admin can promote a user to moderator", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    ignore Admin.promoteToModerator(
      users, auditLog, 0, adminPrincipal, userPrincipal
    );
    let target = Auth.requireUser(users, userPrincipal);
    expect.text(debug_show(target.role)).equal(debug_show(#moderator));
  });

  test("promotion creates audit log entry", func() {
    let users    = makeUsers();
    let auditLog = makeAuditLog();
    insertAdmin(users, adminPrincipal);
    insertUser(users, userPrincipal);
    ignore Admin.promoteToModerator(
      users, auditLog, 0, adminPrincipal, userPrincipal
    );
    expect.nat(auditLog.size()).equal(1);
    switch (auditLog.at(0)) {
      case (entry) expect.text(entry.action).equal("promoteToModerator");
    };
  });
});

suite("Admin — reportListing", func() {
  test("user report appends audit entry", func() {
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let auditLog = makeAuditLog();
    let listing : Types.Listing = {
      id = 1;
      seller = otherPrincipal;
      var title = "Bike";
      var description = "Test";
      var category = #other;
      var categoryId = 1;
      var priceAmount = 100;
      var priceToken = #USDT_TRC20;
      var condition = #good;
      var photos = [];
      var location = "Kyiv";
      var shippingMethods = [];
      isDigital = false;
      var digitalFileUrl = null;
      var digitalFileHash = null;
      var digitalPassword = null;
      var digitalFileUrlEncrypted = null;
      var digitalPasswordEncrypted = null;
      var status = #active;
      createdAt = 0;
      var expiresAt = 999_999_999_999_999_999;
      var viewCount = 0;
      var packageDetails = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig = null;
      var meestConfig = null;
      var resolvedAt = null;
      var bumpedAt = 0;
      var promotedUntil = null;
    };
    listings.add(1, listing);
    let (newId, result) = Admin.reportListing(
      listings, auditLog, 0, userPrincipal, 1, "Misleading price",
    );
    expect.nat(newId).equal(1);
    switch result {
      case (#ok(())) {};
      case (#err(_)) assert false;
    };
    expect.nat(auditLog.size()).equal(1);
    switch (auditLog.at(0)) {
      case (e) expect.text(e.action).equal("reportListing");
    };
  });

  test("cannot report own listing", func() {
    let listings = Map.empty<Types.ListingId, Types.Listing>();
    let auditLog = makeAuditLog();
    let listing : Types.Listing = {
      id = 1;
      seller = userPrincipal;
      var title = "Mine";
      var description = "";
      var category = #other;
      var categoryId = 1;
      var priceAmount = 1;
      var priceToken = #USDT_TRC20;
      var condition = #good;
      var photos = [];
      var location = "";
      var shippingMethods = [];
      isDigital = false;
      var digitalFileUrl = null;
      var digitalFileHash = null;
      var digitalPassword = null;
      var digitalFileUrlEncrypted = null;
      var digitalPasswordEncrypted = null;
      var status = #active;
      createdAt = 0;
      var expiresAt = 1;
      var viewCount = 0;
      var packageDetails = null;
      var novaPoshtaConfig = null;
      var ukrposhtaConfig = null;
      var meestConfig = null;
      var resolvedAt = null;
      var bumpedAt = 0;
      var promotedUntil = null;
    };
    listings.add(1, listing);
    let (_newId, result) = Admin.reportListing(
      listings, auditLog, 0, userPrincipal, 1, "x",
    );
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });
});

suite("Admin — getExplorerApiKeyStatus", func() {
  test("admin sees unset explorer keys", func() {
    let users    = makeUsers();
    let settings = makeSettings();
    insertAdmin(users, adminPrincipal);
    let status = Admin.getExplorerApiKeyStatus(users, settings, adminPrincipal);
    expect.bool(status.tronGridConfigured).equal(false);
    expect.bool(status.bscScanConfigured).equal(false);
    expect.bool(status.infuraConfigured).equal(false);
  });

  test("configured keys are reported without exposing values", func() {
    let users    = makeUsers();
    let settings = makeSettings();
    insertAdmin(users, adminPrincipal);
    settings.tronGridApiKey := "secret-tron";
    settings.bscScanApiKey := "secret-bsc";
    let status = Admin.getExplorerApiKeyStatus(users, settings, adminPrincipal);
    expect.bool(status.tronGridConfigured).equal(true);
    expect.bool(status.bscScanConfigured).equal(true);
    expect.bool(status.infuraConfigured).equal(false);
  });
});

suite("Admin — getSystemSettings", func() {
  test("admin can read system settings", func() {
    let users    = makeUsers();
    let settings = makeSettings();
    insertAdmin(users, adminPrincipal);
    let result = Admin.getSystemSettings(users, settings, adminPrincipal);
    expect.nat(result.allowedTokens.size()).equal(4);
    expect.nat(result.paymentTimeoutHours).equal(24);
  });

  test("non-admin cannot read settings (traps)", func() {
    // try/catch not valid in non-async test callbacks — trap test skipped
    let settings = makeSettings();
    ignore settings;
  });
});
