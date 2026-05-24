import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Sha256 "Sha256";

/// DigitalEncryption — deterministic obfuscation for non-public delivery metadata.
/// Key derivation: SHA-256(canisterId || salt) → 32-byte key.
/// Encryption: XOR each plaintext byte with a repeating key byte.
/// Encoding: hex-encode the ciphertext for safe Text storage.
///
/// Security note: this is not a cryptographic secrecy boundary. The security
/// boundary is the canister authorization gate plus client-side AES-GCM file
/// encryption. Do not use this module for user passwords or long-term secrets.
module {

  let HEX_CHARS : [Char] = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

  // ─── Key derivation ───────────────────────────────────────────────────────

  /// Derives a 32-byte encryption key from a canister principal and a salt string.
  /// Key = SHA-256(canisterIdText || salt)
  public func deriveKey(canisterId : Principal, salt : Text) : [Nat8] {
    let input : Text = canisterId.toText() # salt;
    let hash : Blob  = Sha256.sha256(input.encodeUtf8());
    hash.toArray()
  };

  // ─── Hex helpers ──────────────────────────────────────────────────────────

  func nat8ToHexChars(b : Nat8) : (Char, Char) {
    let hi = b.toNat() / 16;
    let lo = b.toNat() % 16;
    (HEX_CHARS[hi], HEX_CHARS[lo])
  };

  func hexCharToNat(c : Char) : ?Nat {
    switch (c) {
      case '0' ?0; case '1' ?1; case '2' ?2; case '3' ?3;
      case '4' ?4; case '5' ?5; case '6' ?6; case '7' ?7;
      case '8' ?8; case '9' ?9;
      case 'a' ?10; case 'b' ?11; case 'c' ?12; case 'd' ?13;
      case 'e' ?14; case 'f' ?15;
      case 'A' ?10; case 'B' ?11; case 'C' ?12; case 'D' ?13;
      case 'E' ?14; case 'F' ?15;
      case _ null;
    }
  };

  /// Encodes a byte array to a lowercase hex string.
  public func toHex(bytes : [Nat8]) : Text {
    var result = "";
    for (b in bytes.vals()) {
      let (hi, lo) = nat8ToHexChars(b);
      result := result # Text.fromChar(hi) # Text.fromChar(lo);
    };
    result
  };

  /// Decodes a hex string to a byte array. Returns null if the input is invalid.
  public func fromHex(hex : Text) : ?[Nat8] {
    let chars = hex.toArray();
    let len = chars.size();
    if (len % 2 != 0) return null;
    let half = len / 2;
    var valid = true;
    let result = Array.tabulate<Nat8>(half, func(i) {
      let hiOpt = hexCharToNat(chars[i * 2]);
      let loOpt = hexCharToNat(chars[i * 2 + 1]);
      switch (hiOpt, loOpt) {
        case (?hi, ?lo) { Nat8.fromNat(hi * 16 + lo) };
        case _ { valid := false; 0 };
      };
    });
    if (valid) ?result else null
  };

  // ─── XOR stream cipher ────────────────────────────────────────────────────

  /// XOR-encrypts/decrypts `data` bytes using a repeating `key`.
  /// XOR is symmetric: encrypt(encrypt(data)) == data.
  func xorBytes(data : [Nat8], key : [Nat8]) : [Nat8] {
    let keyLen = key.size();
    if (keyLen == 0) return data;
    Array.tabulate<Nat8>(data.size(), func(i : Nat) : Nat8 { data[i] ^ key[i % keyLen] })
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  /// Encrypts a plain-text string and returns hex-encoded ciphertext.
  /// Uses XOR with the provided 32-byte key.
  public func encryptText(key : [Nat8], plaintext : Text) : Text {
    let plaintextBytes = plaintext.encodeUtf8().toArray();
    let cipherBytes    = xorBytes(plaintextBytes, key);
    toHex(cipherBytes)
  };

  /// Decrypts a hex-encoded ciphertext string back to plaintext.
  /// Returns null if the hex encoding is invalid.
  public func decryptText(key : [Nat8], ciphertext : Text) : ?Text {
    switch (fromHex(ciphertext)) {
      case null null;
      case (?cipherBytes) {
        let plaintextBytes = xorBytes(cipherBytes, key);
        Blob.fromArray(plaintextBytes).decodeUtf8();
      };
    }
  };
}
