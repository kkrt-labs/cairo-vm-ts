import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_DILUTED_POOL,
  DilutedPool,
  isSubsequence,
  layouts,
} from './layout';

describe('layouts', () => {
  describe('Layout', () => {
    test('plain layout should the right values', () => {
      const plain = layouts['plain'];
      expect(plain.builtins).toEqual([]);
      expect(plain.rcUnits).toEqual(16);
      expect(plain.publicMemoryFraction).toEqual(4);
      expect(plain.dilutedPool).toBeUndefined();
      expect(plain.ratios).toBeUndefined();
    });

    test.each([
      [
        'small',
        ['output', 'pedersen', 'range_check', 'ecdsa'],
        16,
        4,
        { pedersen: 8, range_check: 8, ecdsa: 512 },
      ],
      [
        'dex',
        ['output', 'pedersen', 'range_check', 'ecdsa'],
        4,
        4,
        { pedersen: 8, range_check: 8, ecdsa: 512 },
      ],
    ])(
      'should have the correct values with undefined DilutedPool',
      (layoutName, builtins, rcUnits, publicMemoryFraction, ratios) => {
        const layout = layouts[layoutName];
        expect(layout.builtins).toEqual(builtins);
        expect(layout.rcUnits).toEqual(rcUnits);
        expect(layout.publicMemoryFraction).toEqual(publicMemoryFraction);
        expect(layout.dilutedPool).toBeUndefined();
        expect(layout.ratios).toEqual(ratios);
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
        {
          pedersen: 128,
          range_check: 8,
          bitwise: 8,
        },
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
        {
          pedersen: 32,
          range_check: 16,
          ecdsa: 2048,
          bitwise: 64,
          ec_op: 1024,
          poseidon: 32,
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
        {
          pedersen: 32,
          range_check: 16,
          ecdsa: 2048,
          bitwise: 64,
          ec_op: 1024,
          keccak: 2048,
          poseidon: 32,
        },
      ],
      [
        'recursive_large_output',
        ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
        4,
        8,
        DEFAULT_DILUTED_POOL,
        {
          pedersen: 128,
          range_check: 8,
          bitwise: 8,
          poseidon: 8,
        },
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
        {
          pedersen: 256,
          range_check: 16,
          bitwise: 16,
          poseidon: 64,
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
        {
          pedersen: 256,
          range_check: 8,
          ecdsa: 2048,
          bitwise: 16,
          ec_op: 1024,
          keccak: 2048,
          poseidon: 256,
          range_check96: 8,
        },
      ],
      [
        'all_solidity',
        ['output', 'pedersen', 'range_check', 'ecdsa', 'bitwise', 'ec_op'],
        8,
        8,
        DEFAULT_DILUTED_POOL,
        {
          pedersen: 8,
          range_check: 8,
          ecdsa: 512,
          bitwise: 256,
          ec_op: 256,
        },
      ],
      [
        'dynamic',
        ['output', 'pedersen', 'range_check', 'ecdsa', 'bitwise', 'ec_op'],
        16,
        8,
        DEFAULT_DILUTED_POOL,
        {},
      ],
    ])(
      'should have the correct values with a defined DilutedPool and ratios',
      (
        layoutName: string,
        builtins: string[],
        rcUnits: number,
        publicMemoryFraction: number,
        dilutedPool: DilutedPool,
        ratios: { [key: string]: number }
      ) => {
        const layout = layouts[layoutName];
        expect(layout.builtins).toEqual(builtins);
        expect(layout.rcUnits).toEqual(rcUnits);
        expect(layout.publicMemoryFraction).toEqual(publicMemoryFraction);
        expect(layout.dilutedPool).toEqual(dilutedPool);
        expect(layout.ratios).toEqual(ratios);
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
