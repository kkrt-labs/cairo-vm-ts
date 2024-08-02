import { describe, expect, test } from 'bun:test';
import { nextPowerOfTwo } from './utils';

describe('utils', () => {
  describe('nextPowerOfTwo', () => {
    test.each([
      [0, 1],
      [1, 1],
      [3, 4],
      [31, 32],
      [33, 64],
      [57, 64],
      [28465, 32768],
      [(1 << 62) - 1, 1 << 62],
      [-1, 1],
    ])(
      'should correctly compute the next power of two of a given number',
      (n: number, expected: number) => {
        expect(nextPowerOfTwo(n)).toEqual(expected);
      }
    );
  });
});
