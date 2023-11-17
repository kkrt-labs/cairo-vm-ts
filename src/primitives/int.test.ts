import { test, expect, describe } from 'bun:test';
import { SignedInteger16 } from './int'; // adjust the import path accordingly
import { ByteArrayLengthError, PrimitiveError } from 'errors/primitives';

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
});
