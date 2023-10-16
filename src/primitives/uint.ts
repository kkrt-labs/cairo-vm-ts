// Using type brands to create a Uint64 type. No runtime overhead

import { Err, Ok, Result, VMError } from 'result-pattern/result';

// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
type Uint<T extends 16 | 32 | 64> = T extends 64
  ? bigint & { _uintBrand: void }
  : number & { _uintBrand: void };

// Wrapper types
export type Uint16 = Uint<16>;
export type Uint32 = Uint<32>;
export type Uint64 = Uint<64>;

export const Uint16ConversionError = {
  message:
    'Uint16ConversionError: cannot convert to Uint16, as underlying number < 0 or > 2^16',
};

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
  static readonly ZERO_UINT32: Uint32 = 0 as Uint32;

  static readonly ZERO_UINT64: Uint64 = 0n as Uint64;

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint16(num: number): num is Uint16 {
    if (num >= 0 && num < 0x10000) {
      return true;
    }
    return false;
  }

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

  static toUint16(num: number): Result<Uint16, VMError> {
    if (this.isUint16(num)) {
      return new Ok(num);
    }
    return new Err(Uint16ConversionError);
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

  static downCastToUint16(num: Uint64): Result<Uint16, VMError> {
    if (num > 0xffff) {
      return new Err(Uint16ConversionError);
    }
    return new Ok(Number(num) as Uint16);
  }

  static downCastToUint32(num: Uint64): Result<Uint32, VMError> {
    if (num > 0xffffffffn) {
      return new Err(Uint32ConversionError);
    }
    return new Ok(Number(num) as Uint32);
  }

  static uint16And(lhs: Uint16, rhs: Uint16): Uint16 {
    const result = lhs & rhs;
    if (this.isUint16(result)) {
      return result;
    }
    throw Uint64ConversionError;
  }

  static uint16Rhs(lsh: Uint16, rhs: Uint16): Uint16 {
    const result = lsh >> rhs;
    if (this.isUint16(result)) {
      return result;
    }
    throw Uint64ConversionError;
  }

  static uint64And(lhs: Uint64, rhs: Uint64): Uint64 {
    const result = lhs & rhs;
    if (this.isUint64(result)) {
      return result;
    }
    throw Uint64ConversionError;
  }

  static uint64Rhs(lsh: Uint64, rhs: Uint64): Uint64 {
    const result = lsh >> rhs;
    if (this.isUint64(result)) {
      return result;
    }
    throw Uint64ConversionError;
  }
}
