export type DilutedPool = {
  unitsPerStep: number;
  spacing: number;
  nBits: number;
};

export type Layout = {
  builtins: string[];
  rcUnits: number;
  publicMemoryFraction: number;
  dilutedPool?: DilutedPool;
};

export const DEFAULT_DILUTED_POOL: DilutedPool = {
  unitsPerStep: 16,
  spacing: 4,
  nBits: 16,
};

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
  },
  dex: {
    builtins: ['output', 'pedersen', 'range_check', 'ecdsa'],
    rcUnits: 4,
    publicMemoryFraction: 4,
  },
  recursive: {
    builtins: ['output', 'pedersen', 'range_check', 'bitwise'],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
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
  },
  recursive_large_output: {
    builtins: ['output', 'pedersen', 'range_check', 'bitwise', 'poseidon'],
    rcUnits: 4,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
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
  },
  dynamic: {
    builtins: ['output'],
    rcUnits: 16,
    publicMemoryFraction: 8,
    dilutedPool: DEFAULT_DILUTED_POOL,
  },
};

export function isSubsequence(
  subsequence: string[],
  sequence: string[]
): boolean {
  return subsequence.reduce(
    (acc, str) => {
      const index = acc.sequence.findIndex((value) => value === str);
      if (index === -1) {
        acc.found = false;
      } else {
        acc.sequence = acc.sequence.slice(index + 1);
      }
      return acc;
    },
    { sequence, found: true }
  ).found;
}
