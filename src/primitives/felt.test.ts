import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import { BaseError, ErrorType } from 'result/error';
import { OutOfRangeBigInt } from 'result/primitives';

describe('Felt', () => {
  describe('constructor', () => {
    test('should throw if initializing a felt with a negative inner', () => {
      expect(() => new Felt(-10n)).toThrow(
        new BaseError(ErrorType.FeltError, OutOfRangeBigInt)
      );
    });
    test('should throw a FeltError when initializing with a BigInt larger than PRIME', () => {
      const biggerThanPrime = Felt.PRIME + 1n;
      expect(() => new Felt(biggerThanPrime)).toThrow(
        new BaseError(ErrorType.FeltError, OutOfRangeBigInt)
      );
    });
  });

  describe('conversions', () => {
    test('should convert correctly a felt to a number if inner is below Javascript max safe integer', () => {
      const felt = new Felt(10n);
      const { value: result } = felt.toUint64();
      expect(result).toEqual(10n);
    });
    test('should convert correctly a felt to its string representation', () => {
      const felt = new Felt(10n);
      expect(felt.toString()).toEqual('10');
    });
    test('should convert correctly a felt to its hexstring representation', () => {
      const felt = new Felt(10n);
      expect(felt.toHexString()).toEqual('a');
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
      const { value } = a.add(b);
      const expected = new Felt(3000n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when adding', () => {
      const a = new Felt(Felt.PRIME - 1n);
      const b = new Felt(2n);
      const { value } = a.add(b);
      const expected = new Felt(1n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
  });

  describe('sub', () => {
    test('should sub two felts properly', () => {
      const a = new Felt(3000n);
      const b = new Felt(2000n);
      const { value } = a.sub(b);
      const expected = new Felt(1000n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when subtracting', () => {
      const a = new Felt(2n);
      const b = new Felt(5n);
      const { value } = a.sub(b);
      const expected = new Felt(Felt.PRIME - 3n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
  });

  describe('mul', () => {
    test('should multiply two felts properly', () => {
      const a = new Felt(10n);
      const b = new Felt(2n);
      const { value } = a.mul(b);
      const expected = new Felt(20n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when multiplying', () => {
      const a = new Felt(2n ** 134n);
      const b = new Felt(2n ** 128n);
      const { value } = a.mul(b);
      const expected = new Felt(
        3618502788665912670123303560417596398778548817217653680365937596310271031297n
      );
      expect((value as Felt).eq(expected)).toBeTrue();
    });
  });

  describe('div', () => {
    test('should divide two felts properly', () => {
      const a = new Felt(10n);
      const b = new Felt(2n);
      const { value } = a.div(b);
      const expected = new Felt(5n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
    test('should go to 0 if a < b in a/b', () => {
      const a = new Felt(5n);
      const b = new Felt(10n);
      const { value } = a.div(b);
      const expected = new Felt(0n);
      expect((value as Felt).eq(expected)).toBeTrue();
    });
  });

  describe('toUint32', () => {
    test('should return an error if the felt is larger than the max safe integer', () => {
      const a = new Felt(2n ** 53n);
      const { error } = a.toUint32();
      expect(error).toEqual(
        new BaseError(ErrorType.FeltError, OutOfRangeBigInt)
      );
    });
  });
});
