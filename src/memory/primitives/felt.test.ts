import { test, expect, describe } from 'bun:test';
import { ConversionError, Felt, FeltError } from './felt';

describe('Felt', () => {
  describe('constructor', () => {
    test('should throw if initialising a felt with a negative inner', () => {
      expect(() => new Felt(-10n)).toThrow(new FeltError());
    });
    test('should throw a FeltError when initialising with a BigInt larger than PRIME', () => {
      const biggerThanPrime = Felt.PRIME + 1n;
      expect(() => new Felt(biggerThanPrime)).toThrow(new FeltError());
    });
  });

  describe('conversions', () => {
    test('should convert correctly a felt to a number if inner is below Javascript max safe integer', () => {
      const felt = new Felt(10n);
      expect(felt.toNumber()).toEqual(10);
    });
    test('should convert correctly a felt to its string representation', () => {
      const felt = new Felt(10n);
      expect(felt.toString()).toEqual('10');
    });
    test('should convert correctly a felt to its hexstring representation', () => {
      const felt = new Felt(10n);
      expect(felt.toHexString()).toEqual('a');
    });
    test('should fail number conversion when felt inner > JS max number', () => {
      const felt = new Felt(BigInt(Number.MAX_SAFE_INTEGER + 1));
      expect(() => felt.toNumber()).toThrow(new ConversionError());
    });
  });

  describe('eq', () => {
    test('should assert equality of two identical felts', () => {
      const a = new Felt(1000n);
      const b = new Felt(1000n);
      expect(a.eq(b)).toBeTrue();
    });
    test('should assert inequality of two different felts', () => {
      const a = new Felt(10n);
      const b = new Felt(2n);
      expect(a.eq(b)).toBeFalse();
    });
  });
  describe('add', () => {
    test('should add two felts properly', () => {
      const a = new Felt(1000n);
      const b = new Felt(2000n);
      const c = a.add(b);
      const expected = new Felt(3000n);
      expect(c.eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when adding', () => {
      const a = new Felt(Felt.PRIME - 1n);
      const b = new Felt(2n);
      const result = a.add(b);
      const expected = new Felt(1n);
      expect(result.eq(expected)).toBeTrue();
    });
  });
  describe('sub', () => {
    test('should sub two felts properly', () => {
      const a = new Felt(3000n);
      const b = new Felt(2000n);
      const c = a.sub(b);
      const expected = new Felt(1000n);
      expect(c.eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when subtracting', () => {
      const a = new Felt(2n);
      const b = new Felt(5n);
      const result = a.sub(b);
      const expected = new Felt(Felt.PRIME - 3n);
      expect(result.eq(expected)).toBeTrue();
    });
  });
});
