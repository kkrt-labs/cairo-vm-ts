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

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint16(-5)).toBe(false);
    });
  });

  describe('toUint16', () => {
    test('should convert a valid bigint to Uint16', () => {
      const result = UnsignedInteger.toUint16(5).unwrap();
      expect(result).toEqual(5);
    });

    test('should return an Uint16ConversionError for negative bigints', () => {
      const result = UnsignedInteger.toUint16(-5).unwrapErr();
      expect(result).toEqual(Uint16ConversionError);
    });
  });

  describe('isUint32', () => {
    test('should return true for valid Uint32', () => {
      expect(UnsignedInteger.isUint32(5)).toBe(true);
    });

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint32(-5)).toBe(false);
    });
  });

  describe('toUint32', () => {
    test('should convert a valid bigint to Uint32', () => {
      const result = UnsignedInteger.toUint32(5).unwrap();
      expect(result).toEqual(5);
    });

    test('should return an Uint32ConversionError for negative bigints', () => {
      const result = UnsignedInteger.toUint32(-5).unwrapErr();
      expect(result).toEqual(Uint32ConversionError);
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
      const result = UnsignedInteger.toUint64(5n).unwrap();
      expect(result).toEqual(5n);
    });

    test('should return an Uint64ConversionError for negative bigints', () => {
      const result = UnsignedInteger.toUint64(-5n).unwrapErr();
      expect(result).toEqual(Uint64ConversionError);
    });
  });

  describe('upCast', () => {
    test('should convert a Uint32 to a Uint64', () => {
      const value = UnsignedInteger.toUint32(5).unwrap();
      const result = UnsignedInteger.upCast(value);
      expect(result).toEqual(5n);
    });
  });

  describe('downCastToUint16', () => {
    test('should convert a Uint64 to a Uint16', () => {
      const value = UnsignedInteger.toUint64(5n).unwrap();
      const result = UnsignedInteger.downCastToUint16(value).unwrap();
      expect(result).toEqual(5);
    });
    test('should return an Uint16ConversionError for values > 0xffff', () => {
      const value = UnsignedInteger.toUint64(0x10000n).unwrap();
      const result = UnsignedInteger.downCastToUint16(value).unwrapErr();
      expect(result).toEqual(Uint16ConversionError);
    });
  });

  describe('downCastToUint32', () => {
    test('should convert a Uint64 to a Uint32', () => {
      const value = UnsignedInteger.toUint64(5n).unwrap();
      const result = UnsignedInteger.downCastToUint32(value).unwrap();
      expect(result).toEqual(5);
    });
    test('should return an Uint16ConversionError for values > 0xffffffff', () => {
      const value = UnsignedInteger.toUint64(0x100000000n).unwrap();
      const result = UnsignedInteger.downCastToUint32(value).unwrapErr();
      expect(result).toEqual(Uint32ConversionError);
    });
  });

  describe('uint16And', () => {
    test('should AND two Uint16 and return the result', () => {
      const a = UnsignedInteger.toUint16(0b1010111010101010).unwrap();
      const b = UnsignedInteger.toUint16(0b0101010101010101).unwrap();
      const value = UnsignedInteger.uint16And(a, b);
      expect(value).toEqual(0b10000000000);
    });
  });

  describe('uint16Rhs', () => {
    test('should shift the first value by the second value amount of bits return the result', () => {
      const a = UnsignedInteger.toUint16(0b1010111010101010).unwrap();
      const b = UnsignedInteger.toUint16(5).unwrap();
      const value = UnsignedInteger.uint16Rhs(a, b);
      expect(value).toEqual(0b10101110101);
    });
  });

  describe('uint64And', () => {
    test('should AND two Uint64 and return the result', () => {
      const a = UnsignedInteger.toUint64(0b1010111010101010n).unwrap();
      const b = UnsignedInteger.toUint64(0b0101010101010101n).unwrap();
      const value = UnsignedInteger.uint64And(a, b);
      expect(value).toEqual(0b10000000000n);
    });
  });

  describe('uint64Rhs', () => {
    test('should shift the first value by the second value amount of bits return the result', () => {
      const a = UnsignedInteger.toUint64(0b1010111010101010n).unwrap();
      const b = UnsignedInteger.toUint64(5n).unwrap();
      const value = UnsignedInteger.uint64Rhs(a, b);
      expect(value).toEqual(0b10101110101n);
    });
  });
});
