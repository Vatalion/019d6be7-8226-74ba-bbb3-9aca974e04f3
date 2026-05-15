import Array "mo:core/Array";
import Nat8 "mo:core/Nat8";
import Nat32 "mo:core/Nat32";
import Blob "mo:core/Blob";

/// Minimal pure SHA-256 implementation per FIPS 180-4.
/// Uses Nat32 throughout with +% (wrapping addition) for the compression rounds.
/// Bitwise ops (^, &, |, >>, <<, ^prefix) are all native on Nat32.
module {

  // Initial hash values H0-H7 (first 32 bits of fractional parts of sqrt of first 8 primes)
  let H0 : Nat32 = 0x6a09e667;
  let H1 : Nat32 = 0xbb67ae85;
  let H2 : Nat32 = 0x3c6ef372;
  let H3 : Nat32 = 0xa54ff53a;
  let H4 : Nat32 = 0x510e527f;
  let H5 : Nat32 = 0x9b05688c;
  let H6 : Nat32 = 0x1f83d9ab;
  let H7 : Nat32 = 0x5be0cd19;

  // 64 round constants K (first 32 bits of fractional parts of cube roots of first 64 primes)
  let K : [Nat32] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Right-rotate a Nat32 by n bits
  func rotr(x : Nat32, n : Nat32) : Nat32 {
    (x >> n) | (x << (32 - n))
  };

  // SHA-256 lowercase sigma functions (message schedule expansion)
  func ssig0(x : Nat32) : Nat32 {
    rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)
  };

  func ssig1(x : Nat32) : Nat32 {
    rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)
  };

  // SHA-256 uppercase Sigma functions (compression)
  func bsig0(x : Nat32) : Nat32 {
    rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)
  };

  func bsig1(x : Nat32) : Nat32 {
    rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)
  };

  // Ch: choose (e selects between f and g)
  func ch(e : Nat32, f : Nat32, g : Nat32) : Nat32 {
    (e & f) ^ ((^ e) & g)
  };

  // Maj: majority of (a, b, c)
  func maj(a : Nat32, b : Nat32, c : Nat32) : Nat32 {
    (a & b) ^ (a & c) ^ (b & c)
  };

  func nat8toNat32(b : Nat8) : Nat32 {
    Nat32.fromNat(b.toNat())
  };

  // Extract byte k (0=most significant) of a 64-bit value stored as two Nat32 (hi, lo)
  func bitLenByte(hi : Nat32, lo : Nat32, k : Nat) : Nat8 {
    // k 0..3 → hi word, k 4..7 → lo word
    let word = if (k < 4) hi else lo;
    let shift = Nat32.fromNat((3 - (k % 4)) * 8);
    Nat8.fromNat(((word >> shift) & (0xFF : Nat32)).toNat())
  };

  /// Compute SHA-256 hash of the input blob. Returns a 32-byte blob.
  public func sha256(data : Blob) : Blob {
    let bytes = data.toArray();
    let msgLen = bytes.size();

    // Bit length as two 32-bit halves (big-endian 64-bit value)
    // bitLen = msgLen * 8; fits in 64 bits for any realistic message
    let bitLen : Nat = msgLen * 8;
    let bitLenHi : Nat32 = Nat32.fromNat(bitLen / 0x100000000);
    let bitLenLo : Nat32 = Nat32.fromNat(bitLen % 0x100000000);

    // Compute padded length: smallest multiple of 64 >= msgLen + 1 + 8
    let padded_len : Nat = do {
      var l = msgLen + 1 + 8;
      if (l % 64 != 0) {
        l := l + (64 - (l % 64));
      };
      l
    };

    // Build padded message
    let padded = Array.tabulate<Nat8>(
      padded_len,
      func(j) {
        if (j < msgLen) {
          bytes[j]
        } else if (j == msgLen) {
          0x80  // padding start bit
        } else if (j >= padded_len - 8) {
          // Last 8 bytes: big-endian 64-bit bit-length
          bitLenByte(bitLenHi, bitLenLo, j - (padded_len - 8))
        } else {
          0x00
        }
      }
    );

    // Initialize running hash values
    var h0 = H0;
    var h1 = H1;
    var h2 = H2;
    var h3 = H3;
    var h4 = H4;
    var h5 = H5;
    var h6 = H6;
    var h7 = H7;

    let numBlocks = padded_len / 64;
    var blockIdx = 0;

    while (blockIdx < numBlocks) {
      let base = blockIdx * 64;

      // Build first 16 words of message schedule from block bytes
      let W16 = Array.tabulate(
        16,
        func(t : Nat) : Nat32 {
          (nat8toNat32(padded[base + t * 4])     << (24 : Nat32)) |
          (nat8toNat32(padded[base + t * 4 + 1]) << (16 : Nat32)) |
          (nat8toNat32(padded[base + t * 4 + 2]) << (8  : Nat32)) |
           nat8toNat32(padded[base + t * 4 + 3])
        }
      );

      // Extend to 64 words
      let Wmut : [var Nat32] = Array.tabulate<Nat32>(64, func(t) {
        if (t < 16) W16[t] else 0
      }).toVarArray();
      var t : Nat = 16;
      while (t < 64) {
        Wmut[t] := ssig1(Wmut[t - 2]) +% Wmut[t - 7] +% ssig0(Wmut[t - 15]) +% Wmut[t - 16];
        t += 1;
      };

      // Working variables
      var a = h0;
      var b = h1;
      var c = h2;
      var d = h3;
      var e = h4;
      var f = h5;
      var g = h6;
      var h = h7;

      // 64 compression rounds
      var round : Nat = 0;
      while (round < 64) {
        let T1 = h +% bsig1(e) +% ch(e, f, g) +% K[round] +% Wmut[round];
        let T2 = bsig0(a) +% maj(a, b, c);
        h := g;
        g := f;
        f := e;
        e := d +% T1;
        d := c;
        c := b;
        b := a;
        a := T1 +% T2;
        round += 1;
      };

      // Update hash values (wrapping add)
      h0 := h0 +% a;
      h1 := h1 +% b;
      h2 := h2 +% c;
      h3 := h3 +% d;
      h4 := h4 +% e;
      h5 := h5 +% f;
      h6 := h6 +% g;
      h7 := h7 +% h;

      blockIdx += 1;
    };

    // Serialize final hash to 32 bytes (big-endian)
    let words : [Nat32] = [h0, h1, h2, h3, h4, h5, h6, h7];
    let digest = Array.tabulate(
      32,
      func(j : Nat) : Nat8 {
        let word = words[j / 4];
        let shift = Nat32.fromNat((3 - (j % 4)) * 8);
        Nat8.fromNat(((word >> shift) & (0xFF : Nat32)).toNat())
      }
    );

    Blob.fromArray(digest)
  };
}
