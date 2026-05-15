import Array         "mo:core/Array";
import Blob          "mo:core/Blob";
import CertifiedData "mo:core/CertifiedData";
import Char          "mo:core/Char";
import Debug         "mo:core/Debug";
import Map           "mo:core/Map";
import Nat8          "mo:core/Nat8";
import Nat32         "mo:core/Nat32";
import Runtime       "mo:core/Runtime";
import Set           "mo:core/Set";
import Text          "mo:core/Text";
import Time          "mo:core/Time";

/// ObjectStorage mixin — implements the Caffeine Immutable Object Storage protocol.
///
/// HOW THE CERTIFICATE WORKS:
/// 1. The StorageClient (frontend) calls _immutableObjectStorageCreateCertificate(hash)
///    as an IC update call via agent.call().
/// 2. This method hex-decodes the "sha256:<64 hex chars>" hash into 32 binary bytes,
///    then calls CertifiedData.set() with those exact 32 bytes.
/// 3. The IC runtime attaches a v3 certificate (containing the certified data) to the
///    update call response. StorageClient reads response.body.certificate from the v3 body.
/// 4. That certificate is forwarded as OwnerEgressSignature in the blob-tree PUT to gateway.
/// 5. The gateway verifies the certificate: it decodes the blob tree root hash and checks
///    that the certified_data in the certificate matches those 32 bytes exactly.
///    Match → 200 OK. Mismatch → 403 Forbidden: Invalid payload.
///
/// CRITICAL: CertifiedData.set() MUST receive exactly 32 binary bytes obtained by
/// hex-decoding the 64 hex chars AFTER stripping the "sha256:" prefix.
/// Passing the raw "sha256:..." string as UTF-8 bytes gives ~71 bytes, which the IC
/// truncates to 32 garbage bytes → certified_data never matches → 403 every time.
mixin (
  liveBlobs     : Map.Map<Text, { hash : Text; createdAt : Int }>,
  pendingDelete : Set.Set<Text>,
) {

  // ── Internal helpers ────────────────────────────────────────────────────────

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

  /// Decodes a single hex character ('0'-'9', 'a'-'f', 'A'-'F') to its Nat value.
  /// Returns null for invalid characters.
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

  /// Decodes "sha256:<64 hex chars>" into exactly 32 Nat8 bytes.
  /// Returns null if the format is invalid.
  func decodeHashToBytes(hash : Text) : ?[Nat8] {
    let chars = hash.toArray();
    // "sha256:" is 7 chars + 64 hex chars = 71 total
    if (chars.size() != 71) return null;
    // verify "sha256:" prefix
    let prefixChars = "sha256:".toArray();
    var i = 0;
    while (i < 7) {
      if (chars[i] != prefixChars[i]) return null;
      i += 1;
    };
    // Validate all 64 hex chars before building result
    var hexIdx = 7;
    while (hexIdx < 71) {
      switch (hexNibble(chars[hexIdx])) {
        case null { return null };
        case (?_) {};
      };
      hexIdx += 1;
    };
    // Decode 64 hex chars → 32 bytes using tabulate
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

  // ── Protocol methods ────────────────────────────────────────────────────────

  /// Called by the gateway scrubber to check which blobs are still live.
  /// hashBytesList: each element is a 32-byte raw SHA-256 hash blob.
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

  /// Called by the gateway scrubber — returns hashes marked for deletion.
  public shared query func _immutableObjectStorageBlobsToDelete() : async [Text] {
    pendingDelete.values().toArray()
  };

  /// Called by the gateway scrubber after deleting blobs.
  public shared func _immutableObjectStorageConfirmBlobDeletion(hashBytesList : [Blob]) : async () {
    for (hashBytes in hashBytesList.vals()) {
      switch (bytesToHash(hashBytes)) {
        case null {};
        case (?hash) {
          pendingDelete.remove(hash);
          liveBlobs.remove(hash);
        };
      };
    };
  };

  /// Creates an upload authorization certificate for the Caffeine object-storage gateway.
  ///
  /// Protocol:
  ///   1. Hex-decode hash "sha256:<64 hex chars>" → 32 binary bytes
  ///   2. Call CertifiedData.set(32 bytes) — IC attaches these to the update response as v3 cert
  ///   3. StorageClient reads response.body.certificate and sends it as OwnerEgressSignature
  ///   4. Gateway verifies: certified_data == blob tree root hash bytes → 200 OK
  ///
  /// This MUST be a public shared func (update call) — CertifiedData.set() cannot be called
  /// in a query. The return type is () because the StorageClient only reads the IC certificate
  /// from the v3 response body, not the Motoko return value.
  public shared func _immutableObjectStorageCreateCertificate(hash : Text) : async () {
    if (hash.size() == 0) {
      Runtime.trap("hash must not be empty");
    };

    // DIAGNOSTIC LOG 1: Log the exact hash text received
    Debug.print("[CERT_DIAG] hash received: " # hash);
    Debug.print("[CERT_DIAG] hash size: " # debug_show(hash.size()));

    let hashBytes = switch (decodeHashToBytes(hash)) {
      case null {
        Runtime.trap("hash must be 'sha256:<64-hex-chars>'");
      };
      case (?bytes) { bytes };
    };

    // DIAGNOSTIC LOG 2: Log all 32 Nat8 bytes as comma-separated values
    var bytesText = "";
    var i = 0;
    while (i < 32) {
      if (i > 0) { bytesText #= "," };
      bytesText #= debug_show(hashBytes[i]);
      i += 1;
    };
    Debug.print("[CERT_DIAG] hashBytes (32 Nat8 values): [" # bytesText # "]");

    // DIAGNOSTIC LOG 3: Log the first 8 and last 8 bytes as hex
    var first8 = "0x";
    var k = 0;
    while (k < 8) {
      first8 #= byteToHex(hashBytes[k]);
      k += 1;
    };
    var last8 = "0x";
    var m = 24;
    while (m < 32) {
      last8 #= byteToHex(hashBytes[m]);
      m += 1;
    };
    Debug.print("[CERT_DIAG] hashBytes first 8 bytes hex: " # first8);
    Debug.print("[CERT_DIAG] hashBytes last 8 bytes hex: " # last8);

    // DIAGNOSTIC LOG 4: Log the blob size — must be exactly 32
    let certBlob = Blob.fromArray(hashBytes);
    Debug.print("[CERT_DIAG] Blob.fromArray(hashBytes).size() = " # debug_show(certBlob.size()) # " (MUST be 32)");

    // Set the certified data to exactly 32 binary bytes of the SHA-256 hash.
    // The IC runtime embeds these bytes in the v3 certificate attached to this update response.
    // The gateway checks: SHA-256 of blob tree root == these certified bytes.
    Debug.print("[CERT_DIAG] Calling CertifiedData.set() with " # debug_show(certBlob.size()) # " bytes");
    CertifiedData.set(certBlob);
    Debug.print("[CERT_DIAG] CertifiedData.set() called successfully");

    // Mark hash as live so the scrubber keeps it.
    pendingDelete.remove(hash);
    if (not liveBlobs.containsKey(hash)) {
      liveBlobs.add(hash, {
        hash      = hash;
        createdAt = Time.now();
      });
    };
  };

  /// DEBUG ONLY: Returns the IC-level certificate for the current certified data.
  /// Use this to verify externally what certified_data the IC has stored for this canister.
  /// CertifiedData.getCertificate() returns ?Blob — Some(cert) after an update call sets data,
  /// null if called in a context where no certificate is available (e.g., the first ever query).
  public query func debugGetCertifiedData() : async ?Blob {
    CertifiedData.getCertificate()
  };

}
