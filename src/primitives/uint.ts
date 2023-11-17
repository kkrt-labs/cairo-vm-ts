// Using type brands to create a Uint64 type. No runtime overhead

import {
  PrimitiveError,
  Uint16ConversionError,
  Uint32ConversionError,
  Uint64ConversionError,
} from 'errors/primitives';

export class UnsignedInteger {
  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint16(num: number): boolean {
    if (num >= 0 && num < 0x10000 && Number.isInteger(num)) {
      return true;
    }
    return false;
  }

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^32
  static isUint32(num: number): boolean {
    if (num >= 0 && num < 0x100000000 && Number.isInteger(num)) {
      return true;
    }
    return false;
  }

  // Returns whether the number is a safe unsigned integer,
  // i.e. a positive number between 0 and 2^64
  static isUint64(num: bigint): boolean {
    if (num >= 0 && num < 0x10000000000000000n) {
      return true;
    }
    return false;
  }

  static ensureUint16(num: number): void {
    if (!this.isUint16(num)) {
      throw new PrimitiveError(Uint16ConversionError);
    }
  }

  static ensureUint32(num: number): void {
    if (!this.isUint32(num)) {
      throw new PrimitiveError(Uint32ConversionError);
    }
  }

  static ensureUint64(num: bigint) {
    if (!this.isUint64(num)) {
      throw new PrimitiveError(Uint64ConversionError);
    }
  }

  static downCastToUint16(num: bigint): number {
    if (num > 0xffffn || num < 0n) {
      throw new PrimitiveError(Uint16ConversionError);
    }
    return Number(num);
  }
}
