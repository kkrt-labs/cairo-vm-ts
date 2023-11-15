import { test, expect, describe } from 'bun:test';
import { Uint64, UnsignedInteger } from './uint';
import {
  PrimitiveError,
  Uint16ConversionError,
  Uint32ConversionError,
  Uint64ConversionError,
} from 'result/primitives';

describe('UnsignedInteger', () => {
  describe('isUint16', () => {
    test('should return true for valid Uint16', () => {
      expect(UnsignedInteger.isUint16(5)).toBe(true);
    });

    test('should return false for negative numbers', () => {
      expect(UnsignedInteger.isUint16(-5)).toBe(false);
    });

    test('should return false for decimal values', () => {
      expect(UnsignedInteger.isUint16(1.1)).toBe(false);
    });
  });

  describe('toUint16', () => {
    test('should convert a valid bigint to Uint16', () => {
      const { value: result } = UnsignedInteger.toUint16(5);
      expect(result).toEqual(5);
    });

    test('should return an error Uint16ConversionError for negative numbers', () => {
      const { error } = UnsignedInteger.toUint16(-5);
      expect(error).toEqual(new PrimitiveError(Uint16ConversionError));
    });
  });

  describe('isUint32', () => {
    test('should return true for valid Uint32', () => {
      expect(UnsignedInteger.isUint32(5)).toBe(true);
    });

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint32(-5)).toBe(false);
    });

    test('should return false for decimal values', () => {
      expect(UnsignedInteger.isUint32(1.1)).toBe(false);
    });
  });

  describe('toUint32', () => {
    test('should convert a valid bigint to Uint32', () => {
      const { value: result } = UnsignedInteger.toUint32(5);
      expect(result).toEqual(5);
    });

    test('should return an error Uint32ConversionError for negative numbers', () => {
      const { error } = UnsignedInteger.toUint32(-5);
      expect(error).toEqual(new PrimitiveError(Uint32ConversionError));
    });
  });

  describe('isUint64', () => {
    test('should return true for valid Uint64', () => {
      expect(UnsignedInteger.isUint64(5n)).toBe(true);
    });

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint64(-5n)).toBe(false);
    });
  });

  describe('toUint64', () => {
    test('should convert a valid bigint to Uint64', () => {
      const { value: result } = UnsignedInteger.toUint64(5n);
      expect(result).toEqual(5n);
    });

    test('should return an error Uint64ConversionError for negative bigints', () => {
      const { error } = UnsignedInteger.toUint64(-5n);
      expect(error).toEqual(new PrimitiveError(Uint64ConversionError));
    });
  });

  describe('downCastToUint16', () => {
    test('should convert a Uint64 to a Uint16', () => {
      const { value } = UnsignedInteger.toUint64(5n);
      const { value: result } = UnsignedInteger.downCastToUint16(
        value as Uint64
      );
      expect(result).toEqual(5);
    });
    test('should return an error Uint16ConversionError for values > 0xffff', () => {
      const { value } = UnsignedInteger.toUint64(0x10000n);
      const { error } = UnsignedInteger.downCastToUint16(value as Uint64);
      expect(error).toEqual(new PrimitiveError(Uint16ConversionError));
    });
  });
});
