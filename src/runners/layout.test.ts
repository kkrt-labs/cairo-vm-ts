import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_DILUTED_POOL,
  DilutedPool,
  isSubsequence,
  layouts,
} from './layout';

describe('layouts', () => {
  describe('Layout', () => {
    test.each([
      ['plain', [], 16, 4],
      ['small', ['output', 'pedersen', 'range_check', 'ecdsa'], 16, 4],
      ['dex', ['output', 'pedersen', 'range_check', 'ecdsa'], 4, 4],
    ])(
      'should have the correct values with undefined DilutedPool',
      (layoutName, builtins, rcUnits, publicMemoryFraction) => {
        const layout = layouts[layoutName];
        expect(layout.builtins).toEqual(builtins);
        expect(layout.rcUnits).toEqual(rcUnits);
        expect(layout.publicMemoryFraction).toEqual(publicMemoryFraction);
        expect(layout.dilutedPool).toBeUndefined();
      }
    );

    test('DEFAULT_DILUTED_POOL should have the expected values', () => {
      const expectedDefaultDilutedPool: DilutedPool = {
        unitsPerStep: 16,
        spacing: 4,
        nBits: 16,
      };

      expect(DEFAULT_DILUTED_POOL).toEqual(expectedDefaultDilutedPool);
    });

    test.each([
      [
        'recursive',
        ['output', 'pedersen', 'range_check', 'bitwise'],
        4,
        8,
        DEFAULT_DILUTED_POOL,
      ],
      [
        'starknet',
        [
          'output',
          'pedersen',
          'range_check',
          'ecdsa',
          'bitwise',
          'ec_op',
          'poseidon',
        ],
        4,
        8,
        {
          unitsPerStep: 2,
          spacing: 4,
          nBits: 16,
        },
      ],
      [
        'starknet_with_keccak',
        [
          'output',
          'pedersen',
          'range_check',
          'ecdsa',
          'bitwise',
          'ec_op',
          'keccak',
          'poseidon',
        ],
        4,
        8,
        DEFAULT_DILUTED_POOL,
      ],
      [
        'recursive_large_output',
        ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
        4,
        8,
        DEFAULT_DILUTED_POOL,
      ],
      [
        'recursive_with_poseidon',
        ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
        4,
        8,
        {
          unitsPerStep: 8,
          spacing: 4,
          nBits: 16,
        },
      ],
      [
        'all_cairo',
        [
          'output',
          'pedersen',
          'range_check',
          'ecdsa',
          'bitwise',
          'ec_op',
          'keccak',
          'poseidon',
          'range_check96',
        ],
        4,
        8,
        DEFAULT_DILUTED_POOL,
      ],
      [
        'all_solidity',
        ['output', 'pedersen', 'range_check', 'ecdsa', 'bitwise', 'ec_op'],
        8,
        8,
        DEFAULT_DILUTED_POOL,
      ],
      ['dynamic', ['output'], 16, 8, DEFAULT_DILUTED_POOL],
    ])(
      'should have the correct values with a defined DilutedPool',
      (
        layoutName: string,
        builtins: string[],
        rcUnits: number,
        publicMemoryFraction: number,
        dilutedPool: DilutedPool
      ) => {
        const layout = layouts[layoutName];
        expect(layout.builtins).toEqual(builtins);
        expect(layout.rcUnits).toEqual(rcUnits);
        expect(layout.publicMemoryFraction).toEqual(publicMemoryFraction);
        expect(layout.dilutedPool).toEqual(dilutedPool);
      }
    );
  });

  describe('isSubsequence', () => {
    test.each([
      [[], ['output', 'pedersen', 'range_check'], true],
      [
        ['output', 'pedersen', 'range_check'],
        ['output', 'pedersen', 'range_check', 'ecdsa'],
        true,
      ],
      [
        ['output', 'range_check', 'pedersen'],
        ['output', 'pedersen', 'range_check', 'ecdsa'],
        false,
      ],
    ])(
      'should correctly find subsequences',
      (subsequence, sequence, expected) => {
        expect(isSubsequence(subsequence, sequence)).toEqual(expected);
      }
    );
  });
});
