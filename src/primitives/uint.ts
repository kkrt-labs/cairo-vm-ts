// Using type brands to create a Uint64 type. No runtime overhead

export class UintError extends Error {}

// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
type Uint<T extends 16 | 32 | 64> = T extends 64
  ? bigint & { _uintBrand: void }
  : number & { _uintBrand: void };

// Wrapper types
export type Uint16 = Uint<16>;
export type Uint32 = Uint<32>;
export type Uint64 = Uint<64>;

export const Uint16ConversionError =
  'Uint16ConversionError: cannot convert to Uint16, as underlying number < 0 or > 2^16';

export const Uint32ConversionError =
  'Uint32ConversionError: cannot convert to Uint32, as underlying number < 0 or > 2^32';

export const NumberConversionError =
  'NumberConversionError: cannot convert to number, as underlying bigint < 0 or > Number.MAX_SAFE_INTEGER';

export const Uint64ConversionError =
  'Uint64ConversionError: cannot convert to Uint64, as underlying bigint < 0 or > 2^64';

export class UnsignedInteger {
  static readonly ZERO_UINT32: Uint32 = 0 as Uint32;

  static readonly ZERO_UINT64: Uint64 = 0n as Uint64;

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint16(num: number): num is Uint16 {
    if (num >= 0 && num < 0x10000 && Number.isInteger(num)) {
      return true;
    }
    return false;
  }

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint32(num: number): num is Uint32 {
    if (num >= 0 && num < 0x100000000 && Number.isInteger(num)) {
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

  static toUint16(num: number): Uint16 {
    if (this.isUint16(num)) {
      return num;
    }
    throw new UintError(Uint16ConversionError);
  }

  static toUint32(num: number): Uint32 {
    if (this.isUint32(num)) {
      return num;
    }
    throw new UintError(Uint32ConversionError);
  }

  static toUint64(num: bigint): Uint64 {
    if (this.isUint64(num)) {
      return num;
    }
    throw new UintError(Uint64ConversionError);
  }

  static downCastToUint16(num: Uint64): Uint16 {
    if (num > 0xffff) {
      throw new UintError(Uint16ConversionError);
    }
    return Number(num) as Uint16;
  }
}
