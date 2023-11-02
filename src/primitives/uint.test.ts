import { test, expect, describe } from 'bun:test';
import {
  Uint16ConversionError,
  Uint32ConversionError,
  Uint64ConversionError,
  UnsignedInteger,
} from './uint';

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
      const result = UnsignedInteger.toUint16(5);
      expect(result).toEqual(5);
    });

    test('should throw an error Uint16ConversionError for negative numbers', () => {
      expect(() => UnsignedInteger.toUint16(-5)).toThrow(Uint16ConversionError);
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
      const result = UnsignedInteger.toUint32(5);
      expect(result).toEqual(5);
    });

    test('should throw an error Uint32ConversionError for negative numbers', () => {
      expect(() => UnsignedInteger.toUint32(-5)).toThrow(Uint32ConversionError);
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
      const result = UnsignedInteger.toUint64(5n);
      expect(result).toEqual(5n);
    });

    test('should throw an error Uint64ConversionError for negative bigints', () => {
      expect(() => UnsignedInteger.toUint64(-5n)).toThrow(
        Uint64ConversionError
      );
    });
  });

  describe('downCastToUint16', () => {
    test('should convert a Uint64 to a Uint16', () => {
      const value = UnsignedInteger.toUint64(5n);
      const result = UnsignedInteger.downCastToUint16(value);
      expect(result).toEqual(5);
    });
    test('should throw an error Uint16ConversionError for values > 0xffff', () => {
      const value = UnsignedInteger.toUint64(0x10000n);
      expect(() => UnsignedInteger.downCastToUint16(value)).toThrow(
        Uint16ConversionError
      );
    });
  });
});
