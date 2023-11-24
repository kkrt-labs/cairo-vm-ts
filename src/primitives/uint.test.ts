import { test, expect, describe } from 'bun:test';
import { UnsignedInteger } from './uint';
import {
  PrimitiveError,
  Uint16ConversionError,
  Uint32ConversionError,
  Uint64ConversionError,
} from 'errors/primitives';

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

  describe('ensureUint16', () => {
    test('should ensure a number is a valid Uint16', () => {
      expect(() => UnsignedInteger.ensureUint16(5)).not.toThrow();
    });

    test('should throw an error Uint16ConversionError for negative numbers', () => {
      expect(() => UnsignedInteger.ensureUint16(-5)).toThrow(
        new PrimitiveError(Uint16ConversionError)
      );
    });
  });

  describe('isUint53', () => {
    test('should return true for valid Uint32', () => {
      expect(UnsignedInteger.isUint53(5)).toBe(true);
    });

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint53(-5)).toBe(false);
    });

    test('should return false for decimal values', () => {
      expect(UnsignedInteger.isUint53(1.1)).toBe(false);
    });
  });

  describe('ensureUint53', () => {
    test('should ensure a number is a valid Uint32', () => {
      expect(() => UnsignedInteger.ensureUint53(5)).not.toThrow();
    });

    test('should throw an error Uint32ConversionError for negative numbers', () => {
      expect(() => UnsignedInteger.ensureUint53(-5)).toThrow(
        new PrimitiveError(Uint32ConversionError)
      );
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

  describe('ensureUint64', () => {
    test('should ensure a bigint is a Uint64', () => {
      const result = UnsignedInteger.ensureUint64(5n);
      expect(() => UnsignedInteger.ensureUint64(5n)).not.toThrow();
    });

    test('should throw an error Uint64ConversionError for negative bigints', () => {
      expect(() => UnsignedInteger.ensureUint64(-5n)).toThrow(
        new PrimitiveError(Uint64ConversionError)
      );
    });
  });

  describe('downCastToUint16', () => {
    test('should downcast a bigint to a Uint16', () => {
      const result = UnsignedInteger.downCastToUint16(5n);
      expect(result).toEqual(5);
    });
    test('should throw an error Uint16ConversionError for values > 0xffff', () => {
      expect(() => UnsignedInteger.downCastToUint16(0x10000n)).toThrow(
        new PrimitiveError(Uint16ConversionError)
      );
    });
  });
});
