// Using type brands to create a Uint64 type. No runtime overhead
// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
type Uint<T extends 32 | 64> = T extends 64
  ? bigint & { _uintBrand: void }
  : number & { _uintBrand: void };

// Wrapper types
export type Uint32 = Uint<32>;
export type Uint64 = Uint<64>;

export class UnsignedInteger {
  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint32(num: number): num is Uint32 {
    if (num >= 0 && num < 0x100000000) {
      return true;
    }
    return false;
  }

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^64
  static isUint64(num: bigint): num is Uint64 {
    if (num >= 0 && num < 0x10000000000000000n) {
      return true;
    }
    return false;
  }

  static toUint32(num: number): Uint32 {
    if (this.isUint32(num)) {
      return num;
    }
    throw new TypeError();
  }

  static toUint64(num: bigint): Uint64 {
    if (this.isUint64(num)) {
      return num;
    }
    throw new TypeError();
  }

  static upCast(num: Uint32): Uint64 {
    return BigInt(num) as Uint64;
  }

  static downCast(num: Uint64): Uint32 {
    if (num > 0x100000000n) {
      throw new TypeError();
    }
    return Number(num) as Uint32;
  }
}
