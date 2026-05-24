import Array         "mo:core/Array";
import Blob          "mo:core/Blob";
import Char          "mo:core/Char";
import Map           "mo:core/Map";
import Nat8          "mo:core/Nat8";
import Runtime       "mo:core/Runtime";
import Set           "mo:core/Set";
import Text          "mo:core/Text";
import Time          "mo:core/Time";
import Auth          "../lib/Auth";
import Types         "../types";

/// Caffeine Immutable Object Storage protocol (gateway + scrubber).
///
/// Upload certificates: the frontend reads the IC v3 response certificate from
/// `_immutableObjectStorageCreateCertificate`. The gateway expects the certified
/// update reply to contain `{ method = "upload"; blob_hash = "<sha256:…>" }`.
/// Do NOT use CertifiedData.set() here — that legacy path certifies raw hash
/// bytes and causes intermittent 403 Invalid payload on blob.caffeine.ai.
mixin (
  liveBlobs     : Map.Map<Text, { hash : Text; createdAt : Int }>,
  pendingDelete : Set.Set<Text>,
  users         : Map.Map<Types.UserId, Types.User>,
) {

  public type CreateCertificateResult = {
    method : Text;
    blob_hash : Text;
  };

  let hexChars : [Char] = [
    '0', '1', '2', '3', '4', '5', '6', '7',
    '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
  ];

  func byteToHex(b : Nat8) : Text {
    let n  = b.toNat();
    let hi = n / 16;
    let lo = n % 16;
    Text.fromChar(hexChars[hi]) # Text.fromChar(hexChars[lo])
  };

  func hexNibble(c : Char) : ?Nat {
    let n = c.toNat32().toNat();
    if (c >= '0' and c <= '9') {
      ?( n - '0'.toNat32().toNat() )
    } else if (c >= 'a' and c <= 'f') {
      ?( n - 'a'.toNat32().toNat() + 10 )
    } else if (c >= 'A' and c <= 'F') {
      ?( n - 'A'.toNat32().toNat() + 10 )
    } else {
      null
    }
  };

  func decodeHashToBytes(hash : Text) : ?[Nat8] {
    let chars = hash.toArray();
    if (chars.size() != 71) return null;
    let prefixChars = "sha256:".toArray();
    var i = 0;
    while (i < 7) {
      if (chars[i] != prefixChars[i]) return null;
      i += 1;
    };
    var hexIdx = 7;
    while (hexIdx < 71) {
      switch (hexNibble(chars[hexIdx])) {
        case null { return null };
        case (?_) {};
      };
      hexIdx += 1;
    };
    let bytes = Array.tabulate(32, func(k : Nat) : Nat8 {
      let hi = switch (hexNibble(chars[7 + k * 2]))     { case (?v) v; case null 0 };
      let lo = switch (hexNibble(chars[7 + k * 2 + 1])) { case (?v) v; case null 0 };
      Nat8.fromNat(hi * 16 + lo)
    });
    ?bytes
  };

  func bytesToHash(bytes : Blob) : ?Text {
    let arr = bytes.toArray();
    if (arr.size() != 32) return null;
    var hex = "sha256:";
    for (b in arr.vals()) {
      hex #= byteToHex(b);
    };
    ?hex
  };

  /// Optional on custom deployments; official Caffeine mixin queries the Cashier.
  /// No-op here so the frontend can call it without failing.
  public shared func _immutableObjectStorageUpdateGatewayPrincipals() : async () {};

  public shared query func _immutableObjectStorageBlobsAreLive(hashBytesList : [Blob]) : async [Bool] {
    hashBytesList.map<Blob, Bool>(func(hashBytes : Blob) : Bool {
      switch (bytesToHash(hashBytes)) {
        case null { false };
        case (?hash) {
          liveBlobs.containsKey(hash)
            and not pendingDelete.contains(hash);
        };
      }
    })
  };

  public shared query func _immutableObjectStorageBlobsToDelete() : async [Text] {
    pendingDelete.values().toArray()
  };

  public shared func _immutableObjectStorageConfirmBlobDeletion(hashBytesList : [Blob]) : async () {
    for (hashBytes in hashBytesList.vals()) {
      switch (bytesToHash(hashBytes)) {
        case null {};
        case (?hash) {
          if (pendingDelete.contains(hash)) {
            pendingDelete.remove(hash);
            liveBlobs.remove(hash);
          };
        };
      };
    };
  };

  public shared ({ caller }) func _immutableObjectStorageCreateCertificate(hash : Text) : async CreateCertificateResult {
    Auth.assertNotAnonymous(caller);
    Auth.assertCallerNotBanned(users, caller);

    if (hash.size() == 0) {
      Runtime.trap("hash must not be empty");
    };
    switch (decodeHashToBytes(hash)) {
      case null {
        Runtime.trap("hash must be 'sha256:<64-hex-chars>'");
      };
      case (?_) {};
    };

    pendingDelete.remove(hash);
    if (not liveBlobs.containsKey(hash)) {
      liveBlobs.add(hash, {
        hash      = hash;
        createdAt = Time.now();
      });
    };

    {
      method = "upload";
      blob_hash = hash;
    }
  };

}
