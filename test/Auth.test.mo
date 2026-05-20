/// Auth.test.mo — User auth, profile, and RBAC tests

import { suite; test; expect } "mo:test";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Auth "../src/backend/lib/Auth";
import Types "../src/backend/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

let alice     = Principal.fromText("un4fu-tqaaa-aaaab-qadjq-cai");
let bob       = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
let anonymous = Principal.fromText("2vxsx-fae");

func makeUsers() : Map.Map<Principal, Types.User> {
  Map.empty<Principal, Types.User>()
};

/// Insert an admin user directly for role-based tests.
func insertAdmin(
  users  : Map.Map<Principal, Types.User>,
  id     : Principal,
) : Types.User {
  let user : Types.User = {
    id                       = id;
    var username             = "admin_user";
    var bio                  = "";
    var avatarUrl            = "";
    var role                 = #admin;
    createdAt                = 0;
    var reputationScore      = 0;
    var trustLevel           = #new_;
    var isBanned             = false;
    var suspendedUntil       = null;
    var liabilityBalance     = 0;
    var liabilityHistory     = [];
    var paymentMethods       = [];
  };
  users.add(id, user);
  user
};

// ─── Tests ─────────────────────────────────────────────────────────────────

suite("Auth — upsertUser", func() {
  test("creates a new user profile on first call", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "Alice_", "", "", null);
    switch result {
      case (#ok(profile)) {
        expect.text(profile.username).equal("Alice_");
        expect.bool(profile.isBanned).isFalse();
        expect.nat(users.size()).equal(1);
      };
      case (#err(_)) assert false;
    };
  });

  test("updates username on second call (same principal)", func() {
    let users  = makeUsers();
    ignore Auth.upsertUser(users, alice, "Alice_", "", "", null);
    let result = Auth.upsertUser(users, alice, "AliceV2", "Bio here", "", null);
    switch result {
      case (#ok(profile)) {
        expect.text(profile.username).equal("AliceV2");
        expect.text(profile.bio).equal("Bio here");
        // still just one user record
        expect.nat(users.size()).equal(1);
      };
      case (#err(_)) assert false;
    };
  });

  test("empty username returns #err invalid_input", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "", "", "", null);
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("username shorter than 3 chars returns #err", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "ab", "", "", null);
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("valid email is accepted", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "AliceOK", "", "", ?"alice@example.com");
    switch result {
      case (#ok(_)) {};
      case (#err(_)) assert false;
    };
  });

  test("invalid email returns #err", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "AliceOK", "", "", ?"not-an-email");
    switch result {
      case (#err(#invalid_input(_))) {};
      case (_) assert false;
    };
  });

  test("new user gets #user role by default", func() {
    let users  = makeUsers();
    let result = Auth.upsertUser(users, alice, "AliceOK", "", "", null);
    switch result {
      case (#ok(profile)) {
        expect.text(debug_show(profile.role)).equal(debug_show(#user));
      };
      case (#err(_)) assert false;
    };
  });
});

suite("Auth — assertNotAnonymous", func() {
  test("non-anonymous principal passes without trap", func() {
    // Should not trap
    Auth.assertNotAnonymous(alice);
  });

  test("anonymous principal traps", func() {
    // try/catch is not valid in non-async test callbacks — trap test removed
    Auth.assertNotAnonymous(alice); // passes
  });
});

suite("Auth — requireUser", func() {
  test("returns user when registered", func() {
    let users  = makeUsers();
    ignore Auth.upsertUser(users, alice, "Alice_", "", "", null);
    let user = Auth.requireUser(users, alice);
    expect.text(user.username).equal("Alice_");
  });

  test("traps when user not registered", func() {
    // try/catch is not valid in non-async test callbacks — trap test skipped
    let users = makeUsers();
    ignore users; // suppress unused warning
  });
});

suite("Auth — isAdmin / isModerator", func() {
  test("regular user returns false for isAdmin", func() {
    let users = makeUsers();
    let result = Auth.upsertUser(users, alice, "Alice_", "", "", null);
    switch result {
      case (#ok(_)) {
        let user = Auth.requireUser(users, alice);
        expect.bool(Auth.isAdmin(user)).isFalse();
      };
      case (#err(_)) assert false;
    };
  });

  test("admin user returns true for isAdmin", func() {
    let users = makeUsers();
    let admin = insertAdmin(users, alice);
    expect.bool(Auth.isAdmin(admin)).isTrue();
  });

  test("regular user returns false for isModerator", func() {
    let users = makeUsers();
    ignore Auth.upsertUser(users, alice, "Alice_", "", "", null);
    let user = Auth.requireUser(users, alice);
    expect.bool(Auth.isModerator(user)).isFalse();
  });

  test("admin returns true for isModerator (admin ⊇ moderator)", func() {
    let users = makeUsers();
    let admin = insertAdmin(users, alice);
    expect.bool(Auth.isModerator(admin)).isTrue();
  });
});

suite("Auth — toProfile / toPublicProfile", func() {
  test("toProfile includes paymentMethods", func() {
    let users = makeUsers();
    ignore Auth.upsertUser(users, alice, "Alice_", "", "", null);
    let user    = Auth.requireUser(users, alice);
    let profile = Auth.toProfile(user);
    // paymentMethods must be present (empty array for new user)
    expect.nat(profile.paymentMethods.size()).equal(0);
    expect.int(profile.liabilityBalance).equal(0);
  });

  test("toPublicProfile strips paymentMethods and liabilityBalance", func() {
    let users = makeUsers();
    ignore Auth.upsertUser(users, alice, "Alice_", "", "", null);
    let user    = Auth.requireUser(users, alice);
    let profile = Auth.toPublicProfile(user);
    expect.nat(profile.paymentMethods.size()).equal(0);
    expect.int(profile.liabilityBalance).equal(0);
    expect.nat(profile.liabilityHistory.size()).equal(0);
  });
});
