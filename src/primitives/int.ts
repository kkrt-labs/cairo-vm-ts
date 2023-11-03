import { BaseError, ErrorType } from 'result/error';
import { UnsignedInteger } from './uint';
import { ByteArrayLengthError, OutOfRangeNumber } from 'result/primitives';
import { Result } from 'result/result';

export type Int16 = number & { _intBrand: void };

export class SignedInteger16 {
  private static readonly BIAS: number = 2 ** 15;
  static readonly MIN_VALUE: number = -(2 ** 15);
  static readonly MAX_VALUE: number = 2 ** 15 - 1;
  static readonly ZERO = 0 as Int16;

  // Returns whether the number is a safe 16-bit signed integer
  static isInt16(num: number): num is Int16 {
    return (
      Number.isInteger(num) &&
      num >= SignedInteger16.MIN_VALUE &&
      num <= SignedInteger16.MAX_VALUE
    );
  }

  static toInt16(num: number): Result<Int16> {
    if (SignedInteger16.isInt16(num)) {
      return { value: num, error: undefined };
    }
    return {
      value: undefined,
      error: new BaseError(ErrorType.Int16Error, OutOfRangeNumber),
    };
  }

  // Convert a biased byte array representation (2 bytes) in little-endian format to an Int16
  static fromBiasedLittleEndianBytes(bytes: Uint8Array): Result<Int16> {
    if (bytes.length !== 2) {
      return {
        value: undefined,
        error: new BaseError(ErrorType.Int16Error, ByteArrayLengthError),
      };
    }

    // Convert little-endian bytes to a 16-bit number
    let num = bytes[0] + (bytes[1] << 8);

    // Subtract the bias
    num -= SignedInteger16.BIAS;

    return this.toInt16(num);
  }

  // Convert a bigint represented in its biased form to a regular Int16
  static fromBiased(num: bigint): Result<Int16> {
    const { value: numUint, error: numError } = UnsignedInteger.toUint64(num);
    if (numError !== undefined) {
      return { value: undefined, error: numError };
    }

    const { value: numInt16, error: downcastError } =
      UnsignedInteger.downCastToUint16(numUint);
    if (downcastError !== undefined) {
      return { value: undefined, error: downcastError };
    }

    return this.toInt16(numInt16 - SignedInteger16.BIAS);
  }
}
