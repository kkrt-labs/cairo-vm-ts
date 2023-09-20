import { test, expect, describe } from 'bun:test';
import { Uint, UnsignedInteger } from './uint';

describe('UnsignedInteger', () => {
  describe('isUint', () => {
    test('should return true for valid Uint', () => {
      expect(UnsignedInteger.isUint(5)).toBe(true);
    });

    test('should return false for negative numbers', () => {
      expect(UnsignedInteger.isUint(-5)).toBe(false);
    });

    test('should return false for floating point numbers', () => {
      expect(UnsignedInteger.isUint(0.5)).toBe(false);
    });

    test('should return false for numbers greater than Number.MAX_SAFE_INTEGER', () => {
      expect(UnsignedInteger.isUint(Number.MAX_SAFE_INTEGER + 1)).toBe(false); // Though this test is tricky because JavaScript will represent the number in a different way
    });
  });

  describe('toUint', () => {
    test('should convert a valid number to Uint', () => {
      const result: Uint = UnsignedInteger.toUint(5);
      expect(result).toEqual(5);
    });

    test('should throw a TypeError for negative numbers', () => {
      expect(() => UnsignedInteger.toUint(-5)).toThrow(TypeError);
    });

    test('should throw a TypeError for floating point numbers', () => {
      expect(() => UnsignedInteger.toUint(0.5)).toThrow(TypeError);
    });

    test('should throw a TypeError for numbers greater than Number.MAX_SAFE_INTEGER', () => {
      expect(() => UnsignedInteger.toUint(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        TypeError
      );
    });
  });
});
