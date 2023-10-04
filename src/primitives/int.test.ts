import { test, expect, describe } from 'bun:test';
import { SignedInteger16, Int16ConversionError } from './int'; // adjust the import path accordingly
import { unwrapErr, unwrapOk } from 'test-utils/utils';

describe('SignedInteger16', () => {
  describe('isInt16', () => {
    test('should return true for valid Int16', () => {
      expect(SignedInteger16.isInt16(5000)).toBe(true);
    });

    test('should return true for boundary values', () => {
      expect(SignedInteger16.isInt16(SignedInteger16.MIN_VALUE)).toBe(true);
      expect(SignedInteger16.isInt16(SignedInteger16.MAX_VALUE)).toBe(true);
    });

    test('should return false for numbers outside of 16-bit range', () => {
      expect(SignedInteger16.isInt16(SignedInteger16.MIN_VALUE - 1)).toBe(
        false
      );
      expect(SignedInteger16.isInt16(SignedInteger16.MAX_VALUE + 1)).toBe(
        false
      );
    });

    test('should return false for non-integers', () => {
      expect(SignedInteger16.isInt16(5.5)).toBe(false);
    });
  });

  describe('fromBiasedLittleEndianBytes', () => {
    test('should convert a biased little-endian byte array to Int16', () => {
      const bytes = new Uint8Array([0xff, 0x7f]); // Represents 2^15-1 in little-endian biased representation
      const result = unwrapOk(
        SignedInteger16.fromBiasedLittleEndianBytes(bytes)
      );
      expect(result).toEqual(-1); // Due to the bias subtraction
    });

    test('should return an Err for byte array of length 1', () => {
      const result = unwrapErr(
        SignedInteger16.fromBiasedLittleEndianBytes(new Uint8Array([0xff]))
      );

      expect(result).toEqual(Int16ConversionError);
    });

    test('should return an Err for byte array of length 3', () => {
      const result = unwrapErr(
        SignedInteger16.fromBiasedLittleEndianBytes(
          new Uint8Array([0xff, 0x7f, 0xff])
        )
      );

      expect(result).toEqual(Int16ConversionError);
    });
  });
});
