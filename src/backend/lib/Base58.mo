import Array "mo:core/Array";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Nat8 "mo:core/Nat8";
import Nat "mo:core/Nat";
import List "mo:core/List";

/// Base58 encode/decode using the Bitcoin alphabet.
/// Bitcoin alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
module {
  let _ALPHABET : Text = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  // Alphabet as a literal array (static — function calls are not allowed at module level)
  let ALPHABET_ARRAY : [Char] = [
    '1','2','3','4','5','6','7','8','9',
    'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z',
    'a','b','c','d','e','f','g','h','i','j','k','m','n','o','p','q','r','s','t','u','v','w','x','y','z'
  ];

  /// Encode a byte array to a base58 string.
  /// Leading 0x00 bytes are encoded as '1' characters (one per zero byte).
  public func encode(bytes : [Nat8]) : Text {
    let len = bytes.size();

    // Count leading zero bytes
    var leadingZeros = 0;
    var i = 0;
    while (i < len and bytes[i] == 0) {
      leadingZeros += 1;
      i += 1;
    };

    // Convert byte array to a big integer (big-endian base-256)
    var num : Nat = 0;
    for (b in bytes.vals()) {
      num := num * 256 + b.toNat();
    };

    // Convert big integer to base-58 digits (collected in reverse order)
    let digits = List.empty<Nat>();
    if (num == 0) {
      // All zeros case — digits list stays empty, handled by leadingZeros
      ()
    } else {
      var n = num;
      while (n > 0) {
        let rem = n % 58;
        n := n / 58;
        digits.add(rem);
      };
    };

    // digits is in reverse order (least-significant first), reverse it
    let digitsArr = digits.toArray();
    let reversed = digitsArr.reverse();

    // Build result: leadingZeros '1' chars + base58 digits
    var result = "";
    var z = 0;
    while (z < leadingZeros) {
      result := result # "1";
      z += 1;
    };

    for (d in reversed.vals()) {
      result := result # Text.fromChar(ALPHABET_ARRAY[d]);
    };

    result
  };

  /// Decode a base58 string to a byte array.
  /// Leading '1' characters are decoded as 0x00 bytes (one per '1').
  /// Returns empty array on invalid characters.
  public func decode(input : Text) : [Nat8] {
    let chars = input.toArray();
    let len = chars.size();

    // Count leading '1' characters
    var leadingZeros = 0;
    var i = 0;
    while (i < len and chars[i] == '1') {
      leadingZeros += 1;
      i += 1;
    };

    // Convert base58 string to big integer
    var num : Nat = 0;
    var idx = i;
    while (idx < len) {
      let c = chars[idx];
      // Find character position in alphabet
      let pos = findInAlphabet(c);
      switch (pos) {
        case null { return [] }; // invalid character
        case (?p) {
          num := num * 58 + p;
        };
      };
      idx += 1;
    };

    // Convert big integer to bytes
    let byteList = List.empty<Nat8>();
    if (num > 0) {
      var n = num;
      while (n > 0) {
        let rem = n % 256;
        n := n / 256;
        byteList.add(Nat8.fromNat(rem));
      };
    };

    let byteArr = byteList.toArray();
    let reversedBytes = byteArr.reverse();

    // Prepend leading zero bytes
    Array.tabulate<Nat8>(
      leadingZeros + reversedBytes.size(),
      func(j) {
        if (j < leadingZeros) 0
        else reversedBytes[j - leadingZeros]
      }
    )
  };

  /// Find the index of a character in the base58 alphabet. Returns null if not found.
  func findInAlphabet(c : Char) : ?Nat {
    var idx = 0;
    for (ac in ALPHABET_ARRAY.vals()) {
      if (ac == c) return ?idx;
      idx += 1;
    };
    null
  };
}
