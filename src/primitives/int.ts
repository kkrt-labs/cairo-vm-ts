import { Err, Ok, Result, VMError } from 'result-pattern/result';

export type Int16 = number & { _intBrand: void };

const ConversionError: VMError = {
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
      return new Err(ConversionError);
    }

    // Convert little-endian bytes to a 16-bit number
    let num = bytes[0] + (bytes[1] << 8);

    // Subtract the bias
    num -= SignedInteger16.BIAS;

    return new Ok(this.toInt16(num));
  }
}
