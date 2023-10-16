import { test, expect, describe } from 'bun:test';
import { Uint64ConversionError, UnsignedInteger } from './uint';

describe('UnsignedInteger', () => {
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
});
