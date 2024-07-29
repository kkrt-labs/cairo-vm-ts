/**
 *  Used for additionnal checks in Proof Mode
 * when using Bitwise and Keccak builtins
 */
export type DilutedPool = {
  unitsPerStep: number;
  spacing: number;
  nBits: number;
};

/**
 * Layout provides a configuration when generating a proof
 * - Builtins: List of available builtins.
 *   segment_arena, gas_builtin and system are not proven.
 * - rcUnits: Range Check Units.
 * - publicMemoryFraction: The ratios total memory cells over public memory cells.
 * - dilutedPool: The diluted pool, used for additionnal checks on Bitwise & Keccak
 * - ratios: Dictionnary mapping each builtin name to its ratio.
 *
 * NOTE: A ratio defines the number of steps over the number of builtin instances.
 * For every ratio steps, we have one instance.
 * An empty ratio represents a dynamic ratio.
 */
export type Layout = {
  builtins: string[];
  rcUnits: number;
  publicMemoryFraction: number;
  dilutedPool?: DilutedPool;
  ratios?: { [key: string]: number };
};

export const DEFAULT_DILUTED_POOL: DilutedPool = {
  unitsPerStep: 16,
  spacing: 4,
  nBits: 16,
};

/**
 * Dictionnary containing all the available layouts:
 * - plain
 * - small
 * - dex
 * - recursive
 * - starknet
 * - starknet_with_keccak
 * - recursive_large_output
 * - recursive_with_poseidon
 * - all_cairo
 * - all_solidity
 * - dynamic
 */
export const layouts: { [key: string]: Layout } = {
  plain: {
    builtins: [],
    rcUnits: 16,
    publicMemoryFraction: 4,
  },
  small: {
    builtins: ['output', 'pedersen', 'range_check', 'ecdsa'],
    rcUnits: 16,
    publicMemoryFraction: 4,
    ratios: {
      pedersen: 8,
      range_check: 8,
      ecdsa: 512,
    },
  },
  dex: {
    builtins: ['output', 'pedersen', 'range_check', 'ecdsa'],
    rcUnits: 4,
    publicMemoryFraction: 4,
    ratios: {
      pedersen: 8,
      range_check: 8,
      ecdsa: 512,
    },
  },
  recursive: {
    builtins: ['output', 'pedersen', 'range_check', 'bitwise'],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {
      pedersen: 128,
      range_check: 8,
      bitwise: 8,
    },
  },
  starknet: {
    builtins: [
      'output',
      'pedersen',
      'range_check',
      'ecdsa',
      'bitwise',
      'ec_op',
      'poseidon',
    ],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: {
      unitsPerStep: 2,
      spacing: 4,
      nBits: 16,
    },
    ratios: {
      pedersen: 32,
      range_check: 16,
      ecdsa: 2048,
      bitwise: 64,
      ec_op: 1024,
      poseidon: 32,
    },
  },
  starknet_with_keccak: {
    builtins: [
      'output',
      'pedersen',
      'range_check',
      'ecdsa',
      'bitwise',
      'ec_op',
      'keccak',
      'poseidon',
    ],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {
      pedersen: 32,
      range_check: 16,
      ecdsa: 2048,
      bitwise: 64,
      ec_op: 1024,
      keccak: 2048,
      poseidon: 32,
    },
  },
  recursive_large_output: {
    builtins: ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {
      pedersen: 128,
      range_check: 8,
      bitwise: 8,
      poseidon: 8,
    },
  },
  recursive_with_poseidon: {
    builtins: ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: {
      unitsPerStep: 8,
      spacing: 4,
      nBits: 16,
    },
    ratios: {
      pedersen: 256,
      range_check: 16,
      bitwise: 16,
      poseidon: 64,
    },
  },
  all_cairo: {
    builtins: [
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
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {
      pedersen: 256,
      range_check: 8,
      ecdsa: 2048,
      bitwise: 16,
      ec_op: 1024,
      keccak: 2048,
      poseidon: 256,
      range_check96: 8,
    },
  },
  all_solidity: {
    builtins: [
      'output',
      'pedersen',
      'range_check',
      'ecdsa',
      'bitwise',
      'ec_op',
    ],
    rcUnits: 8,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {
      pedersen: 8,
      range_check: 8,
      ecdsa: 512,
      bitwise: 256,
      ec_op: 256,
    },
  },
  dynamic: {
    builtins: [
      'output',
      'pedersen',
      'range_check',
      'ecdsa',
      'bitwise',
      'ec_op',
    ],
    rcUnits: 16,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
    ratios: {},
  },
};

/** Array of all the available layouts name */
export const ALL_LAYOUTS = Object.keys(layouts);

/** Return whether `subsequence` is a subsequence of `sequence` */
export function isSubsequence(
  subsequence: string[],
  sequence: string[]
): boolean {
  if (!subsequence.length) return true;

  const index = sequence.findIndex((name) => name === subsequence[0]);
  if (index === -1) return false;

  return isSubsequence(subsequence.slice(1), sequence.slice(index + 1));
}
