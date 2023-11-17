import { UnsignedInteger } from './uint';
import {
  ByteArrayLengthError,
  OutOfRangeNumber,
  PrimitiveError,
} from 'errors/primitives';

export class SignedInteger16 {
  private static readonly BIAS: number = 2 ** 15;
  static readonly MIN_VALUE: number = -(2 ** 15);
  static readonly MAX_VALUE: number = 2 ** 15 - 1;
  static readonly ZERO = 0;

  // Returns whether the number is a safe 16-bit signed integer
  static isInt16(num: number): boolean {
    return (
      Number.isInteger(num) &&
      num >= SignedInteger16.MIN_VALUE &&
      num <= SignedInteger16.MAX_VALUE
    );
  }

  static ensureInt16(num: number) {
    if (!this.isInt16(num)) {
      throw new PrimitiveError(OutOfRangeNumber);
    }
  }

  // Convert a biased byte array representation (2 bytes) in little-endian format to an Int16
  static fromBiasedLittleEndianBytes(bytes: Uint8Array): number {
    if (bytes.length !== 2) {
      throw new PrimitiveError(ByteArrayLengthError);
    }

    // Convert little-endian bytes to a 16-bit number
    let num = bytes[0] + (bytes[1] << 8);

    // Subtract the bias
    num -= SignedInteger16.BIAS;
    this.ensureInt16(num);
    return num;
  }

  // Convert a bigint represented in its biased form to a regular Int16
  static fromBiased(num: bigint): number {
    UnsignedInteger.ensureUint64(num);

    const value = UnsignedInteger.downCastToUint16(num);

    const result = value - SignedInteger16.BIAS;
    this.ensureInt16(result);
    return result;
  }
}
