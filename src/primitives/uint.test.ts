import { test, expect, describe } from 'bun:test';
import { Uint, UnsignedInteger } from './uint';

describe('UnsignedInteger', () => {
  describe('isUint', () => {
    test('should return true for valid Uint', () => {
      expect(UnsignedInteger.isUint(5n)).toBe(true);
    });

    test('should return false for negative bigints', () => {
      expect(UnsignedInteger.isUint(-5n)).toBe(false);
    });
  });

  describe('toUint', () => {
    test('should convert a valid bigint to Uint', () => {
      const result: Uint = UnsignedInteger.toUint(5n);
      expect(result).toEqual(5n);
    });

    test('should throw a TypeError for negative bigints', () => {
      expect(() => UnsignedInteger.toUint(-5n)).toThrow(new TypeError());
    });
  });
});
