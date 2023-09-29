import { test, expect, describe } from 'bun:test';
import { Uint64, UnsignedInteger } from './uint';

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
      const result: Uint64 = UnsignedInteger.toUint64(5n);
      expect(result).toEqual(5n);
    });

    test('should throw a TypeError for negative bigints', () => {
      expect(() => UnsignedInteger.toUint64(-5n)).toThrow(new TypeError());
    });
  });
});
