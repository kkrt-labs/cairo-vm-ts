// Using type brands to create a Uint64 type. No runtime overhead
// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
export type Uint64 = bigint & { _uintBrand: void };

export class UnsignedInteger {
  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^64
  static isUint64(num: bigint): num is Uint64 {
    if (num >= 0 && num < 0x10000000000000000n) {
      return true;
    }
    return false;
  }

  static toUint64(num: bigint): Uint64 {
    if (this.isUint64(num)) {
      return num;
    }
    throw new TypeError();
  }
}
