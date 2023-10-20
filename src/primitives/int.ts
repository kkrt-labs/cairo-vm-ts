import { Err, Ok, Result, VMError } from 'result-pattern/result';
import { Uint16, Uint64, UnsignedInteger } from './uint';

export type Int16 = number & { _intBrand: void };

export const Int16ConversionError: VMError = {
  message: 'Int16Error: Expected a byte array of length 2.',
};

export class SignedInteger16 {
  private static readonly BIAS: number = 2 ** 15;
  static readonly MIN_VALUE: number = -(2 ** 15);
  static readonly MAX_VALUE: number = 2 ** 15 - 1;

  // Returns whether the number is a safe 16-bit signed integer
  static isInt16(num: number): num is Int16 {
    return (
      Number.isInteger(num) &&
      num >= SignedInteger16.MIN_VALUE &&
      num <= SignedInteger16.MAX_VALUE
    );
  }

  static toInt16(num: number): Int16 {
    if (SignedInteger16.isInt16(num)) {
      return num;
    }
    throw new TypeError('Number is not within the 16-bit integer range.');
  }

  // Convert a biased byte array representation (2 bytes) in little-endian format to an Int16
  static fromBiasedLittleEndianBytes(
    bytes: Uint8Array
  ): Result<Int16, VMError> {
    if (bytes.length !== 2) {
      return new Err(Int16ConversionError);
    }

    // Convert little-endian bytes to a 16-bit number
    let num = bytes[0] + (bytes[1] << 8);

    // Subtract the bias
    num -= SignedInteger16.BIAS;

    return new Ok(this.toInt16(num));
  }

  // Convert a bigint represented in its biased form to a regular Int16
  static fromBiased(num: bigint): Result<Int16, VMError> {
    const numUint64Result = UnsignedInteger.toUint64(num);
    if (numUint64Result.isErr()) {
      return numUint64Result;
    }
    const numUint16Result = UnsignedInteger.downCastToUint16(
      numUint64Result.unwrap()
    );
    if (numUint16Result.isErr()) {
      return new Err(Int16ConversionError);
    }
    return new Ok(
      this.toInt16(numUint16Result.unwrap() - SignedInteger16.BIAS)
    );
  }
}
