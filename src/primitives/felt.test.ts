import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';

describe('Felt', () => {
  describe('constructor', () => {
    test.each([
      [-10n, new Felt(Felt.PRIME - 10n)],
      [-15n, new Felt(Felt.PRIME - 15n)],
      [-(Felt.PRIME + 10n), new Felt(Felt.PRIME - 10n)],
    ])(
      'should properly initialize a Felt with a negative bigint as parameter',
      (parameter: bigint, result: Felt) => {
        expect(new Felt(parameter)).toStrictEqual(result);
      }
    );

    test.each([
      [Felt.PRIME, new Felt(0n)],
      [Felt.PRIME + 10n, new Felt(10n)],
      [Felt.PRIME + 15n, new Felt(15n)],
      [Felt.PRIME * 2n + 10n, new Felt(10n)],
    ])(
      'should initialize a Felt with r = x % PRIME for x a bigint equal to q*PRIME + r',
      (parameter: bigint, result: Felt) => {
        expect(new Felt(parameter)).toStrictEqual(result);
      }
    );
  });

  describe('conversions', () => {
    test('should convert correctly a felt to a bigint', () => {
      const felt = new Felt(10n);
      const result = felt.toBigInt();
      expect(result).toEqual(10n);
    });
    test('should convert correctly a felt to a number', () => {
      const felt = new Felt(10n);
      const result = Number(felt);
      expect(result).toEqual(10);
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
      const result = a.add(b);
      const expected = new Felt(3000n);
      expect(result.eq(expected)).toBeTrue();
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
      const result = a.sub(b);
      const expected = new Felt(1000n);
      expect(result.eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when subtracting', () => {
      const a = new Felt(2n);
      const b = new Felt(5n);
      const result = a.sub(b);
      const expected = new Felt(Felt.PRIME - 3n);
      expect(result.eq(expected)).toBeTrue();
    });
  });

  describe('mul', () => {
    test('should multiply two felts properly', () => {
      const a = new Felt(10n);
      const b = new Felt(2n);
      const result = a.mul(b);
      const expected = new Felt(20n);
      expect(result.eq(expected)).toBeTrue();
    });
    test('should wrap around the prime field when multiplying', () => {
      const a = new Felt(2n ** 134n);
      const b = new Felt(2n ** 128n);
      const result = a.mul(b);
      const expected = new Felt(
        3618502788665912670123303560417596398778548817217653680365937596310271031297n
      );
      expect(result.eq(expected)).toBeTrue();
    });
  });

  describe('div', () => {
    test('should divide two felts properly', () => {
      const a = new Felt(10n);
      const b = new Felt(2n);
      const result = a.div(b);
      const expected = new Felt(5n);
      expect(result.eq(expected)).toBeTrue();
    });
    test('should go to 0 if a < b in a/b', () => {
      const a = new Felt(5n);
      const b = new Felt(10n);
      const result = a.div(b);
      const expected = new Felt(0n);
      expect(result.eq(expected)).toBeTrue();
    });
  });
});
