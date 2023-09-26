// Using type brands to create a Uint type. No runtime overhead
// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
export type Uint = bigint & { _uintBrand: void };

export class UnsignedInteger {
  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and Number.MAX_SAFE_INTEGER
  static isUint(num: bigint): num is Uint {
    if (num >= 0) {
      return true;
    }
    return false;
  }

  static toUint(num: bigint): Uint {
    if (this.isUint(num)) {
      return num;
    }
    throw new TypeError();
  }
}
