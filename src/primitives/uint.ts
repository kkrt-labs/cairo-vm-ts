// Using type brands to create a Uint64 type. No runtime overhead

import { BaseError, ErrorType } from 'result/error';
import {
  Uint16ConversionError,
  Uint32ConversionError,
  Uint64ConversionError,
} from 'result/primitives';
import { Result } from 'result/result';

// <https://michalzalecki.com/nominal-typing-in-typescript/#approach-2-brands>
type Uint<T extends 16 | 32 | 64> = T extends 64
  ? bigint & { _uintBrand: void }
  : number & { _uintBrand: void };

// Wrapper types
export type Uint16 = Uint<16>;
export type Uint32 = Uint<32>;
export type Uint64 = Uint<64>;

export class UnsignedInteger {
  static readonly ZERO_UINT32: Uint32 = 0 as Uint32;
  static readonly ONE_UINT32: Uint32 = 1 as Uint32;
  static readonly TWO_UINT32: Uint32 = 2 as Uint32;
  static readonly MAX_UINT32: Uint32 = 0xffffffff as Uint32;

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

  static toUint16(num: number): Result<Uint16> {
    if (this.isUint16(num)) {
      return { value: num, error: undefined };
    }
    return {
      value: undefined,
      error: new BaseError(ErrorType.UintError, Uint16ConversionError),
    };
  }

  static toUint32(num: number): Result<Uint32> {
    if (this.isUint32(num)) {
      return { value: num, error: undefined };
    }
    return {
      value: undefined,
      error: new BaseError(ErrorType.UintError, Uint32ConversionError),
    };
  }

  static toUint64(num: bigint): Result<Uint64> {
    if (this.isUint64(num)) {
      return { value: num, error: undefined };
    }
    return {
      value: undefined,
      error: new BaseError(ErrorType.UintError, Uint64ConversionError),
    };
  }

  static downCastToUint16(num: Uint64): Result<Uint16> {
    if (num > 0xffff) {
      return {
        value: undefined,
        error: new BaseError(ErrorType.UintError, Uint16ConversionError),
      };
    }
    return { value: Number(num) as Uint16, error: undefined };
  }
}
