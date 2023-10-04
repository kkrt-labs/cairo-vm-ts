// Using type brands to create a Uint64 type. No runtime overhead

import { Err, Ok, Result, VMError } from 'result-pattern/result';

// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
type Uint<T extends 32 | 64> = T extends 64
  ? bigint & { _uintBrand: void }
  : number & { _uintBrand: void };

// Wrapper types
export type Uint32 = Uint<32>;
export type Uint64 = Uint<64>;

export const Uint32ConversionError = {
  message:
    'Uint32ConversionError: cannot convert to Uint32, as underlying number < 0 or > 2^32',
};

export const NumberConversionError = {
  message:
    'NumberConversionError: cannot convert to number, as underlying bigint < 0 or > Number.MAX_SAFE_INTEGER',
};

export const Uint64ConversionError = {
  message:
    'Uint64ConversionError: cannot convert to Uint64, as underlying bigint < 0 or > 2^64',
};

export class UnsignedInteger {
  static readonly ZERO: Uint32 = 0 as Uint32;

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

  static toUint32(num: number): Result<Uint32, VMError> {
    if (this.isUint32(num)) {
      return new Ok(num);
    }
    return new Err(Uint32ConversionError);
  }

  static toUint64(num: bigint): Result<Uint64, VMError> {
    if (this.isUint64(num)) {
      return new Ok(num);
    }
    return new Err(Uint64ConversionError);
  }

  static upCast(num: Uint32): Uint64 {
    return BigInt(num) as Uint64;
  }

  static downCast(num: Uint64): Result<Uint32, VMError> {
    if (num > 0x100000000n) {
      return new Err(Uint32ConversionError);
    }
    return new Ok(Number(num) as Uint32);
  }
}
